"""
Lucky Cat — Singapore Pools Results Scraper
Pulls latest TOTO and 4D results and stores them in Supabase.
Run manually or via GitHub Actions (see scrape.yml).

Required environment variables (set in GitHub Secrets):
  SUPABASE_URL   — your Supabase project URL
  SUPABASE_KEY   — your Supabase service role key (not anon key)

Install dependencies:
  pip install requests beautifulsoup4 supabase
"""

import os
import re
import json
import requests
from datetime import datetime
from bs4 import BeautifulSoup

# ── Supabase client setup ────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

def supabase_upsert(table, data, on_conflict):
    """Simple Supabase REST upsert without the SDK."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": f"resolution=merge-duplicates,return=minimal",
    }
    resp = requests.post(url, headers=headers, json=data)
    if resp.status_code not in (200, 201):
        raise Exception(f"Supabase error {resp.status_code}: {resp.text}")
    return resp

def supabase_select(table, filters=""):
    """Simple Supabase REST select."""
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filters}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    resp = requests.get(url, headers=headers)
    return resp.json()

# ── TOTO scraper ─────────────────────────────────────
def scrape_toto():
    """Scrape latest TOTO results from Singapore Pools."""
    print("Scraping TOTO results...")
    url = "https://www.singaporepools.com.sg/en/product/Pages/toto_results.aspx"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; LuckyCatBot/1.0)"}
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")

        # Draw number
        draw_el = soup.find(string=re.compile(r"Draw No\.", re.I))
        draw_no = None
        if draw_el:
            m = re.search(r"(\d{4})", draw_el.parent.get_text())
            if m: draw_no = int(m.group(1))

        # Winning numbers — look for number balls
        numbers = []
        additional = None
        num_els = soup.select(".numBall, .winNo, td.num")
        if not num_els:
            # Fallback: find all 2-digit numbers in draw context
            text = soup.get_text()
            section = text[text.find("Winning Numbers"):text.find("Winning Numbers")+300] if "Winning Numbers" in text else ""
            nums_raw = re.findall(r"\b([0-4]?\d)\b", section)
            nums_clean = [int(n) for n in nums_raw if 1 <= int(n) <= 49]
            if len(nums_clean) >= 7:
                numbers = sorted(nums_clean[:6])
                additional = nums_clean[6]

        # Draw date
        date_el = soup.find(string=re.compile(r"\d{1,2}\s+\w+\s+\d{4}"))
        draw_date = date_el.strip() if date_el else datetime.now().strftime("%d %b %Y")

        # Jackpot amount
        jackpot_el = soup.find(string=re.compile(r"\$[\d,]+"))
        jackpot = jackpot_el.strip() if jackpot_el else "Unknown"

        result = {
            "draw_no": draw_no,
            "draw_date": draw_date,
            "num1": numbers[0] if len(numbers) > 0 else None,
            "num2": numbers[1] if len(numbers) > 1 else None,
            "num3": numbers[2] if len(numbers) > 2 else None,
            "num4": numbers[3] if len(numbers) > 3 else None,
            "num5": numbers[4] if len(numbers) > 4 else None,
            "num6": numbers[5] if len(numbers) > 5 else None,
            "additional": additional,
            "jackpot": jackpot,
            "scraped_at": datetime.utcnow().isoformat(),
        }
        print(f"TOTO Draw #{draw_no}: {numbers} + {additional}")
        return result
    except Exception as e:
        print(f"TOTO scrape error: {e}")
        return None

# ── 4D scraper ────────────────────────────────────────
def scrape_4d():
    """Scrape latest 4D results from Singapore Pools."""
    print("Scraping 4D results...")
    url = "https://www.singaporepools.com.sg/en/product/Pages/4d_results.aspx"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; LuckyCatBot/1.0)"}
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")

        # Draw number
        draw_no = None
        draw_el = soup.find(string=re.compile(r"Draw No\.", re.I))
        if draw_el:
            m = re.search(r"(\d{4,5})", draw_el.parent.get_text())
            if m: draw_no = int(m.group(1))

        # Prize numbers — look for 4-digit patterns
        text = soup.get_text()
        # Extract all 4-digit numbers from the page
        all_4d = re.findall(r"\b(\d{4})\b", text)
        unique_4d = list(dict.fromkeys(all_4d))  # preserve order, remove dups

        first = unique_4d[0] if len(unique_4d) > 0 else None
        second = unique_4d[1] if len(unique_4d) > 1 else None
        third = unique_4d[2] if len(unique_4d) > 2 else None
        special = unique_4d[3:13] if len(unique_4d) > 13 else []
        consolation = unique_4d[13:23] if len(unique_4d) > 23 else []

        draw_date = datetime.now().strftime("%d %b %Y")
        date_el = soup.find(string=re.compile(r"\d{1,2}\s+\w+\s+\d{4}"))
        if date_el: draw_date = date_el.strip()

        result = {
            "draw_no": draw_no,
            "draw_date": draw_date,
            "first": first,
            "second": second,
            "third": third,
            "special": json.dumps(special),
            "consolation": json.dumps(consolation),
            "scraped_at": datetime.utcnow().isoformat(),
        }
        print(f"4D Draw #{draw_no}: 1st={first} 2nd={second} 3rd={third}")
        return result
    except Exception as e:
        print(f"4D scrape error: {e}")
        return None

# ── Update probability weights ────────────────────────
def update_toto_weights():
    """Recalculate TOTO number frequencies from stored results."""
    print("Updating TOTO weights...")
    results = supabase_select("toto_results", "select=num1,num2,num3,num4,num5,num6,additional")
    freq = {n: 0 for n in range(1, 50)}
    for row in results:
        for key in ["num1","num2","num3","num4","num5","num6","additional"]:
            if row.get(key): freq[int(row[key])] += 1
    weights = [{"number": n, "frequency": freq[n], "updated_at": datetime.utcnow().isoformat()} for n in range(1, 50)]
    supabase_upsert("toto_weights", weights, "number")
    print(f"Updated weights for {len(weights)} numbers from {len(results)} draws")

def update_4d_weights():
    """Recalculate 4D digit-position frequencies from stored results."""
    print("Updating 4D weights...")
    results = supabase_select("4d_results", "select=first,second,third,special,consolation")
    pos_freq = [{d: 0 for d in range(10)} for _ in range(4)]
    for row in results:
        all_nums = []
        for key in ["first","second","third"]:
            if row.get(key): all_nums.append(str(row[key]).zfill(4))
        for arr_key in ["special","consolation"]:
            if row.get(arr_key):
                try:
                    parsed = json.loads(row[arr_key]) if isinstance(row[arr_key], str) else row[arr_key]
                    all_nums.extend([str(n).zfill(4) for n in parsed])
                except: pass
        for num in all_nums:
            if len(num) == 4:
                for pos, digit in enumerate(num):
                    pos_freq[pos][int(digit)] += 1
    weights = []
    for pos in range(4):
        for digit in range(10):
            weights.append({"position": pos, "digit": digit, "frequency": pos_freq[pos][digit], "updated_at": datetime.utcnow().isoformat()})
    supabase_upsert("4d_digit_weights", weights, "position,digit")
    print(f"Updated 4D digit weights across {len(results)} draws")

# ── Main ──────────────────────────────────────────────
def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_KEY environment variables required.")
        return

    # Scrape
    toto = scrape_toto()
    if toto and toto.get("draw_no"):
        supabase_upsert("toto_results", [toto], "draw_no")
        update_toto_weights()

    d4 = scrape_4d()
    if d4 and d4.get("draw_no"):
        supabase_upsert("4d_results", [d4], "draw_no")
        update_4d_weights()

    print("Done!")

if __name__ == "__main__":
    main()
