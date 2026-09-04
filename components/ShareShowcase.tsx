import { Sparkles } from 'lucide-react';

export function ShareShowcase() {
  return (
    <section className="og-showcase">
      <div className="og-showcase-copy">
        <span><Sparkles size={13} /> SHARE THE MOMENT</span>
        <h2>Tell your people</h2>
        <p>Every great orientation story starts with a single share. Post it, tag it, and let your friends and family know that your Aggie journey is officially underway.</p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image is unavailable in the static Pages export; the image is sized and lazy-loaded instead. */}
      <img
        className="og-showcase-image"
        src="og.jpg"
        alt="USU Orientation Week share card reading “Your first week starts here.”"
        width={1400}
        height={735}
        loading="lazy"
        decoding="async"
      />
    </section>
  );
}
