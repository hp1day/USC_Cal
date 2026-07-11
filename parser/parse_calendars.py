import os
import json
import re
from bs4 import BeautifulSoup

def clean_text(text):
    if not text:
        return ""
    # replace non-breaking spaces and clean whitespace
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def parse_file(filepath, year_label):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Find all accordion buttons
    buttons = soup.find_all('button', class_='accordion-summary')
    sections = []
    
    for btn in buttons:
        title = clean_text(btn.get_text())
        if not title:
            continue
        
        # The next sibling element might be the div.accordion-details
        details_div = btn.find_next_sibling('div', class_='accordion-details')
        if not details_div:
            # try finding next sibling general div
            details_div = btn.find_next('div', class_='accordion-details')
            
        if not details_div:
            continue
            
        # Extract tables from details_div
        tables_data = []
        tables = details_div.find_all('table')
        for table in tables:
            rows_data = []
            headers = [clean_text(th.get_text()) for th in table.find_all('th')]
            
            # if no headers, we assume [Event, Date] or try to find columns
            tbody = table.find('tbody')
            target = tbody if tbody else table
            
            for tr in target.find_all('tr'):
                # skip header row if it contains th
                if tr.find('th'):
                    continue
                cells = tr.find_all('td')
                if len(cells) >= 2:
                    event = clean_text(cells[0].get_text())
                    date_val = clean_text(cells[1].get_text())
                    rows_data.append({
                        "event": event,
                        "date": date_val
                    })
                elif len(cells) == 1:
                    # sometimes a single cell might span or be a subtitle/header row
                    text = clean_text(cells[0].get_text())
                    rows_data.append({
                        "event": text,
                        "date": ""
                    })
            if rows_data:
                tables_data.append({
                    "headers": headers,
                    "rows": rows_data
                })
        
        # Extract text or paragraphs
        paragraphs = [clean_text(p.get_text()) for p in details_div.find_all('p') if clean_text(p.get_text())]
        
        sections.append({
            "section_title": title,
            "tables": tables_data,
            "paragraphs": paragraphs
        })
        
    return {
        "academic_year": year_label,
        "sections": sections
    }

def main():
    years = ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30"]
    all_data = []
    
    for yr in years:
        filename = f"{yr}_calendar.html"
        if os.path.exists(filename):
            print(f"Parsing {filename}...")
            data = parse_file(filename, yr)
            all_data.append(data)
            print(f"Parsed {len(data['sections'])} sections from {yr}")
        else:
            print(f"File not found: {filename}")
            
    with open('academic_calendars.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)
    print("Done! Data written to academic_calendars.json")

if __name__ == '__main__':
    main()
