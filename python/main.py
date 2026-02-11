#!/usr/bin/env python3
"""
SonarAI Python Backend - IPC Entry Point
Exposes lyrics fetching and song detection to Electron via JSON-RPC
"""
import os
import sys

# Ensure we can import from same directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ipc_server import IPCServer
import backend
import services as s
from backend import Song, SpotifyStreamingService, TidalStreamingService, VlcMediaPlayer

# Current streaming service (configurable via IPC)
current_service = SpotifyStreamingService()

# Service name to class mapping
SERVICES = {
    "spotify": SpotifyStreamingService,
    "tidal": TidalStreamingService,
    "vlc": VlcMediaPlayer,
}


def get_current_song(service_name: str = None) -> dict:
    """
    Get the currently playing song from the media player.
    Returns dict with artist, title, raw_title, or null if nothing playing.
    """
    global current_service

    if service_name and service_name.lower() in SERVICES:
        current_service = SERVICES[service_name.lower()]()

    window_title = backend.get_window_title(current_service)

    if not window_title or window_title in current_service.get_not_playing_windows_title():
        return None

    song = Song.get_from_string(window_title)

    return {
        "artist": song.artist,
        "title": song.name,
        "raw_title": window_title,
        "service": str(current_service)
    }


def get_lyrics(artist: str, title: str, sync: bool = True) -> dict:
    """
    Fetch lyrics for a song.
    Returns dict with lyrics, url, service_name, timed (bool), or error.
    """
    song = Song(artist, title)

    try:
        result = backend.get_lyrics(song, sync=sync)

        return {
            "lyrics": result.lyrics,
            "url": result.url,
            "service_name": result.service_name,
            "timed": result.timed,
            "album": song.album if song.album != "UNKNOWN" else None,
            "year": song.year if song.year > 0 else None,
        }
    except Exception as e:
        return {
            "lyrics": f"Error: {str(e)}",
            "url": "",
            "service_name": "---",
            "timed": False,
            "error": str(e)
        }


def next_lyrics(artist: str, title: str, sync: bool = True) -> dict:
    """
    Get alternative lyrics from the next available source.
    Same return format as get_lyrics.
    """
    song = Song(artist, title)

    try:
        result = backend.next_lyrics(song, sync=sync)

        return {
            "lyrics": result.lyrics,
            "url": result.url,
            "service_name": result.service_name,
            "timed": result.timed,
            "album": song.album if song.album != "UNKNOWN" else None,
            "year": song.year if song.year > 0 else None,
        }
    except Exception as e:
        return {
            "lyrics": f"Error: {str(e)}",
            "url": "",
            "service_name": "---",
            "timed": False,
            "error": str(e)
        }


def save_lyrics(artist: str, title: str, lyrics: str, timed: bool = False) -> dict:
    """
    Save lyrics to local file.
    Returns dict with success status and file path.
    """
    import pathvalidate

    # Ensure lyrics directory exists
    os.makedirs(s.Config.LYRICS_DIR, exist_ok=True)

    # Sanitize filename
    safe_artist = pathvalidate.sanitize_filename(artist)
    safe_title = pathvalidate.sanitize_filename(title)
    extension = ".lrc" if timed else ".txt"
    filename = f"{safe_artist} - {safe_title}{extension}"
    filepath = os.path.join(s.Config.LYRICS_DIR, filename)

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(lyrics)

        return {
            "success": True,
            "path": filepath
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def set_lyrics_directory(path: str) -> dict:
    """
    Set custom lyrics directory.
    """
    if os.path.isdir(path):
        s.Config.LYRICS_DIR = path
        return {"success": True, "path": path}
    else:
        return {"success": False, "error": "Directory does not exist"}


def get_config() -> dict:
    """
    Get current configuration.
    """
    return {
        "lyrics_dir": s.Config.LYRICS_DIR,
        "settings_dir": s.Config.SETTINGS_DIR,
        "default_lyrics_dir": s.Config.DEFAULT_LYRICS_DIR,
        "synced_sources": len(s.SERVICES_LIST1),
        "unsynced_sources": len(s.SERVICES_LIST2),
    }


def set_service(service_name: str) -> dict:
    """
    Set the streaming service to monitor.
    """
    global current_service

    service_name = service_name.lower()
    if service_name in SERVICES:
        current_service = SERVICES[service_name]()
        return {"success": True, "service": str(current_service)}
    else:
        return {
            "success": False,
            "error": f"Unknown service: {service_name}",
            "available": list(SERVICES.keys())
        }


def ping() -> dict:
    """
    Health check endpoint.
    """
    return {"status": "ok", "version": "1.0.0"}


def main():
    """
    Start the IPC server with all handlers registered.
    """
    server = IPCServer()

    # Register all RPC methods
    server.register("ping", ping)
    server.register("get_config", get_config)
    server.register("get_current_song", get_current_song)
    server.register("get_lyrics", get_lyrics)
    server.register("next_lyrics", next_lyrics)
    server.register("save_lyrics", save_lyrics)
    server.register("set_lyrics_directory", set_lyrics_directory)
    server.register("set_service", set_service)

    # Start processing requests
    server.run()


if __name__ == "__main__":
    main()
