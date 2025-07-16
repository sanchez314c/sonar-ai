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

# Maximum lyrics string size accepted for save (5 MB)
MAX_LYRICS_BYTES = 5 * 1024 * 1024


def _validate_string(value: object, name: str, max_length: int = 512) -> str:
    """Validate that a value is a non-empty string within length bounds."""
    if not isinstance(value, str):
        raise TypeError(f"{name} must be a string")
    stripped = value.strip()
    if not stripped:
        raise ValueError(f"{name} must not be empty")
    if len(stripped) > max_length:
        raise ValueError(f"{name} exceeds maximum length of {max_length}")
    return stripped


def get_current_song(service_name: str = None) -> dict:
    """
    Get the currently playing song from the media player.
    Returns dict with artist, title, raw_title, or null if nothing playing.
    """
    global current_service

    if service_name is not None:
        if not isinstance(service_name, str):
            raise TypeError("service_name must be a string")
        service_key = service_name.lower().strip()
        if service_key and service_key in SERVICES:
            current_service = SERVICES[service_key]()

    window_title = backend.get_window_title(current_service)

    if (
        not window_title
        or window_title in current_service.get_not_playing_windows_title()
    ):
        return None

    song = Song.get_from_string(window_title)

    return {
        "artist": song.artist,
        "title": song.name,
        "raw_title": window_title,
        "service": str(current_service),
    }


def get_lyrics(artist: str, title: str, sync: bool = True) -> dict:
    """
    Fetch lyrics for a song.
    Returns dict with lyrics, url, service_name, timed (bool), or error.
    """
    artist = _validate_string(artist, "artist")
    title = _validate_string(title, "title")

    if not isinstance(sync, bool):
        sync = bool(sync)

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
            "error": str(e),
        }


def next_lyrics(artist: str, title: str, sync: bool = True) -> dict:
    """
    Get alternative lyrics from the next available source.
    Same return format as get_lyrics.
    """
    artist = _validate_string(artist, "artist")
    title = _validate_string(title, "title")

    if not isinstance(sync, bool):
        sync = bool(sync)

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
            "error": str(e),
        }


def save_lyrics(artist: str, title: str, lyrics: str, timed: bool = False) -> dict:
    """
    Save lyrics to local file.
    Returns dict with success status and file path.
    """
    import pathvalidate

    artist = _validate_string(artist, "artist")
    title = _validate_string(title, "title")

    if not isinstance(lyrics, str):
        raise TypeError("lyrics must be a string")

    # Guard against extremely large payloads
    if len(lyrics.encode("utf-8")) > MAX_LYRICS_BYTES:
        return {
            "success": False,
            "error": "Lyrics content exceeds maximum allowed size (5 MB)",
        }

    if not isinstance(timed, bool):
        timed = bool(timed)

    # Ensure lyrics directory exists
    os.makedirs(s.Config.LYRICS_DIR, exist_ok=True)

    # Sanitize filename
    safe_artist = pathvalidate.sanitize_filename(artist)
    safe_title = pathvalidate.sanitize_filename(title)
    extension = ".lrc" if timed else ".txt"
    filename = f"{safe_artist} - {safe_title}{extension}"
    filepath = os.path.join(s.Config.LYRICS_DIR, filename)

    # Resolve to catch any remaining traversal attempts
    resolved = os.path.realpath(filepath)
    lyrics_dir_real = os.path.realpath(s.Config.LYRICS_DIR)
    if (
        not resolved.startswith(lyrics_dir_real + os.sep)
        and resolved != lyrics_dir_real
    ):
        return {"success": False, "error": "Invalid file path"}

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(lyrics)

        return {"success": True, "path": filepath}
    except Exception as e:
        return {"success": False, "error": str(e)}


def set_lyrics_directory(path: str) -> dict:
    """
    Set custom lyrics directory.
    Only accepts existing directories — no path creation or traversal allowed.
    """
    if not isinstance(path, str) or not path.strip():
        return {"success": False, "error": "path must be a non-empty string"}

    # Resolve symlinks and normalize to detect traversal attempts
    resolved = os.path.realpath(path.strip())

    # Reject paths containing null bytes (C-string injection)
    if "\x00" in path:
        return {"success": False, "error": "Invalid path"}

    if os.path.isdir(resolved):
        s.Config.LYRICS_DIR = resolved
        return {"success": True, "path": resolved}
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

    if not isinstance(service_name, str) or not service_name.strip():
        return {
            "success": False,
            "error": "service_name must be a non-empty string",
            "available": list(SERVICES.keys()),
        }

    service_name = service_name.lower().strip()
    if service_name in SERVICES:
        current_service = SERVICES[service_name]()
        return {"success": True, "service": str(current_service)}
    else:
        return {
            "success": False,
            "error": f"Unknown service: {service_name}",
            "available": list(SERVICES.keys()),
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
