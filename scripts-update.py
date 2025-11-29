#!/usr/bin/env python3
# coding: utf-8
"""
Auto updater for YouTube videos from bondipathshala course page.
Injects videos into subject HTML files chapter-wise under AUTO GENERATED markers.
"""

import requests
from bs4 import BeautifulSoup
import os
import re
from collections import defaultdict

# --------------- CONFIG ---------------
SOURCE_URL = "https://www.bondipathshala.education/bn/course/hsc-powerplay-2026/Course1758213800537"

# Map of normalized subject names -> local HTML filename
SUBJECT_FILE_MAP = {
    "Bangla": "bangla.html",
    "Biology": "biology.html",
    "Chemistry": "chemistry.html",
    "English": "english.html",
    "ICT": "ict.html",
    "Higher Math": "math.html",
    "Math": "math.html",
    "Physics": "physics.html",
}

# Chapter mappings
CHAPTER_MAP = {
    "Physics": {
        "Paper 1": [
            "ভৌতজগত ও পরিমাপ", "ভেক্টর", "গতিবিদ্যা", "নিউটনীয় বলবিদ্যা",
            "কাজ, ক্ষমতা ও শক্তি", "মহাকর্ষ ও অভিকর্ষ", "পদার্থের গাঠনিক ধর্ম",
            "পর্যাবৃত্ত গতি", "তরঙ্গ", "আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব"
        ],
        "Paper 2": [
            "তাপগতিবিদ্যা", "স্থির তড়িৎ", "চলতড়িৎ", "তড়িৎ প্রবাহের চৌম্বক ক্রিয়া ও চুম্বকত্ব",
            "তাড়িত-চৌম্বক আবেশ", "জ্যামিতিক আলোকবিজ্ঞান", "ভৌত আলোকবিজ্ঞান",
            "আধুনিক পদার্থবিজ্ঞান", "পরমাণুর মডেল ও নিউক্লিয়ার পদার্থবিজ্ঞান",
            "সেমিকন্ডাক্টর ও ইলেকট্রনিক্স", "জ্যোতির্বিজ্ঞান"
        ]
    },
    "Chemistry": {
        "Paper 1": ["ল্যাবরেটরির নিরাপদ ব্যবহার", "গুণগত রসায়ন", "মৌলের পর্যাবৃত্তিক ধর্ম ও রাসায়নিক বন্ধন", "রাসায়নিক পরিবর্তন", "কর্মমুখী রসায়ন"],
        "Paper 2": ["পরিবেশ রসায়ন", "জৈব রসায়ন", "পরিমাণগত রসায়ন", "তড়িৎ রসায়ন", "অর্থনৈতিক রসায়ন"]
    },
    "Higher Math": {
        "Paper 1": ["ম্যাট্রিক্স ও নির্ণায়ক","ভেক্টর","সরলরেখা","বৃত্ত","বিন্যাস ও সমাবেশ","ত্রিকোণমিতিক অনুপাত",
                    "সংযুক্ত কোনের ত্রিকোনমিতিক অনুপাত","ফাংশন ও ফাংশনের লেখচিত্র","অন্তরীকরণ","যোগজীকরণ"],
        "Paper 2": ["বাস্তব সংখ্যা ও অসমতা","যোগাশ্রয়ী প্রোগ্রাম","জটিল সংখ্যা","বহুপদী ও বহুপদী সমীকরণ",
                    "দ্বিপদী বিস্তৃতি","কনিক","বিপরীত ত্রিকোনমিতিক ফাংশন ও ত্রিকোণমিতিক সমীকরণ",
                    "স্থিতিবিদ্যা","সমতলে বস্তুকনার গতি","বিস্তার পরিমাপ ও সম্ভাবনা"]
    },
    "Biology": {
        "Paper 1": ["কোষ ও এর গঠন","কোষ বিভাজন","কোষ রসায়ন","অণুজীব","শৈবাল ও ছত্রাক",
                    "ব্রায়োফাইটা ও টেরিডোফাইটা","নগ্নবীজী ও আবৃতবীজী উদ্ভিদ","টিস্যু ও টিস্যুতন্ত্র",
                    "উদ্ভিদ শারীরতত্ত্ব","উদ্ভিদ প্রজনন","জীবপ্রযুক্তি","জীবের পরিবেশ বিস্তার ও সংরক্ষন"],
        "Paper 2": ["প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস","প্রাণীর পরিচিতি","পরিপাক ও শোষণ","রক্ত ও সংবহন",
                    "শ্বসন ও শ্বাসক্রিয়া","বর্জ্য ও নিষ্কাশন","চলন ও অঙগচালনা","সমন্বয় ও নিয়ন্ত্রণ",
                    "মানব জীবনের ধারাবাহিকতা","মানবদেহের প্রতিরক্ষা","জিনতত্ত্ব ও বিবর্তন","প্রাণীর আচরণ"]
    }
}

AUTO_START = "<!-- AUTO GENERATED START -->"
AUTO_END = "<!-- AUTO GENERATED END -->"

# ------------------ helpers ------------------
def normalize(text):
    return re.sub(r"\s+", " ", text).strip() if text else ""

def extract_youtube_id(href):
    if not href: return None
    m = re.search(r"v=([^&\s]+)", href) or re.search(r"youtu\.be/([^?\s]+)", href)
    return m.group(1) if m else None

# ------------------ main ------------------
def main():
    print("Fetching videos from:", SOURCE_URL)
    resp = requests.get(SOURCE_URL, timeout=20)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    video_elems = soup.find_all(attrs={"data-name": True, "data-topic_name": True})
    print(f"Found {len(video_elems)} video elements")

    collected = defaultdict(lambda: defaultdict(list))

    for el in video_elems:
        subject = normalize(el.get("data-subject_name") or el.get("data-topic_name"))
        topic = normalize(el.get("data-topic_name"))
        vid = el.get("data-name") or extract_youtube_id(el.get("href"))
        title = normalize(el.get_text(strip=True) or topic or vid)

        if not vid:
            continue
        collected[subject][topic].append({"id": vid, "title": title})

    inject_per_file = defaultdict(list)

    for subj, topics in collected.items():
        filename = None
        for k, f in SUBJECT_FILE_MAP.items():
            if k.lower() in subj.lower():
                filename = f
                break
        if not filename: continue

        chapter_map = CHAPTER_MAP.get(k, None)
        paper_chapter_lines = defaultdict(lambda: defaultdict(list))

        for topic_name, vids in topics.items():
            matched = False
            if chapter_map:
                for paper, chapters in chapter_map.items():
                    for idx, chap in enumerate(chapters, start=1):
                        if chap.lower() in topic_name.lower() or topic_name.lower() in chap.lower():
                            for v in vids:
                                paper_chapter_lines[paper][idx].append(
                                    f'<li><a href="https://www.youtube.com/watch?v={v["id"]}" target="_blank">{v["title"]}</a></li>'
                                )
                            matched = True
                            break
                    if matched: break
            if not matched:
                # fallback Paper1 Misc
                for v in vids:
                    paper_chapter_lines["Paper 1"][0].append(
                        f'<li><a href="https://www.youtube.com/watch?v={v["id"]}" target="_blank">{v["title"]}</a></li>'
                    )

        # assemble HTML fragments
        fragments = []
        for paper in sorted(paper_chapter_lines.keys()):
            fragments.append(f"<h2>{paper}</h2>")
            chapters = chapter_map.get(paper, []) if chapter_map else []
            for idx, chap_name in enumerate(chapters, start=1):
                fragments.append(f"<h3>Chapter {idx}: {chap_name}</h3>")
                fragments.append("<ul>")
                for line in paper_chapter_lines[paper].get(idx, []):
                    fragments.append(line)
                fragments.append("</ul>")
            # misc
            if paper_chapter_lines[paper].get(0):
                fragments.append("<h3>Misc</h3>")
                fragments.append("<ul>")
                for line in paper_chapter_lines[paper][0]:
                    fragments.append(line)
                fragments.append("</ul>")

        inject_per_file[filename] = fragments

    # write to files
    for filename, fragments in inject_per_file.items():
        if not os.path.exists(filename):
            print(f"File missing: {filename}, skipping")
            continue
        with open(filename, "r", encoding="utf-8") as f:
            content = f.read()

        if AUTO_START not in content or AUTO_END not in content:
            print(f"Markers missing in {filename}, skipping")
            continue

        before, rest = content.split(AUTO_START, 1)
        old_block, after = rest.split(AUTO_END, 1)

        # Avoid duplicates
        existing_ids = set(re.findall(r"watch\?v=([A-Za-z0-9_\-]+)", old_block))
        new_lines = [line for line in fragments if re.search(r"watch\?v=([A-Za-z0-9_\-]+)", line) and re.search(r"watch\?v=([A-Za-z0-9_\-]+)", line).group(1) not in existing_ids]

        final_block = "\n<!-- added by auto-updater -->\n" + "\n".join(new_lines) + "\n" + old_block.strip()
        final_content = before + AUTO_START + "\n" + final_block + "\n" + AUTO_END + after

        with open(filename, "w", encoding="utf-8") as f:
            f.write(final_content)
        print(f"Updated {filename}: {len(new_lines)} new videos added")

    print("Update complete.")

if __name__ == "__main__":
    main()
