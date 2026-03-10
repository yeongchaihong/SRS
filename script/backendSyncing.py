#!/usr/bin/env python3
"""
Final ACR Scraper
Combines AIO.py (scenario list + detail scraping) with discussion text enrichment:
1. Fetch all scenarios from the main portal
2. Scrape detailed procedure data for each scenario
3. Enrich each procedure with 'Discussion of Procedures by Variant' text
4. Output as comprehensive JSON

Features:
- Retry failed requests up to 3 times
- Concurrent scraping (20 workers by default)
- Success/failure tracking and summary
- Discussion text enrichment per procedure (more_information field)
- Monitor mode: checks for new scenarios every hour, auto-scrapes and sends Discord webhook
"""

import html as html_module
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from difflib import SequenceMatcher
from threading import Lock
from typing import Any, Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


# ── Constants ─────────────────────────────────────────────────────────────────

BASE_URL = "https://gravitas.acr.org"
SCENARIO_FALLBACK = "/ACPortal/GetDataForOneScenario?senarioId={}"
DISCUSSION_LABEL = "Discussion of Procedures by Variant"


# ── Discussion enrichment helpers ─────────────────────────────────────────────

def _normalize_text(value: str) -> str:
    value = (value or "").lower()
    value = re.sub(r"\s+", " ", value)
    value = value.replace("w/o", "without")
    value = value.replace("w/", "with")
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9 ]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def _normalize_procedure_text(value: str) -> str:
    value = _normalize_text(value)
    value = re.sub(r"\bdbt\b", "digital breast tomosynthesis", value)
    value = re.sub(r"\bus\b", "ultrasound", value)
    value = re.sub(r"\bpet\b", "positron emission tomography", value)
    value = re.sub(r"\bmri\b", "magnetic resonance imaging", value)
    value = re.sub(r"\biv\b", "intravenous", value)
    return re.sub(r"\s+", " ", value).strip()


def _strip_variant_prefix(value: str) -> str:
    return re.sub(r"^\s*variant\s*\d+\s*:\s*", "", value, flags=re.IGNORECASE).strip()


def _parse_procedure_label(line: str) -> str:
    return re.sub(r"^\s*[A-Z]\.\s*", "", line or "").strip()


def _similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, _normalize_text(a), _normalize_text(b)).ratio()


def _procedure_similarity(a: str, b: str) -> float:
    a_norm = _normalize_procedure_text(a)
    b_norm = _normalize_procedure_text(b)
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
class _DiscussionEntry:
    variant_title: str
    variant_text: str
    procedure_title: str
    procedure_text: str
    discussion_text: str


# ── Classes ───────────────────────────────────────────────────────────────────

class ACRScenarioListScraper:
    """Scraper for getting list of scenarios from ACR Portal"""

    def __init__(self):
        self.base_url = "https://gravitas.acr.org/ACPortal/GetDataForTabsByView"
        self.headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://gravitas.acr.org',
            'Referer': 'https://gravitas.acr.org/'
        }

    def fetch_scenarios_html(self, panel_ids: List[str] = []) -> Optional[str]:
        payload = {
            "TabId": 1,
            "InputModel": {
                "PanelIds": panel_ids,
                "Ageoptions": [],
                "Genderoptions": [],
                "BodyAreaIds": [],
                "PCAIds": [],
                "SearchText": ""
            }
        }
        try:
            print(f"Fetching scenarios from {self.base_url}")
            response = requests.post(self.base_url, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()
            if response.headers.get('content-type', '').startswith('application/json'):
                data = response.json()
                if isinstance(data, dict):
                    for key in ['html', 'Html', 'content', 'Content', 'data', 'Data', 'result', 'Result']:
                        if key in data:
                            return data[key]
                    return str(data)
                return str(data)
            return response.text
        except requests.RequestException as e:
            print(f"Error fetching scenarios: {e}")
            return None

    def parse_scenario_list(self, html_content: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html_content, 'html.parser')
        table = soup.find('table', class_='basicTable')
        if not table:
            table = soup.find('table', class_='tblResDocs')
        if not table:
            table = soup.find('table')
        if not table:
            print("Warning: No table found in HTML")
            return []

        scenarios = []
        for row in table.find_all('tr')[1:]:
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 7:
                scenario_link = row.find('a')
                scenario_text = scenario_link.get_text(strip=True) if scenario_link else ""
                scenario_url = scenario_link.get('href') if scenario_link else ""
                if scenario_url and scenario_url.startswith('/'):
                    scenario_url = f"https://gravitas.acr.org{scenario_url}"
                scenarios.append({
                    'panel': cells[0].get_text(strip=True),
                    'scenario_id': cells[1].get_text(strip=True),
                    'scenario_description': scenario_text or cells[2].get_text(strip=True),
                    'scenario_url': scenario_url,
                    'sex': cells[3].get_text(strip=True),
                    'age': cells[4].get_text(strip=True),
                    'body_area': cells[5].get_text(strip=True),
                    'priority_clinical_areas': cells[6].get_text(strip=True) if len(cells) > 6 else ""
                })

        print(f"Found {len(scenarios)} scenarios")
        return scenarios


class ACRScenarioDetailScraper:
    """Scraper for detailed scenario procedure data with retry logic"""

    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def fetch_scenario_html(self, scenario_url: str) -> Optional[str]:
        for attempt in range(1, self.max_retries + 1):
            try:
                response = self.session.get(scenario_url, timeout=30)
                response.raise_for_status()
                return response.text
            except requests.RequestException as e:
                if attempt < self.max_retries:
                    print(f"  Attempt {attempt} failed, retrying... ({e})")
                    time.sleep(1)
                else:
                    print(f"  Failed after {self.max_retries} attempts: {e}")
                    return None
        return None

    def extract_color_indicator(self, td_element) -> str:
        if td_element.find('div', class_='green-circle'):
            return 'green'
        elif td_element.find('div', class_='pink-circle'):
            return 'pink'
        elif td_element.find('div', class_='yellow-circle'):
            return 'yellow'
        return 'unknown'

    def clean_text(self, text: str) -> str:
        if not text:
            return ""
        text = re.sub(r'<br\s*/?>', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def parse_scenario_details(self, html: str) -> Dict:
        soup = BeautifulSoup(html, 'html.parser')
        data = {'variant': {'id': '', 'description': ''}, 'procedures': []}

        variant_link = soup.find('ul', class_='nav-tabs-main')
        if variant_link:
            link = variant_link.find('a', class_='nav-link')
            if link:
                data['variant']['description'] = self.clean_text(link.get_text())
                href = link.get('href', '')
                data['variant']['id'] = href.replace('#', '') if href else ''

        table = soup.find('table', class_='basicTable')
        if not table:
            return data
        tbody = table.find('tbody')
        if not tbody:
            return data

        for row in tbody.find_all('tr'):
            cells = row.find_all('td', class_='tdResDoc')
            if not cells:
                continue
            if cells[0].has_attr('rowspan'):
                procedure_cell_idx, adult_rrl_idx, peds_rrl_idx, appropriateness_idx = 2, 3, 4, 5
            else:
                procedure_cell_idx, adult_rrl_idx, peds_rrl_idx, appropriateness_idx = 0, 1, 2, 3

            if len(cells) > appropriateness_idx:
                procedure_cell = cells[procedure_cell_idx]
                procedure_name_div = procedure_cell.find('div', class_='spanResolutionDocTitle')
                procedure_name = self.clean_text(procedure_name_div.get_text()) if procedure_name_div else ''
                color_indicator = self.extract_color_indicator(procedure_cell)
                adult_rrl_span = cells[adult_rrl_idx].find('span', class_='spanResolutionDocTitle')
                adult_rrl = self.clean_text(adult_rrl_span.get_text()) if adult_rrl_span else ''
                peds_rrl_span = cells[peds_rrl_idx].find('span', class_='spanResolutionDocTitle')
                peds_rrl = self.clean_text(peds_rrl_span.get_text()) if peds_rrl_span else ''
                appropriateness_span = cells[appropriateness_idx].find('span', class_='spanResolutionDocTitle')
                appropriateness = self.clean_text(appropriateness_span.get_text()) if appropriateness_span else ''
                data['procedures'].append({
                    'procedure_name': procedure_name,
                    'color_indicator': color_indicator,
                    'adult_rrl': adult_rrl,
                    'peds_rrl': peds_rrl,
                    'appropriateness_category': appropriateness
                })

        return data


class ACRDiscussionEnricher:
    """Fetches 'Discussion of Procedures by Variant' and attaches it to procedures."""

    def __init__(self, timeout: int = 30, sleep_sec: float = 0.0):
        self.timeout = timeout
        self.sleep_sec = sleep_sec
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/123.0.0.0 Safari/537.36"
            )
        })
        self._scenario_to_topic: Dict[str, str] = {}
        self._topic_cache: Dict[str, List[_DiscussionEntry]] = {}

    def _get(self, url: str) -> str:
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        if self.sleep_sec > 0:
            time.sleep(self.sleep_sec)
        return response.text

    def _topic_url(self, scenario_url: str) -> Optional[str]:
        if scenario_url in self._scenario_to_topic:
            return self._scenario_to_topic[scenario_url] or None
        try:
            soup = BeautifulSoup(self._get(scenario_url), "html.parser")
            link = soup.find("a", href=re.compile(r"/ACPortal/TopicNarrative\?topicId=\d+", re.IGNORECASE))
            url = urljoin(BASE_URL, link.get("href", "")) if link else ""
        except Exception:
            url = ""
        self._scenario_to_topic[scenario_url] = url
        return url or None

    def _parse_topic(self, topic_url: str) -> List[_DiscussionEntry]:
        if topic_url in self._topic_cache:
            return self._topic_cache[topic_url]
        try:
            soup = BeautifulSoup(self._get(topic_url), "html.parser")
        except Exception:
            self._topic_cache[topic_url] = []
            return []

        label = soup.find(string=lambda s: isinstance(s, str) and DISCUSSION_LABEL in s)
        if not label:
            self._topic_cache[topic_url] = []
            return []

        label_el = label.parent
        section_item_id = label_el.get("data-itemid") or label_el.get("data-itemId") if label_el else None
        section = None
        if section_item_id:
            target_id = f"Sec_{section_item_id}"
            for tag in soup.find_all(id=True):
                if (tag.get("id") or "").strip() == target_id:
                    section = tag
                    break

        if not section:
            self._topic_cache[topic_url] = []
            return []

        entries: List[_DiscussionEntry] = []
        for block in section.find_all("div", class_="displayDoc"):
            heading = block.find("div", class_=re.compile(r"\bpb-2\b"))
            if not heading:
                continue
            bold_lines = [b.get_text(" ", strip=True) for b in heading.find_all("b") if b.get_text(strip=True)]
            if not bold_lines:
                continue
            variant_title = bold_lines[0]
            procedure_title = bold_lines[1] if len(bold_lines) > 1 else ""
            text_holder = block.find("div", class_=re.compile(r"\btxtSectiontextReadOnly\b"))
            raw_html = text_holder.get("data-origtext", "") if text_holder else ""
            decoded = html_module.unescape(raw_html or "")
            discussion_text = re.sub(r"\s+", " ", BeautifulSoup(decoded, "html.parser").get_text(" ", strip=True)).strip()
            entries.append(_DiscussionEntry(
                variant_title=variant_title,
                variant_text=_strip_variant_prefix(variant_title),
                procedure_title=procedure_title,
                procedure_text=_parse_procedure_label(procedure_title),
                discussion_text=discussion_text,
            ))

        self._topic_cache[topic_url] = entries
        return entries

    def enrich(self, record: dict) -> dict:
        scenario_url = (record.get("scenario_url") or "").strip()
        if not scenario_url:
            sid = str(record.get("scenario_id") or "").strip()
            if sid:
                scenario_url = urljoin(BASE_URL, SCENARIO_FALLBACK.format(sid))

        topic_url = self._topic_url(scenario_url) if scenario_url else None
        entries = self._parse_topic(topic_url) if topic_url else []

        variant_desc = ((record.get("variant") or {}).get("description") or "").strip()

        best_variant = None
        best_score = -1.0
        for e in entries:
            score = _similarity(variant_desc, e.variant_text)
            if score > best_score:
                best_score = score
                best_variant = e.variant_title
        if best_score < 0.45:
            best_variant = None

        variant_entries = [e for e in entries if best_variant and e.variant_title == best_variant]

        for proc in record.get("procedures") or []:
            proc_name = (proc.get("procedure_name") or "").strip()
            best_entry = None
            best_proc_score = -1.0
            for e in variant_entries:
                score = _procedure_similarity(proc_name, e.procedure_text or e.procedure_title)
                if score > best_proc_score:
                    best_proc_score = score
                    best_entry = e
            proc["more_information"] = best_entry.discussion_text if (best_entry and best_proc_score >= 0.25) else ""

        return record


class FinalScraper:
    """Scrapes all ACR scenarios with procedures and discussion text enrichment."""

    def __init__(self, max_workers: int = 20, enrich_discussion: bool = True,
                 discussion_sleep: float = 0.0):
        self.list_scraper = ACRScenarioListScraper()
        self.detail_scraper = ACRScenarioDetailScraper(max_retries=3)
        self.enricher = ACRDiscussionEnricher(sleep_sec=discussion_sleep) if enrich_discussion else None
        self.max_workers = max_workers
        self.print_lock = Lock()
        self.stats = {'total': 0, 'success': 0, 'failed': 0, 'failed_urls': []}

    def _scrape_single(self, scenario: Dict, index: int, total: int) -> Tuple[Dict, bool]:
        scenario_id = scenario['scenario_id']
        scenario_url = scenario['scenario_url']

        with self.print_lock:
            print(f"[{index}/{total}] Scraping scenario {scenario_id}...")

        detail_html = self.detail_scraper.fetch_scenario_html(scenario_url)

        if detail_html:
            details = self.detail_scraper.parse_scenario_details(detail_html)
            combined = {**scenario, 'variant': details['variant'], 'procedures': details['procedures']}
            with self.print_lock:
                print(f"  ✓ [{index}/{total}] Success - {len(details['procedures'])} procedures")
            return combined, True
        else:
            with self.print_lock:
                print(f"  ✗ [{index}/{total}] Failed")
            combined = {**scenario, 'variant': {'id': '', 'description': ''}, 'procedures': [], 'scrape_failed': True}
            return combined, False

    def scrape_all(self, panel_ids: List[str] = [], limit: Optional[int] = None) -> List[Dict]:
        print("=" * 60)
        print("STEP 1: Fetching scenario list...")
        print("=" * 60)

        html = self.list_scraper.fetch_scenarios_html(panel_ids)
        if not html:
            print("Failed to fetch scenario list")
            return []

        scenarios = self.list_scraper.parse_scenario_list(html)
        if not scenarios:
            print("No scenarios found")
            return []

        if limit:
            scenarios = scenarios[:limit]
            print(f"Limiting to {limit} scenarios")

        self.stats['total'] = len(scenarios)

        print(f"\n{'=' * 60}")
        print(f"STEP 2: Fetching detailed data for {len(scenarios)} scenarios...")
        print(f"Using {self.max_workers} concurrent workers")
        print("=" * 60 + "\n")

        complete_data = []
        start_time = time.time()

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_scenario = {
                executor.submit(self._scrape_single, scenario, i + 1, len(scenarios)): scenario
                for i, scenario in enumerate(scenarios)
            }
            for future in as_completed(future_to_scenario):
                scenario = future_to_scenario[future]
                try:
                    combined_data, success = future.result()
                    complete_data.append(combined_data)
                    if success:
                        self.stats['success'] += 1
                    else:
                        self.stats['failed'] += 1
                        self.stats['failed_urls'].append({'scenario_id': scenario['scenario_id'], 'url': scenario['scenario_url']})
                except Exception as e:
                    with self.print_lock:
                        print(f"  ✗ Exception for scenario {scenario['scenario_id']}: {e}")
                    self.stats['failed'] += 1
                    self.stats['failed_urls'].append({'scenario_id': scenario['scenario_id'], 'url': scenario['scenario_url'], 'error': str(e)})

        elapsed_time = time.time() - start_time
        self._print_summary(elapsed_time)

        if self.enricher and complete_data:
            print(f"\n{'=' * 60}")
            print("STEP 3: Enriching procedures with discussion text...")
            print("=" * 60)
            for i, record in enumerate(complete_data, 1):
                complete_data[i - 1] = self.enricher.enrich(record)
                if i % 50 == 0 or i == len(complete_data):
                    print(f"  Enriched {i}/{len(complete_data)}")
            print(f"  Unique topic pages visited: {len(self.enricher._topic_cache)}")

        return complete_data

    def _print_summary(self, elapsed_time: float):
        print("\n" + "=" * 60)
        print("SCRAPING SUMMARY")
        print("=" * 60)
        print(f"Total scenarios: {self.stats['total']}")
        print(f"✓ Successful: {self.stats['success']}")
        print(f"✗ Failed: {self.stats['failed']}")
        print(f"Success rate: {(self.stats['success'] / self.stats['total'] * 100):.1f}%")
        print(f"Time elapsed: {elapsed_time:.2f} seconds")
        print(f"Average time per scenario: {(elapsed_time / self.stats['total']):.2f} seconds")
        if self.stats['failed_urls']:
            print(f"\nFailed URLs ({len(self.stats['failed_urls'])}):")
            for failed in self.stats['failed_urls'][:10]:
                print(f"  - Scenario {failed['scenario_id']}: {failed['url']}")
            if len(self.stats['failed_urls']) > 10:
                print(f"  ... and {len(self.stats['failed_urls']) - 10} more")
        print("=" * 60)

    def save_to_json(self, data: List[Dict], filename: str = "acr_final_data.json"):
        output = {
            'total_scenarios': len(data),
            'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'statistics': {
                'total': self.stats['total'],
                'successful': self.stats['success'],
                'failed': self.stats['failed'],
                'success_rate': f"{(self.stats['success'] / self.stats['total'] * 100):.1f}%" if self.stats['total'] > 0 else "0%"
            },
            'failed_urls': self.stats['failed_urls'],
            'scenarios': data
        }
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        print(f"\n{'=' * 60}")
        print(f"✓ Data saved to {filename}")
        print(f"  Total scenarios: {len(data)}")
        total_procedures = sum(len(s.get('procedures', [])) for s in data)
        print(f"  Total procedures: {total_procedures}")
        print("=" * 60)


# ── Discord webhook ───────────────────────────────────────────────────────────

def discord_send(webhook_url: str, content: str, embeds: Optional[List[Dict]] = None):
    """Send a message to a Discord webhook. Silently skips if no URL is set."""
    if not webhook_url:
        return
    payload: Dict[str, Any] = {"content": content}
    if embeds:
        payload["embeds"] = embeds
    try:
        r = requests.post(webhook_url, json=payload, timeout=10)
        r.raise_for_status()
    except Exception as e:
        print(f"[Discord] Failed to send webhook: {e}")


# ── Monitor ───────────────────────────────────────────────────────────────────

class ACRMonitor:
    """
    Polls ACR for new scenarios every `interval_sec` seconds.

    On first run (initialize):
      - fetches the full scenario list
      - records the known scenario IDs
      - does NOT trigger a scrape (assumes the existing output file is current)

    On each subsequent poll:
      - fetches the scenario list again
      - compares scenario IDs with the known set
      - if new IDs are found, runs a full scrape of ONLY the new scenarios,
        appends them to the output file, and fires Discord webhooks
    """

    STATE_FILE = "acr_monitor_state.json"

    def __init__(
        self,
        webhook_url: str,
        output_file: str = "acr_final_data.json",
        interval_sec: int = 3600,
        panel_ids: Optional[List[str]] = None,
        max_workers: int = 20,
        enrich_discussion: bool = True,
        discussion_sleep: float = 0.0,
    ):
        self.webhook_url = webhook_url
        self.output_file = output_file
        self.interval_sec = interval_sec
        self.panel_ids = panel_ids or []
        self.max_workers = max_workers
        self.enrich_discussion = enrich_discussion
        self.discussion_sleep = discussion_sleep

        self.list_scraper = ACRScenarioListScraper()
        self._known_ids: Set[str] = set()

    # ── State persistence ──────────────────────────────────────────────────

    def _save_state(self):
        state = {
            "known_ids": sorted(self._known_ids),
            "saved_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        with open(self.STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)

    def _load_state(self) -> bool:
        """Returns True if state was successfully loaded."""
        try:
            with open(self.STATE_FILE, "r", encoding="utf-8") as f:
                state = json.load(f)
            self._known_ids = set(state.get("known_ids", []))
            print(f"[Monitor] Loaded state: {len(self._known_ids)} known scenario IDs")
            return True
        except FileNotFoundError:
            return False
        except Exception as e:
            print(f"[Monitor] Could not load state: {e}")
            return False

    # ── Helpers ────────────────────────────────────────────────────────────

    def _fetch_scenario_ids(self) -> Optional[List[Dict]]:
        html = self.list_scraper.fetch_scenarios_html(self.panel_ids)
        if not html:
            return None
        return self.list_scraper.parse_scenario_list(html)

    def _current_output_count(self) -> int:
        try:
            with open(self.output_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data.get("total_scenarios", len(data.get("scenarios", [])))
        except Exception:
            return 0

    def _append_to_output(self, new_scenarios: List[Dict]):
        """Load existing output, append new scenarios, save back."""
        try:
            with open(self.output_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {"total_scenarios": 0, "scraped_at": "", "statistics": {}, "failed_urls": [], "scenarios": []}

        data["scenarios"].extend(new_scenarios)
        data["total_scenarios"] = len(data["scenarios"])
        data["scraped_at"] = time.strftime("%Y-%m-%d %H:%M:%S")

        with open(self.output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    # ── Core actions ───────────────────────────────────────────────────────

    def initialize(self):
        """
        First-time setup: fetch the scenario list, record all IDs, save state.
        Does NOT run a full scrape — assumes output file already exists or will
        be populated by a manual run of main().
        """
        print("\n" + "=" * 60)
        print("[Monitor] INITIALIZING")
        print("=" * 60)

        # Try loading existing state first
        if self._load_state():
            print("[Monitor] State already exists — re-initializing with fresh fetch.")

        scenarios = self._fetch_scenario_ids()
        if scenarios is None:
            print("[Monitor] Failed to fetch scenario list during initialization.")
            return

        self._known_ids = {s["scenario_id"] for s in scenarios}
        self._save_state()

        print(f"[Monitor] Initialized with {len(self._known_ids)} scenario IDs.")
        print(f"[Monitor] State saved to {self.STATE_FILE}")

        discord_send(
            self.webhook_url,
            embeds=[{
                "title": "ACR Monitor Initialized",
                "description": f"Tracking **{len(self._known_ids)}** scenarios.\nPolling every **{self.interval_sec // 60} minutes**.",
                "color": 0x5865F2,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }],
            content="",
        )

    def _check_once(self):
        """Single poll: fetch list, detect new IDs, scrape + notify if changed."""
        print(f"\n[Monitor] {time.strftime('%Y-%m-%d %H:%M:%S')} — checking for new scenarios...")

        scenarios = self._fetch_scenario_ids()
        if scenarios is None:
            print("[Monitor] Fetch failed, skipping this check.")
            discord_send(self.webhook_url, "⚠️ **ACR Monitor** — failed to fetch scenario list. Will retry next cycle.")
            return

        current_ids = {s["scenario_id"] for s in scenarios}
        new_ids = current_ids - self._known_ids

        if not new_ids:
            print(f"[Monitor] No changes — {len(current_ids)} scenarios (unchanged).")
            return

        # New scenarios detected
        old_count = len(self._known_ids)
        new_count = len(current_ids)
        print(f"[Monitor] Detected {len(new_ids)} new scenario(s)! {old_count} → {new_count}")

        discord_send(
            self.webhook_url,
            embeds=[{
                "title": "🔔 New ACR Scenarios Detected",
                "description": (
                    f"**{len(new_ids)} new scenario(s)** found.\n"
                    f"Total: **{old_count} → {new_count}**\n\n"
                    f"Starting scrape now…"
                ),
                "color": 0xFFA500,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }],
            content="",
        )

        # Scrape only the new scenarios
        new_scenario_list = [s for s in scenarios if s["scenario_id"] in new_ids]
        scraper = FinalScraper(
            max_workers=self.max_workers,
            enrich_discussion=self.enrich_discussion,
            discussion_sleep=self.discussion_sleep,
        )

        # Directly run scrape on only the new scenarios (bypass list fetch)
        scraper.stats['total'] = len(new_scenario_list)
        complete_data = []
        start_time = time.time()

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_scenario = {
                executor.submit(scraper._scrape_single, s, i + 1, len(new_scenario_list)): s
                for i, s in enumerate(new_scenario_list)
            }
            for future in as_completed(future_to_scenario):
                s = future_to_scenario[future]
                try:
                    combined_data, success = future.result()
                    complete_data.append(combined_data)
                    if success:
                        scraper.stats['success'] += 1
                    else:
                        scraper.stats['failed'] += 1
                        scraper.stats['failed_urls'].append({'scenario_id': s['scenario_id'], 'url': s['scenario_url']})
                except Exception as e:
                    print(f"  ✗ Exception for scenario {s['scenario_id']}: {e}")
                    scraper.stats['failed'] += 1

        elapsed = time.time() - start_time

        if scraper.enricher and complete_data:
            print("[Monitor] Enriching new scenarios with discussion text...")
            for i, record in enumerate(complete_data, 1):
                complete_data[i - 1] = scraper.enricher.enrich(record)

        # Append to existing output file
        self._append_to_output(complete_data)

        # Update known IDs and save state
        self._known_ids = current_ids
        self._save_state()

        # Build list of new scenario descriptions for the webhook
        new_desc_lines = "\n".join(
            f"• `{s['scenario_id']}` — {s.get('scenario_description', '')[:80]}"
            for s in new_scenario_list[:20]
        )
        if len(new_scenario_list) > 20:
            new_desc_lines += f"\n…and {len(new_scenario_list) - 20} more"

        discord_send(
            self.webhook_url,
            embeds=[{
                "title": "✅ Scrape Complete",
                "description": (
                    f"Added **{len(complete_data)}** new scenario(s) to `{self.output_file}`.\n"
                    f"Total scenarios: **{old_count} → {new_count}**\n"
                    f"Time taken: **{elapsed:.1f}s**\n\n"
                    f"**New scenarios:**\n{new_desc_lines}"
                ),
                "color": 0x57F287,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "footer": {"text": f"Failed: {scraper.stats['failed']} | Success: {scraper.stats['success']}"},
            }],
            content="",
        )

        print(f"[Monitor] Done. Appended {len(complete_data)} new records to {self.output_file}")

    def run(self):
        """
        Start the monitoring loop.
        Loads existing state if available, otherwise initializes first.
        """
        if not self._load_state():
            print("[Monitor] No state file found — running initialization.")
            self.initialize()

        print(f"\n[Monitor] Starting monitor loop (interval: {self.interval_sec}s).")
        print("[Monitor] Press Ctrl+C to stop.\n")

        while True:
            try:
                self._check_once()
            except Exception as e:
                print(f"[Monitor] Unexpected error during check: {e}")
                discord_send(self.webhook_url, f"❌ **ACR Monitor error:** {e}")

            print(f"[Monitor] Next check in {self.interval_sec // 60} minute(s)...")
            time.sleep(self.interval_sec)


# ── Entry points ──────────────────────────────────────────────────────────────

def main():
    # ===== CONFIGURATION =====
    panel_ids = []           # Empty = all panels, or specify like ["1", "2"]
    limit = None             # None = scrape all, or set a number like 5 for testing
    max_workers = 20         # Number of concurrent threads
    output_file = "acr_final_data.json"
    enrich_discussion = True # Set False to skip discussion text enrichment
    discussion_sleep = 0.0   # Seconds to sleep between discussion HTTP calls
    # =========================

    print("\n" + "=" * 60)
    print("ACR FINAL SCRAPER")
    print("=" * 60)
    print(f"Panel IDs: {panel_ids if panel_ids else 'All'}")
    print(f"Limit: {limit if limit else 'No limit'}")
    print(f"Concurrent workers: {max_workers}")
    print(f"Max retries per URL: 3")
    print(f"Enrich discussion text: {enrich_discussion}")
    print("=" * 60)

    scraper = FinalScraper(max_workers=max_workers, enrich_discussion=enrich_discussion,
                           discussion_sleep=discussion_sleep)

    try:
        complete_data = scraper.scrape_all(panel_ids=panel_ids, limit=limit)

        if complete_data:
            scraper.save_to_json(complete_data, output_file)
            print("\n" + "=" * 60)
            print("SAMPLE DATA (first scenario):")
            print("=" * 60)
            print(json.dumps(complete_data[0], indent=2, ensure_ascii=False))
        else:
            print("\nNo data was scraped")

    except Exception as e:
        print(f"\nError during scraping: {e}")
        import traceback
        traceback.print_exc()


def main_monitor():
    # ===== MONITOR CONFIGURATION =====
    discord_webhook = ""     # ← paste your Discord webhook URL here
    output_file = "acr_final_data.json"
    panel_ids = []           # Empty = all panels
    interval_sec = 3600      # Check every 1 hour (3600 seconds)
    max_workers = 20
    enrich_discussion = True
    discussion_sleep = 0.0
    # ==================================

    if not discord_webhook:
        print("WARNING: discord_webhook is not set. Webhook notifications will be skipped.")

    monitor = ACRMonitor(
        webhook_url=discord_webhook,
        output_file=output_file,
        interval_sec=interval_sec,
        panel_ids=panel_ids,
        max_workers=max_workers,
        enrich_discussion=enrich_discussion,
        discussion_sleep=discussion_sleep,
    )
    monitor.run()


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "monitor":
        main_monitor()
    else:
        main()