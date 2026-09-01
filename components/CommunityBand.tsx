import { ChevronRight, Users } from 'lucide-react';

const COMMUNITY_IMPACT_STATISTICS = [
  { id: 'students', value: '47,000+', label: 'AGGIES ON CAMPUS' },
  { id: 'days', value: '8', label: 'DAYS OF ORIENTATION' },
  { id: 'agree', value: '98%', label: 'OF STUDENTS AGREE' },
];

export function CommunityBand() {
  return (
    <section className="community-band">
      <div className="community-photo">
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image is unavailable in the static Pages export; the image is sized and lazy-loaded instead. */}
        <img
          className="community-photo-image"
          src="aggie-community.jpg"
          alt="Illustration of students celebrating with the Utah State mascot in front of Old Main"
          width={1320}
          height={990}
          loading="lazy"
          decoding="async"
        />
        <span className="community-photo-tag">ORIENTATION WEEK &middot; LOGAN CAMPUS</span>
      </div>
      <div className="community-copy">
        <span><Users size={13} /> YOU BELONG HERE</span>
        <h2>Find your herd</h2>
        <p>From move-in day to graduation day, you are never navigating Utah State alone. Thousands of Aggies have stood on this exact quad, felt exactly what you are feeling right now, and gone on to do incredible things.</p>
        <div className="community-stats">
          {COMMUNITY_IMPACT_STATISTICS.map((stat) => (
            <div key={stat.id}><strong>{stat.value}</strong><small>{stat.label}</small></div>
          ))}
        </div>
        <a href="#mentor">Meet your A-Team mentors <ChevronRight size={15} /></a>
      </div>
    </section>
  );
}
