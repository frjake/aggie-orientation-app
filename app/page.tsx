'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { CampusMapSection } from '../components/CampusMapSection';
import { CommunityBand } from '../components/CommunityBand';
import { EventModal } from '../components/EventModal';
import { HeroSection } from '../components/HeroSection';
import { MentorSection } from '../components/MentorSection';
import { ScheduleSection } from '../components/ScheduleSection';
import { ShareShowcase } from '../components/ShareShowcase';
import { SiteHeader } from '../components/SiteHeader';
import { ValuePillars } from '../components/ValuePillars';
import { type OrientationEvent } from '../lib/events';
import {
  getSavedSchedule,
  getSavedScheduleServerSnapshot,
  subscribeToSavedSchedule,
  toggleSavedEvent,
} from '../lib/saved-schedule';

export default function Home() {
  const saved = useSyncExternalStore(
    subscribeToSavedSchedule,
    getSavedSchedule,
    getSavedScheduleServerSnapshot,
  );

  const [selectedEvent, setSelectedEvent] = useState<OrientationEvent | null>(null);
  const closeModal = useCallback(() => setSelectedEvent(null), []);

  return (
    <main className="student-site">
      <SiteHeader />
      <HeroSection />
      <ShareShowcase />
      <ValuePillars />
      <ScheduleSection saved={saved} onToggleSaved={toggleSavedEvent} onSelectEvent={setSelectedEvent} />
      <CampusMapSection />
      <CommunityBand />
      <MentorSection />

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          isSaved={saved.has(selectedEvent.id)}
          onToggleSaved={toggleSavedEvent}
          onClose={closeModal}
        />
      )}
    </main>
  );
}
