import codecs
import functools
import os
import re
from urllib import request, parse

import pathvalidate
import requests
from azapi import azapi
from bs4 import BeautifulSoup
from sentry_sdk import capture_exception

try:
    import sonar_ai.crawlers.QQCrawler as QQCrawler
    import sonar_ai.model_traditional_conversion.langconv as langconv
except ModuleNotFoundError:
    pass

# With Sync.
SERVICES_LIST1 = []

# Without Sync.
SERVICES_LIST2 = []


class Config:
    PROXY = request.getproxies()

    if os.name == "nt":
        SETTINGS_DIR = f"{os.getenv('APPDATA')}\\SonarAI\\"
    else:
        SETTINGS_DIR = f"{os.path.expanduser('~')}/.SonarAI/"
    DEFAULT_LYRICS_DIR = os.path.join(SETTINGS_DIR, "lyrics")
    LYRICS_DIR = DEFAULT_LYRICS_DIR


# Use a current browser UA string — ancient Maemo UA was being blocked by sites
UA = "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0"

# Default request timeout in seconds for all scraping calls
REQUEST_TIMEOUT = 15


def _is_safe_url(url: str) -> bool:
    """Return True only for http/https URLs — rejects file://, data:, etc."""
    try:
        parsed = parse.urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def lyrics_service(_func=None, *, synced=False, enabled=True):
    def _decorator_lyrics_service(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except requests.exceptions.RequestException as error:
                print("%s: %s" % (func.__name__, error))
            except Exception as e:
                capture_exception(e)

        if enabled:
            if synced:
                SERVICES_LIST1.append(wrapper)
            else:
                SERVICES_LIST2.append(wrapper)
        return wrapper

    if _func is None:
        return _decorator_lyrics_service
    else:
        return _decorator_lyrics_service(_func)


@lyrics_service(synced=True)
def _local(song):
    service_name = "Local"

    if os.path.isdir(Config.LYRICS_DIR):
        path_song_name = pathvalidate.sanitize_filename(song.name.lower())
        path_artist_name = pathvalidate.sanitize_filename(song.artist.lower())
        for file in os.listdir(Config.LYRICS_DIR):
            file = os.path.join(Config.LYRICS_DIR, file)
            if os.path.isfile(file):
                file_parts = os.path.splitext(file)
                file_extension = file_parts[1].lower()
                if file_extension in (".txt", ".lrc"):
                    file_name = file_parts[0].lower()
                    if path_song_name in file_name and path_artist_name in file_name:
                        with open(file, "r", encoding="UTF-8") as lyrics_file:
                            lyrics = lyrics_file.read()
                        timed = file_extension == ".lrc"
                        url = f"file:///{os.path.abspath(file)}"
                        return lyrics, url, service_name, timed


@lyrics_service(synced=True)
def _rentanadviser(song):
    service_name = "RentAnAdviser"

    search_url = (
        "https://www.rentanadviser.com/en/subtitles/subtitles4songs.aspx?%s"
        % parse.urlencode({"src": f"{song.artist} {song.name}"})
    )
    search_results = requests.get(
        search_url,
        proxies=Config.PROXY,
        headers={"User-Agent": UA},
        timeout=REQUEST_TIMEOUT,
    )
    soup = BeautifulSoup(search_results.text, "html.parser")
    table = soup.find(id="tablecontainer")
    if not table:
        return None
    result_links = table.find_all("a")

    for result_link in result_links:
        if result_link["href"] != "subtitles4songs.aspx":
            lower_title = result_link.get_text().lower()
            if song.artist.lower() in lower_title and song.name.lower() in lower_title:
                url = f"https://www.rentanadviser.com/en/subtitles/{result_link['href']}&type=lrc"
                possible_text = requests.get(
                    url,
                    proxies=Config.PROXY,
                    headers={"User-Agent": UA},
                    timeout=REQUEST_TIMEOUT,
                )
                soup = BeautifulSoup(possible_text.text, "html.parser")

                ev_tag = soup.find(id="__EVENTVALIDATION")
                vs_tag = soup.find(id="__VIEWSTATE")
                if not ev_tag or not vs_tag:
                    continue
                event_validation = ev_tag["value"]
                view_state = vs_tag["value"]

                lrc = requests.post(
                    possible_text.url,
                    {
                        "__EVENTTARGET": "ctl00$ContentPlaceHolder1$btnlyrics",
                        "__EVENTVALIDATION": event_validation,
                        "__VIEWSTATE": view_state,
                    },
                    headers={"User-Agent": UA, "referer": possible_text.url},
                    proxies=Config.PROXY,
                    cookies=search_results.cookies,
                    timeout=REQUEST_TIMEOUT,
                )

                return lrc.text, possible_text.url, service_name, True


@lyrics_service(synced=True)
def _megalobiz(song):
    service_name = "Megalobiz"

    search_url = "https://www.megalobiz.com/search/all?%s" % parse.urlencode(
        {"qry": f"{song.artist} {song.name}", "display": "more"}
    )
    search_results = requests.get(
        search_url, proxies=Config.PROXY, timeout=REQUEST_TIMEOUT
    )
    soup = BeautifulSoup(search_results.text, "html.parser")
    container = soup.find(id="list_entity_container")
    if not container:
        return None
    result_links = container.find_all("a", class_="entity_name")

    for result_link in result_links:
        lower_title = result_link.get_text().lower()
        if song.artist.lower() in lower_title and song.name.lower() in lower_title:
            raw_href = result_link.get("href", "")
            # Only follow relative paths to stay on megalobiz.com
            if raw_href.startswith("http://") or raw_href.startswith("https://"):
                continue
            url = f"https://www.megalobiz.com{raw_href}"
            possible_text = requests.get(
                url, proxies=Config.PROXY, timeout=REQUEST_TIMEOUT
            )
            soup = BeautifulSoup(possible_text.text, "html.parser")

            details = soup.find("div", class_="lyrics_details")
            if not details or not details.span:
                continue
            lrc = details.span.get_text()

            return lrc, possible_text.url, service_name, True


@lyrics_service(synced=True, enabled=False)
def _qq(song):
    qq = QQCrawler.QQCrawler()
    sid = qq.getSongId(artist=song.artist, song=song.name)
    url = qq.getLyticURI(sid)

    lrc_string = ""
    for line in requests.get(url, proxies=Config.PROXY).text.splitlines():
        line_text = line.split("]")
        lrc_string += "]".join(line_text[:-1]) + langconv.Converter("zh-hant").convert(
            line_text
        )

    return lrc_string, url, qq.name, True


@lyrics_service(synced=True)
def _lyricsify(song):
    service_name = "Lyricsify"

    search_url = "https://www.lyricsify.com/search?%s" % parse.urlencode(
        {"q": f"{song.artist} {song.name}"}
    )
    search_results = requests.get(
        search_url,
        proxies=Config.PROXY,
        headers={"User-Agent": UA},
        timeout=REQUEST_TIMEOUT,
    )
    soup = BeautifulSoup(search_results.text, "html.parser")

    result_container = soup.find("div", class_="sub")

    if result_container:
        result_list = result_container.find_all("div", class_="li")

        if result_list:
            for result in result_list:
                result_link = result.find("a")
                if not result_link:
                    continue
                name = result_link.get_text().lower()
                if song.artist.lower() in name and song.name.lower() in name:
                    url = f"https://www.lyricsify.com{result_link['href']}?download"
                    lyrics_page = requests.get(
                        url,
                        proxies=Config.PROXY,
                        headers={"User-Agent": UA},
                        timeout=REQUEST_TIMEOUT,
                    )
                    soup = BeautifulSoup(lyrics_page.text, "html.parser")

                    iframe = soup.find(id="iframe_download")
                    if not iframe:
                        continue
                    download_link = iframe["src"]
                    if not _is_safe_url(download_link):
                        continue
                    lrc = requests.get(
                        download_link,
                        proxies=Config.PROXY,
                        cookies=lyrics_page.cookies,
                        headers={"User-Agent": UA},
                        timeout=REQUEST_TIMEOUT,
                    ).text
                    return lrc, lyrics_page.url, service_name, True


@lyrics_service(synced=True)
def _rclyricsband(song):
    service_name = "RC Lyrics Band"
    search_results = requests.get(
        "https://rclyricsband.com/",
        params={"s": "%s %s" % (song.artist, song.name)},
        proxies=Config.PROXY,
        timeout=REQUEST_TIMEOUT,
    )
    search_soup = BeautifulSoup(search_results.text, "html.parser")

    main = search_soup.find(id="main")
    if not main:
        return None

    for result in main.find_all("article"):
        title_block = result.find(class_="elementor-post__title")
        if not title_block:
            continue
        title_link = title_block.find("a")
        if not title_link:
            continue
        lower_title = title_link.get_text().lower()
        if song.artist.lower() in lower_title and song.name.lower() in lower_title:
            song_href = title_link["href"]
            if not _is_safe_url(song_href):
                continue
            song_page = requests.get(song_href, timeout=REQUEST_TIMEOUT)
            song_page_soup = BeautifulSoup(song_page.text, "html.parser")
            lrc_download_button = song_page_soup.find(
                lambda tag: tag.name == "a" and "LRC Download" in tag.text
            )
            if not lrc_download_button:
                continue
            download_href = lrc_download_button["href"]
            if not _is_safe_url(download_href):
                continue
            lyrics = requests.get(
                download_href, timeout=REQUEST_TIMEOUT
            ).text
            return lyrics, song_page.url, service_name, True


@lyrics_service
def _musixmatch(song):
    service_name = "Musixmatch"

    def extract_mxm_props(soup_page):
        scripts = soup_page.find_all("script")
        for script in scripts:
            if script and script.contents and "__mxmProps" in script.contents[0]:
                return script.contents[0]

    search_url = "https://www.musixmatch.com/search/%s-%s" % (
        song.artist.replace(" ", "-"),
        song.name.replace(" ", "-"),
    )
    header = {
        "User-Agent": "curl/7.9.8 (i686-pc-linux-gnu) libcurl 7.9.8 (OpenSSL 0.9.6b) (ipv6 enabled)"
    }
    search_results = requests.get(
        search_url, headers=header, proxies=Config.PROXY, timeout=REQUEST_TIMEOUT
    )
    soup = BeautifulSoup(search_results.text, "html.parser")
    props = extract_mxm_props(soup)
    if props:
        page = re.findall('"track_share_url":"([^"]*)', props)
        if page:
            url = codecs.decode(page[0], "unicode-escape")
            lyrics_page = requests.get(
                url, headers=header, proxies=Config.PROXY, timeout=REQUEST_TIMEOUT
            )
            soup = BeautifulSoup(lyrics_page.text, "html.parser")
            props = extract_mxm_props(soup)
            if props and '"body":"' in props:
                lyrics = props.split('"body":"')[1].split('","language"')[0]
                lyrics = lyrics.replace("\\n", "\n")
                lyrics = lyrics.replace("\\", "")
                album = soup.find(class_="mxm-track-footer__album")
                if album:
                    song.album = album.find(class_="mui-cell__title").getText()
                if lyrics.strip():
                    return lyrics, lyrics_page.url, service_name


@lyrics_service
def _songmeanings(song):
    service_name = "Songmeanings"

    # Use HTTPS to prevent plaintext credential/session interception; encode query params
    search_url = "https://songmeanings.com/m/query/?%s" % parse.urlencode({
        "q": f"{song.artist} {song.name}"
    })
    search_results = requests.get(
        search_url, proxies=Config.PROXY, timeout=REQUEST_TIMEOUT
    )
    soup = BeautifulSoup(search_results.text, "html.parser")
    url = ""
    for link in soup.find_all("a", href=True):
        if "songmeanings.com/m/songs/view/" in link["href"]:
            url = f"https:{link['href']}"
            break
        elif "/m/songs/view/" in link["href"]:
            result = f"https://songmeanings.com{link['href']}"
            lyrics_page = requests.get(
                result, proxies=Config.PROXY, timeout=REQUEST_TIMEOUT
            )
            soup = BeautifulSoup(lyrics_page.text, "html.parser")
            url = lyrics_page.url
            break
    lis = soup.find_all("ul", attrs={"data-inset": True})
    if len(lis) > 1:
        lyrics = lis[1].find_all("li")[1].getText()
        # lyrics = lyrics.encode('cp437', errors='replace').decode('utf-8', errors='replace')
        if "We are currently missing these lyrics." not in lyrics:
            return lyrics, url, service_name


@lyrics_service
def _songlyrics(song):
    service_name = "Songlyrics"
    artistm = song.artist.replace(" ", "-")
    songm = song.name.replace(" ", "-")
    url = f"https://www.songlyrics.com/{artistm}/{songm}-lyrics"
    lyrics_page = requests.get(url, proxies=Config.PROXY, timeout=REQUEST_TIMEOUT)
    soup = BeautifulSoup(lyrics_page.text, "html.parser")
    lyrics_container = soup.find(id="songLyricsDiv")
    if lyrics_container:
        lyrics = lyrics_container.get_text()
        if "Sorry, we have no" not in lyrics and "We do not have" not in lyrics:
            title = soup.find("div", class_="pagetitle")
            if title:
                for info in title.find_all("p"):
                    if "Album:" in info.get_text():
                        song.album = info.find("a").get_text()
                        break
            return lyrics, lyrics_page.url, service_name


@lyrics_service
def _genius(song):
    service_name = "Genius"
    url = "https://genius.com/%s-%s-lyrics" % (
        song.artist.replace(" ", "-"),
        song.name.replace(" ", "-"),
    )
    lyrics_page = requests.get(url, proxies=Config.PROXY, timeout=REQUEST_TIMEOUT)
    soup = BeautifulSoup(lyrics_page.text, "html.parser")
    lyrics_container = soup.find("div", {"class": "lyrics"})
    if lyrics_container:
        lyrics = lyrics_container.get_text()
        if song.artist.lower().replace(" ", "") in soup.text.lower().replace(" ", ""):
            return lyrics, lyrics_page.url, service_name


@lyrics_service
def _versuri(song):
    service_name = "Versuri"
    search_url = "https://www.versuri.ro/q/%s+%s/" % (
        song.artist.replace(" ", "+").lower(),
        song.name.replace(" ", "+").lower(),
    )
    search_results = requests.get(
        search_url, proxies=Config.PROXY, timeout=REQUEST_TIMEOUT
    )
    soup = BeautifulSoup(search_results.text, "html.parser")
    for search_results in soup.findAll("a"):
        raw_href = search_results.get("href", "")
        if "/versuri/" in raw_href:
            # Reject absolute URLs from scraped HTML — only allow relative paths
            if raw_href.startswith("http://") or raw_href.startswith("https://"):
                continue
            link_text = search_results.getText().lower()
            if song.artist.lower() in link_text and song.name.lower() in link_text:
                url = "https://www.versuri.ro" + raw_href
                lyrics_page = requests.get(
                    url, proxies=Config.PROXY, timeout=REQUEST_TIMEOUT
                )
                page_soup = BeautifulSoup(lyrics_page.text, "html.parser")
                content_divs = page_soup.find_all("div", {"id": "pagecontent"})
                if not content_divs:
                    continue
                content = content_divs[0]
                # Extract lyrics text using BeautifulSoup instead of raw string slicing
                # Remove script tags, then collect <br/>-separated text nodes
                for script in content.find_all("script"):
                    script.decompose()
                lyrics_lines = []
                for element in content.descendants:
                    if hasattr(element, "name") and element.name == "br":
                        lyrics_lines.append("\n")
                    elif isinstance(element, str) and element.strip():
                        lyrics_lines.append(element.strip())
                lyrics = " ".join(lyrics_lines).replace(" \n ", "\n").strip()
                if "nu există" not in lyrics and lyrics:
                    return lyrics, lyrics_page.url, service_name


@lyrics_service
def _azapi(song):
    service = "Azapi"

    api = azapi.AZlyrics("duckduckgo", accuracy=0.5, proxies=Config.PROXY)

    if song.artist:
        api.artist = song.artist
        api.title = song.name

        try:
            songs = api.getSongs()
        except requests.exceptions.RequestException:
            api.search_engine = "google"
            songs = api.getSongs()

        if song.name in songs:
            result_song = songs[song.name]

            song.album = result_song["album"]
            if result_song["year"]:
                song.year = int(result_song["year"])

            lyrics = api.getLyrics(url=result_song["url"])

            if isinstance(lyrics, str):
                return lyrics, result_song["url"], service
