#!/usr/bin/env python3
"""
sme_event_scraper.py

Scrapes recent Instagram posts from configured SME (society/club) accounts,
scores each caption for "this looks like an event" keywords, and saves
qualifying posts as structured events in a JSON file.

HOW IT WORKS
------------
1. You pick an SME (e.g. "giki") or "all".
2. The script pulls each configured Instagram account's posts from the last
   N days (default 7) using instaloader (no official API key needed for
   public profiles).
3. Each caption is scored against a keyword table (hackathon, workshop,
   session, meeting, deadline, etc). Posts scoring above a threshold are
   saved to events.json.

INSTALL
-------
    pip install instaloader

USAGE
-----
    python3 sme_event_scraper.py --list
    python3 sme_event_scraper.py giki
    python3 sme_event_scraper.py giki --days 10 --threshold 3
    python3 sme_event_scraper.py all --output my_events.json

    # Optional login (recommended -- anonymous scraping gets rate-limited
    # / blocked quickly). Use a throwaway account, not your main one.
    python3 sme_event_scraper.py giki --login your_ig_username --session-file ig.session
    # password is read from --password or the IG_PASSWORD env var

NOTE ON TERMS OF SERVICE
-------------------------
Scraping Instagram outside their official Graph API is against their ToS
and accounts/IPs doing it can get rate-limited or temporarily blocked.
This script is meant for light, occasional personal use (checking a
handful of society pages once a day/week) -- not high-frequency polling.
For a production / always-on system, look into the official Instagram
Graph API (requires the account to be a Business/Creator account you
manage) instead.
"""

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

try:
    import instaloader
except ImportError:
    print("Missing dependency. Install with:  pip install instaloader")
    sys.exit(1)

# ----------------------------------------------------------------------------
# CONFIG: SMEs (societies / clubs) -> list of Instagram usernames (no @, no URL)
# Add as many SMEs / accounts as you like.
# ----------------------------------------------------------------------------

SME_ACCOUNTS: Dict[str, List[str]] = {
    "giki": [
        "gdgoc_giki",
        "microsoftclubgiki",
        "hammerheadgiki",
        "netronixgiki",
        "gik.mathematicssociety",
    ],
    "kracked_devs": [
        # TODO: add the real Instagram handle(s) for Kracked Devs here, e.g.:
        # "kracked.devs",
    ],
    # Example of how to add more SMEs:
    # "nust": ["nust_acm_chapter", "nust_ieee"],
    # "fast": ["fast_nu_acm"],
}

# Keyword -> weight. Tune freely. Matching is case-insensitive substring match.
KEYWORD_WEIGHTS: Dict[str, int] = {
    "hackathon": 5,
    "competition": 4,
    "workshop": 4,
    "bootcamp": 4,
    "conference": 4,
    "seminar": 3,
    "webinar": 3,
    "meetup": 3,
    "registration": 3,
    "register now": 3,
    "applications open": 3,
    "apply now": 3,
    "tryouts": 3,
    "auditions": 3,
    "save the date": 3,
    "session": 2,
    "meeting": 2,
    "deadline": 2,
    "open mic": 2,
    "talk": 2,
    "panel": 2,
    "ceremony": 2,
    "orientation": 2,
    "rsvp": 2,
    "limited seats": 2,
    "agenda": 1,
    "venue": 1,
    "join us": 1,
}

EVENT_SCORE_THRESHOLD = 4  # default minimum score to count a post as an "event"
DAYS_BACK = 7
OUTPUT_FILE = "events.json"
REQUEST_DELAY_SECONDS = 1.5  # politeness delay between post fetches


# ----------------------------------------------------------------------------
# Data model
# ----------------------------------------------------------------------------

@dataclass
class EventPost:
    sme: str
    account: str
    shortcode: str
    url: str
    caption: str
    score: int
    matched_keywords: List[str]
    post_date: str
    is_video: bool


# ----------------------------------------------------------------------------
# Scraper
# ----------------------------------------------------------------------------

def info(msg: str) -> None:
    print(msg, file=sys.stderr)


class InstagramEventScraper:
    def __init__(
        self,
        login_user: Optional[str] = None,
        login_pass: Optional[str] = None,
        session_file: Optional[str] = None,
    ):
        self.L = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            quiet=True,
        )
        self.logged_in = False

        if login_user and session_file and os.path.exists(session_file):
            try:
                self.L.load_session_from_file(login_user, session_file)
                self.logged_in = True
                info(f"[info] loaded existing session for {login_user}")
            except Exception as e:
                info(f"[warn] could not load session file ({e}); will try fresh login")

        if not self.logged_in and login_user and login_pass:
            try:
                self.L.login(login_user, login_pass)
                self.logged_in = True
                if session_file:
                    self.L.save_session_to_file(session_file)
                info(f"[info] logged in as {login_user}")
            except Exception as e:
                info(f"[warn] login failed, continuing anonymously: {e}")

        if not self.logged_in:
            info("[info] running anonymously (no login) -- expect tighter rate limits")

    def fetch_recent_posts(self, username: str, days_back: int = DAYS_BACK) -> List["instaloader.Post"]:
        """Fetch posts from `username` published within the last `days_back` days."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
        posts = []
        try:
            profile = instaloader.Profile.from_username(self.L.context, username)
        except Exception as e:
            info(f"[error] could not load profile '{username}': {e}")
            return posts

        try:
            for post in profile.get_posts():
                post_date = post.date_utc.replace(tzinfo=timezone.utc)
                if post_date < cutoff:
                    break  # newest-first feed: once we're past the window, stop
                posts.append(post)
                time.sleep(REQUEST_DELAY_SECONDS)
        except Exception as e:
            info(f"[error] fetching posts for '{username}': {e}")
        return posts


# ----------------------------------------------------------------------------
# Scoring
# ----------------------------------------------------------------------------

def score_caption(caption: str) -> Tuple[int, List[str]]:
    if not caption:
        return 0, []
    text = caption.lower()
    score = 0
    matched = []
    for kw, weight in KEYWORD_WEIGHTS.items():
        if kw in text:
            score += weight
            matched.append(kw)
    return score, matched


# ----------------------------------------------------------------------------
# Pipeline
# ----------------------------------------------------------------------------

def run_for_sme(
    sme: str,
    scraper: InstagramEventScraper,
    days_back: int,
    threshold: int,
) -> List[EventPost]:
    accounts = SME_ACCOUNTS.get(sme)
    if not accounts:
        info(f"[error] no accounts configured for SME '{sme}'. Add them to SME_ACCOUNTS in this script.")
        return []

    events: List[EventPost] = []
    for account in accounts:
        info(f"  -> scanning @{account} ...")
        posts = scraper.fetch_recent_posts(account, days_back=days_back)
        for post in posts:
            caption = post.caption or ""
            score, matched = score_caption(caption)
            if score >= threshold:
                events.append(
                    EventPost(
                        sme=sme,
                        account=account,
                        shortcode=post.shortcode,
                        url=f"https://www.instagram.com/p/{post.shortcode}/",
                        caption=caption.strip(),
                        score=score,
                        matched_keywords=matched,
                        post_date=post.date_utc.isoformat(),
                        is_video=post.is_video,
                    )
                )
    return events


def save_events(events: List[EventPost], output_file: str) -> None:
    existing = []
    if os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = []

    existing_codes = {e["shortcode"] for e in existing}
    new_count = 0
    for e in events:
        d = asdict(e)
        if d["shortcode"] not in existing_codes:
            existing.append(d)
            existing_codes.add(d["shortcode"])
            new_count += 1

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)

    print(f"\nsaved {new_count} new event(s) -> {output_file} (total now: {len(existing)})", file=sys.stderr)


# ----------------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Scrape SME Instagram accounts for upcoming events.")
    parser.add_argument(
        "sme",
        nargs="?",
        default=None,
        help=f"SME to scan. Options: {', '.join(SME_ACCOUNTS.keys())}, or 'all'",
    )
    parser.add_argument("--days", type=int, default=DAYS_BACK, help="How many days back to scan (default 7)")
    parser.add_argument("--threshold", type=int, default=EVENT_SCORE_THRESHOLD, help="Minimum score to count as an event")
    parser.add_argument("--output", default=OUTPUT_FILE, help="Output JSON file path")
    parser.add_argument("--list", action="store_true", help="List configured SMEs and exit")
    parser.add_argument("--login", default=None, help="Instagram username to log in with (optional)")
    parser.add_argument("--password", default=None, help="Instagram password (or set IG_PASSWORD env var)")
    parser.add_argument("--session-file", default=None, help="Path to save/load an instaloader session file")
    parser.add_argument("--json", action="store_true", help="Print qualifying events as JSON to stdout (for API use)")
    args = parser.parse_args()

    if args.list or not args.sme:
        print("Configured SMEs:")
        for name, accounts in SME_ACCOUNTS.items():
            label = ", ".join(accounts) if accounts else "(no accounts configured yet -- edit SME_ACCOUNTS)"
            print(f"  {name}: {label}")
        if not args.sme:
            return

    password = args.password or os.environ.get("IG_PASSWORD")
    scraper = InstagramEventScraper(login_user=args.login, login_pass=password, session_file=args.session_file)

    targets = list(SME_ACCOUNTS.keys()) if args.sme == "all" else [args.sme]

    all_events: List[EventPost] = []
    for sme in targets:
        info(f"\n=== Scanning SME: {sme} ===")
        events = run_for_sme(sme, scraper, args.days, args.threshold)
        info(f"  found {len(events)} event-like post(s)")
        all_events.extend(events)

    if args.json:
        print(json.dumps([asdict(e) for e in all_events], ensure_ascii=False))
        return

    if all_events:
        save_events(all_events, args.output)
    else:
        info("\nNo qualifying events found this run.")


if __name__ == "__main__":
    main()