# Consolidated UofSC Academic Calendar Hub (2025–2030)

An elegant, single-page web application that brings together the official academic calendars of the **University of South Carolina (Columbia Campus)** for the years **2025 through 2030** (covering academic years 2025–26, 2026–27, 2027–28, 2028–29, and 2029–30).

This application was designed to replace the standard multi-page university registrar lists with a single consolidated, ultra-fast, premium experience tailored for students, faculty, and administrators.

---

## 🌟 Premium Features

- **Consolidated Dashboard**: Switch instantly between academic years (2025–2030) using high-fidelity tabs.
- **Dual Visual Modes**:
  - **Card Grid Layout**: Semesters (Fall, Spring, Summer) and supporting documents (Registration, Exams, Payments) presented as beautiful glassmorphic columns.
  - **Chronological Timeline**: An active, unified vertical timeline mapping all events across the selected academic year step-by-step.
- **Smart Search & Indexing**: Instant fuzzy search across all descriptions, dates, and terms (e.g. searching "Thanksgiving", "Exam", or "Aug" matches dynamically in real-time).
- **Interactive Event Filters**: Clickable category chips to isolate events instantly:
  - 🟠 Holidays & Breaks
  - 🟢 Classes Begin/End
  - 🔵 Final Examinations
  - 🟣 Commencement & Graduation Exercises
  - 🔴 Registration & Deadline Windows
- **Live Milestones Ticker**: A live, high-contrast hero countdown card ticking down in real-time (Days, Hours, Minutes, Seconds) to the very next official academic event, relative to the current calendar date.
- **1-Click Calendar Sync (iCal .ics Exporter)**:
  - **Semester-Wide Sync**: Download the entire semester's calendar as a standard `.ics` file with one click to import it instantly into Google Calendar, Apple Calendar, Outlook, or mobile devices.
  - **Single-Event Sync**: Sync individual events of interest directly.
- **Responsive & Premium Design System**: Tailored using the signature UofSC Garnet (`#73000a`) and collegiate Warm Gold (`#c2a15c`), featuring a modern dark theme by default, clean typography (Outfit and Inter from Google Fonts), glassmorphic elements, smooth micro-interactions, and a sleek **Light/Dark Theme toggle**.

---

## 📂 Project Architecture

```
USC_Cal/
├── index.html         # Structural foundation and SEO-optimized markup
├── site.css           # Premium design system, variables, layouts, and theme configs
├── app.js             # Client-side engine (countdowns, filters, timeline, ICS generation)
├── data.js            # Consolidated academic data constant (offline and CORS-safe)
├── .gitignore         # Keeps intermediate compiler/system files out of history
└── parser/            # Scraper workspace used to build the data
    ├── parse_calendars.py     # Python bs4 parser script
    ├── academic_calendars.json # Extracted structured JSON data
    └── 2025-30_calendar.html  # Raw HTML reference sources downloaded from Registrar
```

---

## 🚀 Getting Started

The web application is fully static, serverless, and offline-safe! Because all data is stored inside `data.js` as a global JavaScript constant, there are **no CORS restriction issues** when loading data locally.

To run the site:
1. Double-click **`index.html`** to open it directly in any modern browser.
2. Alternatively, serve it using any simple static file server (e.g., `npx serve .` or `python3 -m http.server`).

---

## 🛠 Rebuilding/Updating Data

If you need to edit or re-compile the academic calendars:
1. The raw HTML pages from the UofSC registrar are stored in `parser/`.
2. To re-run the extraction:
   ```bash
   python3 parser/parse_calendars.py
   ```
3. To wrap the updated JSON into our CORS-safe `data.js` file:
   ```bash
   python3 -c "import json; d=json.load(open('parser/academic_calendars.json')); open('data.js','w').write('const CALENDAR_DATA = ' + json.dumps(d, indent=2) + ';')"
   ```

---

## 🤝 Open Source & Licensing

Designed with care by Antigravity Developer Pair. Original calendar schedules are intellectual property of the **University of South Carolina Registrar**. Always check official registrar pages (`sc.edu/registrar`) for administrative schedule changes.
