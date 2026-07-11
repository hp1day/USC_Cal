/* -------------------------------------------------------------
   Carolinas Calendar Hub - Consolidated Academic Calendar Logic
   University of South Carolina (2025-2030)
   ------------------------------------------------------------- */

// State Management
const STATE = {
  activeYear: '2026-27', // Default to 2026-27 as the current academic year
  viewMode: 'grid', // 'grid' or 'timeline'
  activeCategory: 'all', // 'all', 'break', 'classes', 'exams', 'graduation', 'registration'
  searchQuery: '',
  theme: 'dark',
  countdownInterval: null
};

// Map months to index numbers
const MONTH_MAP = {
  'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
  'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
  'january': 0, 'february': 1, 'march': 2, 'april': 3, 'june': 5,
  'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // 1. Detect System Theme Preference or load saved theme
  const savedTheme = localStorage.getItem('usc-calendar-theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    setTheme('dark'); // Default to beautiful dark mode
  }

  // 2. Initialize year selectors & click handlers
  renderYearTabs();
  
  // 3. Set up event listeners for filters & buttons
  setupEventListeners();

  // 4. Run initial render
  renderApp();

  // 5. Initialize live countdown timer to next event
  startCountdownTimer();
});

/* -------------------------------------------------------------
   Event Categorization & Date Parsing Logic
   ------------------------------------------------------------- */

/**
 * Determines the category of an event based on its text description
 */
function getEventCategory(eventName) {
  const text = eventName.toLowerCase();
  
  if (text.includes('holiday') || text.includes('break') || text.includes('recess') || text.includes('no classes') || text.includes('day off')) {
    return 'break';
  }
  if (text.includes('classes begin') || text.includes('classes end') || text.includes('first day of class') || text.includes('last day of class') || text.includes('reading day') || text.includes('midpoint') || text.includes('faculty reporting')) {
    return 'classes';
  }
  if (text.includes('examination') || text.includes('exam') || text.includes('tests')) {
    return 'exams';
  }
  if (text.includes('commencement') || text.includes('graduation') || text.includes('awards day') || text.includes('convocation')) {
    return 'graduation';
  }
  if (text.includes('register') || text.includes('registration') || text.includes('payment') || text.includes('drop') || text.includes('add') || text.includes('withdraw') || text.includes('fee') || text.includes('refund') || text.includes('deadline') || text.includes('survey')) {
    return 'registration';
  }
  return 'registration'; // Default category
}

/**
 * Parses USC academic calendar date strings into real JS Date objects
 */
function parseEventDate(dateStr, acadYear, sectionTitle) {
  if (!dateStr || dateStr.toLowerCase().includes('graduation application deadline') || dateStr.trim() === '') {
    return null;
  }

  const [startYearStr, endYearSuffix] = acadYear.split('-');
  const startYear = parseInt(startYearStr);
  const endYear = 2000 + parseInt(endYearSuffix);

  const cleanStr = dateStr.toLowerCase().replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const isSpringOrSummer = sectionTitle.toLowerCase().includes('spring') || sectionTitle.toLowerCase().includes('summer');

  // Find all month index mentions
  let foundMonths = [];
  for (const m in MONTH_MAP) {
    if (m.length === 3) { // Use 3-letter abbreviation to search safely
      const idx = cleanStr.indexOf(m);
      if (idx !== -1) {
        foundMonths.push({ month: m, index: idx });
      }
    }
  }

  // Sort months by order of appearance
  foundMonths.sort((a, b) => a.index - b.index);

  // If no months found, return null
  if (foundMonths.length === 0) {
    return null;
  }

  const m1 = foundMonths[0].month;
  let year = startYear;
  if (isSpringOrSummer) {
    year = endYear;
  } else if (['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul'].includes(m1)) {
    year = endYear;
  } else {
    year = startYear;
  }

  let startDate = null;
  let endDate = null;

  if (foundMonths.length >= 2) {
    // Case 1: Double Month Range e.g. "April 29 - May 6"
    const m2 = foundMonths[1].month;
    const str1 = cleanStr.substring(foundMonths[0].index, foundMonths[1].index);
    const str2 = cleanStr.substring(foundMonths[1].index);

    const num1Match = str1.match(/\d+/);
    const num2Match = str2.match(/\d+/);

    if (num1Match && num2Match) {
      const d1 = parseInt(num1Match[0]);
      const d2 = parseInt(num2Match[0]);

      const y1 = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul'].includes(m1) ? endYear : startYear;
      const y2 = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul'].includes(m2) ? endYear : startYear;

      startDate = new Date(y1, MONTH_MAP[m1], d1);
      endDate = new Date(y2, MONTH_MAP[m2], d2);
    }
  } else {
    // Case 2 & 3: Single Month Range or Single Day
    const numMatches = cleanStr.match(/\d+/g);
    if (numMatches) {
      const m1_idx = MONTH_MAP[m1];
      if (numMatches.length >= 2 && cleanStr.includes('-')) {
        // Range inside a single month e.g. "Oct. 9 - 10"
        const d1 = parseInt(numMatches[0]);
        const d2 = parseInt(numMatches[1]);
        startDate = new Date(year, m1_idx, d1);
        endDate = new Date(year, m1_idx, d2);
      } else if (numMatches.length >= 1) {
        // Single day e.g. "Aug. 19"
        const d1 = parseInt(numMatches[0]);
        startDate = new Date(year, m1_idx, d1);
        endDate = new Date(year, m1_idx, d1);
      }
    }
  }

  // Verification
  if (startDate && isNaN(startDate.getTime())) startDate = null;
  if (endDate && isNaN(endDate.getTime())) endDate = null;

  return { startDate, endDate };
}

/* -------------------------------------------------------------
   UI Render & State Actions
   ------------------------------------------------------------- */

function setTheme(theme) {
  STATE.theme = theme;
  localStorage.setItem('usc-calendar-theme', theme);
  if (theme === 'dark') {
    document.body.classList.remove('light-mode');
  } else {
    document.body.classList.add('light-mode');
  }
}

function renderYearTabs() {
  const years = [...new Set(CALENDAR_DATA.map(d => d.academic_year))].sort();
  const tabsContainer = document.getElementById('yearTabs');
  if (!tabsContainer) return;

  tabsContainer.innerHTML = '';
  years.forEach(yr => {
    const btn = document.createElement('button');
    btn.className = `year-tab ${STATE.activeYear === yr ? 'active' : ''}`;
    btn.setAttribute('data-year', yr);
    btn.textContent = `20${yr.replace('-', '–')}`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.year-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      STATE.activeYear = yr;
      renderApp();
    });
    tabsContainer.appendChild(btn);
  });
}

function setupEventListeners() {
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTheme(STATE.theme === 'dark' ? 'light' : 'dark');
    });
  }

  // Search Input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      STATE.searchQuery = e.target.value.trim().toLowerCase();
      renderApp();
    });
  }

  // View Mode Toggles (Grid vs Timeline)
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.viewMode = btn.getAttribute('data-view');
      renderApp();
    });
  });

  // Category Filter Pills
  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-category]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.activeCategory = btn.getAttribute('data-category');
      renderApp();
    });
  });
}

/**
 * Main rendering router
 */
function renderApp() {
  const container = document.getElementById('calendarContainer');
  if (!container) return;

  container.innerHTML = '';

  // Get data for selected year
  const yearData = CALENDAR_DATA.find(d => d.academic_year === STATE.activeYear);
  if (!yearData) return;

  if (STATE.viewMode === 'grid') {
    renderGridView(yearData, container);
  } else {
    renderTimelineView(yearData, container);
  }
}

/**
 * Grid View: Semesters rendered as side-by-side premium cards
 */
function renderGridView(yearData, container) {
  const gridDiv = document.createElement('div');
  gridDiv.className = 'semesters-grid';

  // If search query is active, show search details
  if (STATE.searchQuery) {
    const searchHeader = document.createElement('div');
    searchHeader.className = 'search-results-info';
    searchHeader.innerHTML = `Showing results matching "<span>${STATE.searchQuery}</span>" across 20${STATE.activeYear.replace('-', '–')}`;
    container.appendChild(searchHeader);
  }

  yearData.sections.forEach(section => {
    // Collect filtered events from section tables
    let filteredEvents = [];
    section.tables.forEach(table => {
      table.rows.forEach(row => {
        const category = getEventCategory(row.event);
        const matchesCategory = STATE.activeCategory === 'all' || STATE.activeCategory === category;
        const matchesSearch = STATE.searchQuery === '' || row.event.toLowerCase().includes(STATE.searchQuery) || row.date.toLowerCase().includes(STATE.searchQuery);

        if (matchesCategory && matchesSearch) {
          filteredEvents.push({
            event: row.event,
            date: row.date,
            category: category
          });
        }
      });
    });

    // Skip rendering section if empty and filter is applied
    if (filteredEvents.length === 0 && (STATE.activeCategory !== 'all' || STATE.searchQuery !== '')) {
      return;
    }

    const card = document.createElement('div');
    card.className = 'semester-card';

    // Header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'semester-card-header';
    cardHeader.innerHTML = `
      <h3 class="semester-title">${section.section_title}</h3>
      <div class="semester-card-actions">
        <button class="export-btn" onclick="exportSemester('${section.section_title}', '${STATE.activeYear}')">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Export (.ics)
        </button>
      </div>
    `;
    card.appendChild(cardHeader);

    // Events List
    const eventsList = document.createElement('div');
    eventsList.className = 'events-list';

    filteredEvents.forEach(evt => {
      const row = document.createElement('div');
      row.className = `event-row cat-${evt.category}`;
      
      const cleanDate = evt.date.replace(/, \w+day/gi, ''); // remove day of week for clean display
      const weekdayMatch = evt.date.match(/, (\w+day)/i);
      const weekday = weekdayMatch ? weekdayMatch[1] : '';

      row.innerHTML = `
        <div class="event-detail">
          <div class="event-name">${evt.event}</div>
          <span class="event-badge">${evt.category}</span>
        </div>
        <div class="event-date-col">
          ${cleanDate}
          ${weekday ? `<span class="event-weekday">${weekday}</span>` : ''}
        </div>
        <div class="row-actions">
          <button class="row-action-btn" title="Copy Details" onclick="copyEvent('${evt.event}', '${evt.date}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="row-action-btn" title="Export Single Event (.ics)" onclick="exportSingleEvent('${evt.event}', '${evt.date}', '${STATE.activeYear}', '${section.section_title}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          </button>
        </div>
      `;
      eventsList.appendChild(row);
    });

    if (filteredEvents.length === 0) {
      eventsList.innerHTML = `<div class="event-row" style="color:var(--text-muted); justify-content:center; text-align:center;">No events match filters.</div>`;
    }

    card.appendChild(eventsList);
    gridDiv.appendChild(card);
  });

  if (gridDiv.children.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.textAlign = 'center';
    emptyState.style.padding = '4rem 0';
    emptyState.style.color = 'var(--text-muted)';
    emptyState.innerHTML = `<h3>No calendar events found matching selected filters.</h3>`;
    container.appendChild(emptyState);
  } else {
    container.appendChild(gridDiv);
  }
}

/**
 * Timeline View: Sorted chronologically
 */
function renderTimelineView(yearData, container) {
  const timelineDiv = document.createElement('div');
  timelineDiv.className = 'timeline-container';

  // Gather all events with parsed dates
  let allEvents = [];
  yearData.sections.forEach(section => {
    section.tables.forEach(table => {
      table.rows.forEach(row => {
        const category = getEventCategory(row.event);
        const parsed = parseEventDate(row.date, STATE.activeYear, section.section_title);

        if (parsed && parsed.startDate) {
          const matchesCategory = STATE.activeCategory === 'all' || STATE.activeCategory === category;
          const matchesSearch = STATE.searchQuery === '' || row.event.toLowerCase().includes(STATE.searchQuery) || row.date.toLowerCase().includes(STATE.searchQuery);

          if (matchesCategory && matchesSearch) {
            allEvents.push({
              event: row.event,
              dateStr: row.date,
              category: category,
              startDate: parsed.startDate,
              endDate: parsed.endDate,
              term: section.section_title
            });
          }
        }
      });
    });
  });

  // Sort events chronologically
  allEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  if (allEvents.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.textAlign = 'center';
    emptyState.style.padding = '4rem 0';
    emptyState.style.color = 'var(--text-muted)';
    emptyState.innerHTML = `<h3>No chronologically parseable events found matching filters.</h3>`;
    container.appendChild(emptyState);
    return;
  }

  allEvents.forEach(evt => {
    const item = document.createElement('div');
    item.className = 'timeline-item';

    const cleanDate = evt.dateStr.replace(/, \w+day/gi, '');

    item.innerHTML = `
      <div class="timeline-badge"></div>
      <div class="timeline-content">
        <div class="timeline-info">
          <div class="timeline-meta">
            <span class="timeline-term">${evt.term}</span>
            <span class="event-badge" style="transform: scale(0.85); transform-origin: left;">${evt.category}</span>
          </div>
          <div class="event-name" style="font-size: 1.05rem; font-weight:600;">${evt.event}</div>
        </div>
        <div class="timeline-date">${cleanDate}</div>
      </div>
    `;
    timelineDiv.appendChild(item);
  });

  container.appendChild(timelineDiv);
}

/* -------------------------------------------------------------
   Countdown Ticker Engine
   ------------------------------------------------------------- */

function startCountdownTimer() {
  if (STATE.countdownInterval) {
    clearInterval(STATE.countdownInterval);
  }

  // Find the VERY next event from the academic calendars relative to today (July 11, 2026)
  const today = new Date('2026-07-11T01:14:15Z'); // Set base date as provided in user context
  let nextEvent = null;
  let minDiff = Infinity;

  CALENDAR_DATA.forEach(year => {
    year.sections.forEach(section => {
      section.tables.forEach(table => {
        table.rows.forEach(row => {
          const parsed = parseEventDate(row.date, year.academic_year, section.section_title);
          if (parsed && parsed.startDate) {
            const diff = parsed.startDate.getTime() - today.getTime();
            // Event is in the future
            if (diff > 0 && diff < minDiff) {
              minDiff = diff;
              nextEvent = {
                title: row.event,
                dateStr: row.date,
                startDate: parsed.startDate,
                semester: section.section_title,
                academic_year: year.academic_year
              };
            }
          }
        });
      });
    });
  });

  if (!nextEvent) {
    // Fallback if no future events found in range
    document.getElementById('countdownTarget').textContent = "All semesters concluded";
    document.getElementById('countdownDate').textContent = "Calendars 2025–2030 are complete!";
    return;
  }

  // Populate card details
  document.getElementById('countdownTarget').textContent = nextEvent.title;
  document.getElementById('countdownDate').textContent = `${nextEvent.semester} • ${nextEvent.dateStr.replace(/, \w+day/gi, '')}`;

  // Live updates
  const updateTimer = () => {
    // Mock user's live system progression starting from current context
    const now = new Date();
    // Offset standard system time to lock timeline with July 11, 2026
    const localTarget = nextEvent.startDate.getTime();
    
    // For realistic simulation in static page, let's count down relative to user system clock but offset so that base is 2026-07-11
    const staticBase = new Date('2026-07-11T01:14:15Z').getTime();
    const systemSessionStart = window.performance ? window.performance.timing.navigationStart : Date.now();
    const elapsed = Date.now() - systemSessionStart;
    const currentSimulatedTime = staticBase + elapsed;

    const diff = localTarget - currentSimulatedTime;

    if (diff <= 0) {
      clearInterval(STATE.countdownInterval);
      startCountdownTimer(); // find next event
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('timerDays').textContent = String(days).padStart(2, '0');
    document.getElementById('timerHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('timerMinutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('timerSeconds').textContent = String(seconds).padStart(2, '0');
  };

  updateTimer();
  STATE.countdownInterval = setInterval(updateTimer, 1000);
}

/* -------------------------------------------------------------
   Interactive Features: Copy and Calendar Export
   ------------------------------------------------------------- */

/**
 * Copies event to clipboard and fires a sleek toast message
 */
window.copyEvent = function(event, date) {
  const textToCopy = `${event} - ${date} (UofSC Academic Calendar)`;
  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast(`Copied: "${event}"`);
  }).catch(() => {
    showToast("Failed to copy. Clipboard permission required.");
  });
};

/**
 * Exports a single event into an iCalendar (.ics) file
 */
window.exportSingleEvent = function(eventTitle, dateStr, acadYear, sectionTitle) {
  const parsed = parseEventDate(dateStr, acadYear, sectionTitle);
  if (!parsed || !parsed.startDate) {
    showToast("Could not extract a valid date for this event.");
    return;
  }

  const icsString = generateICSContent([{
    title: eventTitle,
    startDate: parsed.startDate,
    endDate: parsed.endDate || parsed.startDate,
    term: sectionTitle
  }]);

  triggerICSDownload(`${eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.ics`, icsString);
};

/**
 * Compiles and exports an entire semester's calendar into an iCalendar (.ics) file
 */
window.exportSemester = function(semesterTitle, acadYear) {
  const yearData = CALENDAR_DATA.find(d => d.academic_year === acadYear);
  if (!yearData) return;

  const section = yearData.sections.find(s => s.section_title === semesterTitle);
  if (!section) return;

  let eventsToExport = [];
  section.tables.forEach(table => {
    table.rows.forEach(row => {
      const parsed = parseEventDate(row.date, acadYear, semesterTitle);
      if (parsed && parsed.startDate) {
        eventsToExport.push({
          title: row.event,
          startDate: parsed.startDate,
          endDate: parsed.endDate || parsed.startDate,
          term: semesterTitle
        });
      }
    });
  });

  if (eventsToExport.length === 0) {
    showToast("No valid calendar dates could be compiled for this semester.");
    return;
  }

  const icsString = generateICSContent(eventsToExport);
  triggerICSDownload(`${semesterTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_calendar.ics`, icsString);
};

/**
 * Helper to generate raw iCalendar (ICS) payload
 */
function generateICSContent(events) {
  let content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Carolinas Calendar Hub//UofSC Consolidated Academic Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const formatDateICS = (dateObj, adjustDays = 0) => {
    let d = new Date(dateObj.getTime());
    if (adjustDays !== 0) {
      d.setDate(d.getDate() + adjustDays);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  events.forEach((evt, idx) => {
    // Generate a uniquely deterministic UID
    const uid = `${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}@sc.edu`;
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    // ICS expects DTSTART and DTEND in YYYYMMDD format for all-day events.
    // To make an all-day event, DTEND must be the day AFTER the event ends.
    const startStr = formatDateICS(evt.startDate);
    const endStr = formatDateICS(evt.endDate, 1);

    content.push('BEGIN:VEVENT');
    content.push(`UID:${uid}`);
    content.push(`DTSTAMP:${dtstamp}`);
    content.push(`DTSTART;VALUE=DATE:${startStr}`);
    content.push(`DTEND;VALUE=DATE:${endStr}`);
    content.push(`SUMMARY:${evt.title}`);
    content.push(`DESCRIPTION:University of South Carolina Academic Calendar Event - ${evt.term}`);
    content.push('TRANSP:TRANSPARENT'); // Show as free time
    content.push('END:VEVENT');
  });

  content.push('END:VCALENDAR');
  return content.join('\r\n');
}

/**
 * Triggers browser anchor-link file download
 */
function triggerICSDownload(filename, payload) {
  const blob = new Blob([payload], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${filename} successfully!`);
}

/**
 * Dispatches a temporary toast notification in the UI
 */
function showToast(message) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg class="toast-success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  // Trigger reveal animation
  setTimeout(() => toast.classList.add('show'), 50);

  // Remove toast after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      container.removeChild(toast);
    }, 400);
  }, 3500);
}
