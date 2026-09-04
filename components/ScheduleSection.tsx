'use client';

import clsx from 'clsx';
import { Bookmark, ChevronRight, Clock3, MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ORIENTATION_MONTH,
  filterEvents,
  filterEventsByDate,
  orientationEvents,
  savedSummary,
  type EventCategory,
  type OrientationEvent,
} from '../lib/events';

/** Filter chips, in display order. `all` is the identity filter. */
const CATEGORY_FILTERS: { value: EventCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All events' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'food', label: 'Food' },
  { value: 'social', label: 'Social' },
  { value: 'resources', label: 'Resources' },
  { value: 'traditions', label: 'Traditions' },
];

/** The orientation week calendar. Some days have no events but still appear. */
const WEEK_DAYS: { day: string; date: string }[] = [
  { day: 'MON', date: '24' },
  { day: 'TUE', date: '25' },
  { day: 'WED', date: '26' },
  { day: 'THU', date: '27' },
  { day: 'FRI', date: '28' },
  { day: 'SAT', date: '29' },
];

type ScheduleSectionProps = {
  saved: ReadonlySet<string>;
  onToggleSaved: (id: string) => void;
  onSelectEvent: (event: OrientationEvent) => void;
};

export function ScheduleSection({ saved, onToggleSaved, onSelectEvent }: ScheduleSectionProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<EventCategory | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState('all');

  const visibleEvents = useMemo(
    () => filterEventsByDate(filterEvents(orientationEvents, query, category), selectedDate),
    [query, category, selectedDate],
  );

  const savedSummaryLabel = savedSummary(saved.size);

  function clearFilters() {
    setQuery('');
    setCategory('all');
    setSelectedDate('all');
  }

  return (
    <section className="schedule-section" id="schedule">
      <div className="section-intro"><div><span>ORIENTATION WEEK</span><h2>Build your schedule</h2><p>Curate a week that is uniquely yours. Save the sessions that speak to you, skip the ones that don&rsquo;t, and let Aggie Launch handle the rest.</p></div><div className="saved-count" title={savedSummaryLabel}><Bookmark size={17} fill={saved.size ? 'currentColor' : 'none'} /><strong>{saved.size}</strong><span>saved</span></div></div>

      <div className="week-strip" aria-label="Filter events by date">
        <button className={selectedDate === 'all' ? 'active' : ''} onClick={() => setSelectedDate('all')} aria-pressed={selectedDate === 'all'}><span>ALL</span><strong>WEEK</strong></button>
        {WEEK_DAYS.map(({ day, date }) => (
          <button className={selectedDate === date ? 'active' : ''} onClick={() => setSelectedDate(date)} aria-pressed={selectedDate === date} key={date}>
            <span>{day}</span><strong>{date}</strong>
          </button>
        ))}
      </div>

      <div className="event-controls">
        <label className="search-box"><Search size={17} /><span className="sr-only">Search events</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events, locations, or times" /></label>
        <div className="filter-row">
          {CATEGORY_FILTERS.map(({ value, label }) => (
            <button key={value} className={category === value ? 'active' : ''} onClick={() => setCategory(value)} aria-pressed={category === value}>{label}</button>
          ))}
        </div>
      </div>

      <div className="event-list">
        {visibleEvents.map((item) => {
          const isSaved = saved.has(item.id);

          return (
            <article className="schedule-card" key={item.id}>
              <div className="schedule-date"><span>{item.day}</span><strong>{item.date}</strong><small>{ORIENTATION_MONTH}</small></div>
              <div className="schedule-main"><span className={`category-label category-${item.category}`}>{item.category}</span><h3>{item.icon} {item.title}</h3><div className="schedule-meta"><span><Clock3 size={14} /> {item.time}</span><span><MapPin size={14} /> {item.place}</span></div></div>
              <div className="schedule-actions">
                <button
                  type="button"
                  className={clsx('bookmark-button', isSaved && 'saved')}
                  onClick={() => onToggleSaved(item.id)}
                  aria-pressed={isSaved}
                  aria-label={`${isSaved ? 'Remove' : 'Save'} ${item.title}`}
                >
                  <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                </button>
                <button className="details-button" onClick={() => onSelectEvent(item)}>Details <ChevronRight size={14} /></button>
              </div>
            </article>
          );
        })}
        {visibleEvents.length === 0 && (
          <div className="empty-state"><Search size={24} /><h3>No matching events</h3><p>Try another date, search, or category.</p><button onClick={clearFilters}>Clear filters</button></div>
        )}
      </div>
    </section>
  );
}
