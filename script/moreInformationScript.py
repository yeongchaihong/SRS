import argparse
import html
import json
import re
import time
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse, parse_qs

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://gravitas.acr.org"
SCENARIO_FALLBACK = "/ACPortal/GetDataForOneScenario?senarioId={}"
DISCUSSION_LABEL = "Discussion of Procedures by Variant"


def normalize_text(value: str) -> str:
    value = (value or "").lower()
    value = re.sub(r"\s+", " ", value) 
    value = value.replace("w/o", "without")
    value = value.replace("w/", "with")
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9 ]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def normalize_procedure_text(value: str) -> str:
    value = normalize_text(value)
    value = re.sub(r"\bdbt\b", "digital breast tomosynthesis", value)
    value = re.sub(r"\bus\b", "ultrasound", value)
    value = re.sub(r"\bpet\b", "positron emission tomography", value)
    value = re.sub(r"\bmri\b", "magnetic resonance imaging", value)
    value = re.sub(r"\biv\b", "intravenous", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def strip_variant_prefix(value: str) -> str:
    return re.sub(r"^\s*variant\s*\d+\s*:\s*", "", value, flags=re.IGNORECASE).strip()


def parse_procedure_label(line: str) -> str:
    cleaned = re.sub(r"^\s*[A-Z]\.\s*", "", line or "").strip()
    return cleaned


def similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, normalize_text(a), normalize_text(b)).ratio()


def procedure_similarity(a: str, b: str) -> float:
    a_norm = normalize_procedure_text(a)
    b_norm = normalize_procedure_text(b)
    if not a_norm or not b_norm:
        return 0.0
    seq = SequenceMatcher(None, a_norm, b_norm).ratio()
    a_tokens = set(a_norm.split())
    b_tokens = set(b_norm.split())
    if not a_tokens or not b_tokens:
        return seq
    overlap = len(a_tokens & b_tokens) / len(a_tokens | b_tokens)
    return max(seq, overlap)


@dataclass
class DiscussionEntry:
    variant_title: str
    variant_text: str
    procedure_title: str
    procedure_text: str
    discussion_text: str


class ACRExtractor:
    def __init__(self, timeout: int = 30, sleep_sec: float = 0.0):
        self.timeout = timeout
        self.sleep_sec = sleep_sec
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/123.0.0.0 Safari/537.36"
                )
            }
        )
        self.scenario_to_topic: Dict[str, str] = {}
        self.topic_discussion_cache: Dict[str, List[DiscussionEntry]] = {}

    def _get(self, url: str) -> str:
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        if self.sleep_sec > 0:
            time.sleep(self.sleep_sec)
        return response.text

    def get_topic_url_from_scenario(self, scenario_url: str) -> Optional[str]:
        if scenario_url in self.scenario_to_topic:
            return self.scenario_to_topic[scenario_url]

        try:
            html_text = self._get(scenario_url)
        except Exception:
            self.scenario_to_topic[scenario_url] = ""
            return None

        soup = BeautifulSoup(html_text, "html.parser")
        topic_link = soup.find("a", href=re.compile(r"/ACPortal/TopicNarrative\?topicId=\d+", re.IGNORECASE))
        if not topic_link:
            self.scenario_to_topic[scenario_url] = ""
            return None

        topic_url = urljoin(BASE_URL, topic_link.get("href", ""))
        self.scenario_to_topic[scenario_url] = topic_url
        return topic_url

    def _find_discussion_section(self, soup: BeautifulSoup) -> Optional[BeautifulSoup]:
        label = soup.find(string=lambda s: isinstance(s, str) and DISCUSSION_LABEL in s)
        if not label:
            return None

        label_el = label.parent
        if not label_el:
            return None

        section_item_id = label_el.get("data-itemid") or label_el.get("data-itemId")
        if not section_item_id:
            return None

        target_id = f"Sec_{section_item_id}"
        for tag in soup.find_all(id=True):
            if (tag.get("id") or "").strip() == target_id:
                return tag

        return None

    def _decode_discussion_text(self, raw_html: str) -> str:
        decoded = html.unescape(raw_html or "")
        frag = BeautifulSoup(decoded, "html.parser")
        text = frag.get_text(" ", strip=True)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def parse_topic_discussion(self, topic_url: str) -> List[DiscussionEntry]:
        if topic_url in self.topic_discussion_cache:
            return self.topic_discussion_cache[topic_url]

        try:
            html_text = self._get(topic_url)
        except Exception:
            self.topic_discussion_cache[topic_url] = []
            return []

        soup = BeautifulSoup(html_text, "html.parser")
        section = self._find_discussion_section(soup)
        if not section:
            self.topic_discussion_cache[topic_url] = []
            return []

        entries: List[DiscussionEntry] = []
        for block in section.find_all("div", class_="displayDoc"):
            heading_container = block.find("div", class_=re.compile(r"\bpb-2\b"))
            if not heading_container:
                continue

            bold_lines = [b.get_text(" ", strip=True) for b in heading_container.find_all("b")]
            bold_lines = [line for line in bold_lines if line]
            if not bold_lines:
                continue

            variant_title = bold_lines[0]
            variant_text = strip_variant_prefix(variant_title)
            procedure_title = bold_lines[1] if len(bold_lines) > 1 else ""
            procedure_text = parse_procedure_label(procedure_title)

            text_holder = block.find("div", class_=re.compile(r"\btxtSectiontextReadOnly\b"))
            raw_html = text_holder.get("data-origtext", "") if text_holder else ""
            discussion_text = self._decode_discussion_text(raw_html)

            entries.append(
                DiscussionEntry(
                    variant_title=variant_title,
                    variant_text=variant_text,
                    procedure_title=procedure_title,
                    procedure_text=procedure_text,
                    discussion_text=discussion_text,
                )
            )

        self.topic_discussion_cache[topic_url] = entries
        return entries

    def _best_variant(self, variant_description: str, entries: List[DiscussionEntry]) -> Optional[str]:
        candidates = {}
        for e in entries:
            candidates[e.variant_title] = e.variant_text

        best_key = None
        best_score = -1.0
        for key, value in candidates.items():
            score = similarity(variant_description, value)
            if score > best_score:
                best_key = key
                best_score = score

        if best_key is None or best_score < 0.45:
            return None
        return best_key

    def _best_procedure_match(self, procedure_name: str, variant_entries: List[DiscussionEntry]) -> Optional[DiscussionEntry]:
        best_entry = None
        best_score = -1.0
        for entry in variant_entries:
            proc_label = entry.procedure_text or entry.procedure_title
            score = procedure_similarity(procedure_name, proc_label)
            if score > best_score:
                best_score = score
                best_entry = entry

        if not best_entry or best_score < 0.25:
            return None
        return best_entry

    def enrich_record(self, record: dict) -> dict:
        scenario_url = (record.get("scenario_url") or "").strip()
        if not scenario_url:
            scenario_id = str(record.get("scenario_id") or "").strip()
            if scenario_id:
                scenario_url = urljoin(BASE_URL, SCENARIO_FALLBACK.format(scenario_id))

        topic_url = self.get_topic_url_from_scenario(scenario_url) if scenario_url else None
        discussion_entries = self.parse_topic_discussion(topic_url) if topic_url else []

        variant_description = ((record.get("variant") or {}).get("description") or "").strip()
        matched_variant_title = self._best_variant(variant_description, discussion_entries) if discussion_entries else None

        selected_entries = [
            e for e in discussion_entries if matched_variant_title and e.variant_title == matched_variant_title
        ]

        procedures = record.get("procedures") or []
        for proc in procedures:
            proc_name = (proc.get("procedure_name") or "").strip()
            best = self._best_procedure_match(proc_name, selected_entries) if selected_entries else None
            proc["more_information"] = best.discussion_text if best else ""

        record["procedures"] = procedures
        return record


def main():
    parser = argparse.ArgumentParser(
        description="Extract 'Discussion of Procedures by Variant' for each record from ACR Gravitas."
    )
    parser.add_argument(
        "--input",
        default="script/clinical_advice.completed_original_clinical.json",
        help="Input JSON file path.",
    )
    parser.add_argument(
        "--output",
        default="script/clinical_advice.completed_original_clinical.with_discussion.json",
        help="Output JSON file path.",
    )
    parser.add_argument("--timeout", type=int, default=30, help="HTTP timeout in seconds.")
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.0,
        help="Sleep seconds between HTTP calls to reduce server load.",
    )
    parser.add_argument(
        "--checkpoint-every",
        type=int,
        default=100,
        help="Write output checkpoint every N records.",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume from existing output file if present.",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    data = json.loads(input_path.read_text(encoding="utf-8"))
    extractor = ACRExtractor(timeout=args.timeout, sleep_sec=args.sleep)

    total = len(data)
    enriched = []
    start_idx = 0

    if args.resume and output_path.exists():
        try:
            enriched = json.loads(output_path.read_text(encoding="utf-8"))
            if isinstance(enriched, list):
                start_idx = len(enriched)
            else:
                enriched = []
                start_idx = 0
        except Exception:
            enriched = []
            start_idx = 0
        print(f"Resume mode: starting at index {start_idx}/{total}")

    try:
        for idx in range(start_idx, total):
            enriched.append(extractor.enrich_record(data[idx]))
            processed = idx + 1
            if processed % 50 == 0 or processed == total:
                print(f"Processed {processed}/{total}")
            if args.checkpoint_every > 0 and (processed % args.checkpoint_every == 0):
                output_path.write_text(json.dumps(enriched, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"Checkpoint saved at {processed}/{total}")
    finally:
        output_path.write_text(json.dumps(enriched, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote output: {output_path}")
    print(f"Unique scenario pages visited: {len(extractor.scenario_to_topic)}")
    print(f"Unique topic pages visited: {len(extractor.topic_discussion_cache)}")


if __name__ == "__main__":
    main()
