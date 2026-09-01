'use client';

import dayjs from 'dayjs';
import { Bookmark, CalendarDays, Clock3, ExternalLink, MapPin, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ORIENTATION_MONTH, eventIsoDate, type OrientationEvent } from '../lib/events';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

type EventModalProps = {
  event: OrientationEvent;
  isSaved: boolean;
  onToggleSaved: (id: string) => void;
  onClose: () => void;
};

export function EventModal({ event, isSaved, onToggleSaved, onClose }: EventModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog on open and restore it to the trigger on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    return () => previouslyFocused?.focus?.();
  }, []);

  // Close on Escape and keep Tab inside the dialog while it is open.
  useEffect(() => {
    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === 'Escape') {
        onClose();
        return;
      }

      if (keyEvent.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (keyEvent.shiftKey && document.activeElement === first) {
        keyEvent.preventDefault();
        last.focus();
      } else if (!keyEvent.shiftKey && document.activeElement === last) {
        keyEvent.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="event-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <button className="modal-close" ref={closeRef} onClick={onClose} aria-label="Close"><X size={18} /></button>
        <span className={`category-label category-${event.category}`}>{event.category}</span>
        <h2 id="event-modal-title">{event.title}</h2>
        <p>{event.description}</p>
        <div className="modal-details">
          <span><CalendarDays size={16} /> {event.day}, {ORIENTATION_MONTH} {event.date}</span>
          <span><Clock3 size={16} /> {dayjs(eventIsoDate(event)).format('dddd')}</span>
          <span><Clock3 size={16} /> {event.time}</span>
          <span><MapPin size={16} /> {event.place}</span>
        </div>
        <div className="modal-actions">
          <button className="button button-primary" onClick={() => onToggleSaved(event.id)}>
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved to my week' : 'Save to my week'}
          </button>
          <a className="button modal-map-link" href="https://www.google.com/maps/search/?api=1&query=Utah+State+University,+Logan,+UT" target="_blank" rel="noreferrer">
            Open map <ExternalLink size={14} />
          </a>
        </div>
      </section>
    </div>
  );
}
