"""
Lucky Cat — Singapore Pools Results Scraper (Fixed)
Uses Singapore Pools' static HTML archive files which don't need JavaScript.

Required GitHub Secrets:
  SUPABASE_URL   — https://yourprojectid.supabase.co
  SUPABASE_KEY   — your Supabase secret key (sb_secret_...)

Install: pip install requests beautifulsoup4
"""

import os, re, json, requests
from datetime import datetime
from bs4 import BeautifulSoup

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; LuckyCatBot/1.0)"}

TOTO_URL = "https://www.singaporepools.com.sg/DataFileArchive/Lottery/Output/toto_result_top_draws_en.html"
FOURD_URL = "https://www.singaporepools.com.sg/DataFileArchive/Lottery/Output/fourd_result_top_draws_en.html"

def supa_upsert(table, rows, conflict):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    hdrs = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": f"resolution=merge-duplicates,return=minimal",
    }
    r = requests.post(url, headers=hdrs, json=rows)
    if r.status_code not in (200, 201):
        raise Exception(f"Supabase {table} error {r.status_code}: {r.text}")
    print(f"  Saved {len(rows)} row(s) to {table}")

def supa_select(table, qs=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{qs}"
    hdrs = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    return requests.get(url, headers=hdrs).json()

def scrape_toto():
    print("Fetching TOTO results...")
    try:
        resp = requests.get(TOTO_URL, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text()
        results = []
        draws = re.split(r'(?=(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\d)', text)
        for section in draws:
            section = section.strip()
            if not section:
                continue
            date_m = re.search(r'((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\d{1,2}\s+\w+\s+\d{4})', section)
            draw_m = re.search(r'Draw No\.\s*(\d+)', section)
            if not date_m or not draw_m:
                continue
            draw_date = date_m.group(1).strip()
            draw_no = int(draw_m.group(1))
            nums = [int(n) for n in re.findall(r'\b([1-4]?\d)\b', section) if 1 <= int(n) <= 49 and int(n) != draw_no]
            if len(nums) < 7:
                continue
            winning = sorted(nums[:6])
            additional = nums[6]
            jackpot_m = re.search(r'Group 1.*?\$([\d,]+)', section, re.DOTALL)
            jackpot = f"${jackpot_m.group(1)}" if jackpot_m else "—"
            results.append({
                "draw_no": draw_no, "draw_date": draw_date,
                "num1": winning[0], "num2": winning[1], "num3": winning[2],
                "num4": winning[3], "num5": winning[4], "num6": winning[5],
                "additional": additional, "jackpot": jackpot,
                "scraped_at": datetime.utcnow().isoformat(),
            })
            print(f"  TOTO #{draw_no} ({draw_date}): {winning} +{additional} | {jackpot}")
        return results
    except Exception as e:
        print(f"  TOTO error: {e}")
        return []

def scrape_4d():
    print("Fetching 4D results...")
    try:
        resp = requests.get(FOURD_URL, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text()
        results = []
        draws = re.split(r'(?=(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\d)', text)
        for section in draws:
            section = section.strip()
            if not section:
                continue
            date_m = re.search(r'((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\d{1,2}\s+\w+\s+\d{4})', section)
            draw_m = re.search(r'Draw No\.\s*(\d+)', section)
            if not date_m or not draw_m:
                continue
            draw_date = date_m.group(1).strip()
            draw_no = int(draw_m.group(1))
            all4d = re.findall(r'\b(\d{4})\b', section)
            if len(all4d) < 3:
                continue
            seen = set()
            unique = []
            for n in all4d:
                if n not in seen:
                    seen.add(n)
                    unique.append(n)
            results.append({
                "draw_no": draw_no, "draw_date": draw_date,
                "first": unique[0] if len(unique) > 0 else None,
                "second": unique[1] if len(unique) > 1 else None,
                "third": unique[2] if len(unique) > 2 else None,
                "special": json.dumps(unique[3:13]),
                "consolation": json.dumps(unique[13:23]),
                "scraped_at": datetime.utcnow().isoformat(),
            })
            print(f"  4D #{draw_no} ({draw_date}): {unique[0]} / {unique[1]} / {unique[2]}")
        return results
    except Exception as e:
        print(f"  4D error: {e}")
        return []

def update_toto_weights():
    print("Updating TOTO weights...")
    rows = supa_select("toto_results", "select=num1,num2,num3,num4,num5,num6,additional")
    if not rows: return
    freq = {n: 0 for n in range(1, 50)}
    for row in rows:
        for k in ["num1","num2","num3","num4","num5","num6","additional"]:
            if row.get(k): freq[int(row[k])] += 1
    weights = [{"number": n, "frequency": max(freq[n], 1), "updated_at": datetime.utcnow().isoformat()} for n in range(1, 50)]
    supa_upsert("toto_weights", weights, "number")

def update_4d_weights():
    print("Updating 4D weights...")
    rows = supa_select("4d_results", "select=first,second,third,special,consolation")
    if not rows: return
    pos_freq = [{d: 0 for d in range(10)} for _ in range(4)]
    for row in rows:
        nums = []
        for k in ["first","second","third"]:
            if row.get(k): nums.append(str(row[k]).zfill(4))
        for k in ["special","consolation"]:
            try:
                v = row.get(k)
                parsed = json.loads(v) if isinstance(v, str) else (v or [])
                nums += [str(n).zfill(4) for n in parsed]
            except: pass
        for num in nums:
            if len(num) == 4:
                for pos, digit in enumerate(num):
                    pos_freq[pos][int(digit)] += 1
    weights = [
        {"position": pos, "digit": d, "frequency": max(pos_freq[pos][d], 1), "updated_at": datetime.utcnow().isoformat()}
        for pos in range(4) for d in range(10)
    ]
    supa_upsert("4d_digit_weights", weights, "position,digit")

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Set SUPABASE_URL and SUPABASE_KEY.")
        return
    toto_rows = scrape_toto()
    if toto_rows:
        supa_upsert("toto_results", toto_rows, "draw_no")
        update_toto_weights()
    fourd_rows = scrape_4d()
    if fourd_rows:
        supa_upsert("4d_results", fourd_rows, "draw_no")
        update_4d_weights()
    print("Done!")

if __name__ == "__main__":
    main()
