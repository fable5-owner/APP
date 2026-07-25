"""Fetch the Korean typefaces the PDF report needs.

Pretendard (body) comes from jsDelivr as static OTFs.  Noto Serif KR
(headings) is only served by Google Fonts as ~120 unicode-range subsets, and
the sandboxed Chromium cannot reach fonts.gstatic.com, so the subsets are
downloaded here and the stylesheet is rewritten to point at local files.

    python src/fetch_fonts.py

Fonts land in research/.fonts (gitignored) — roughly 14 MB.
"""
from __future__ import annotations

import concurrent.futures as cf
import re

import requests

from config import FONT_DIR

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/120.0.0.0 Safari/537.36")
PRETENDARD = ("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/"
              "packages/pretendard/dist/public/static/Pretendard-{}.otf")
WEIGHTS = ["Regular", "Medium", "SemiBold", "Bold", "ExtraBold"]
SERIF_CSS = ("https://fonts.googleapis.com/css2?"
             "family=Noto+Serif+KR:wght@400;500;600;700&display=block")


def _get(url: str) -> bytes:
    r = requests.get(url, timeout=120, headers={"User-Agent": UA})
    r.raise_for_status()
    return r.content


def fetch_pretendard() -> None:
    for w in WEIGHTS:
        dest = FONT_DIR / f"Pretendard-{w}.otf"
        if dest.exists() and dest.stat().st_size > 0:
            continue
        dest.write_bytes(_get(PRETENDARD.format(w)))
        print(f"  Pretendard-{w}.otf", flush=True)


def fetch_serif() -> None:
    out = FONT_DIR / "fonts.css"
    if out.exists() and out.stat().st_size > 0:
        return
    css = requests.get(SERIF_CSS, timeout=120,
                       headers={"User-Agent": UA}).text
    urls = sorted(set(re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+)\)",
                                 css)))
    print(f"  Noto Serif KR: {len(urls)} subsets", flush=True)
    subs = FONT_DIR / "subsets"
    subs.mkdir(exist_ok=True)

    def grab(item):
        i, url = item
        dest = subs / f"serifkr-{i:04d}.woff2"
        if not dest.exists() or dest.stat().st_size == 0:
            dest.write_bytes(_get(url))
        return url, dest.as_uri()

    with cf.ThreadPoolExecutor(max_workers=24) as ex:
        for remote, local in ex.map(grab, enumerate(urls)):
            css = css.replace(remote, local)
    out.write_text(css)


def main() -> None:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"fetching fonts into {FONT_DIR}")
    fetch_pretendard()
    fetch_serif()
    total = sum(f.stat().st_size for f in FONT_DIR.rglob("*")
                if f.is_file())
    print(f"done — {total/1e6:.1f} MB")


if __name__ == "__main__":
    main()
