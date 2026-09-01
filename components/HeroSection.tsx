import { CalendarDays, ChevronRight, MapPin } from 'lucide-react';
import { ORIENTATION_MONTH } from '../lib/events';

export function HeroSection() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <div className="eyebrow">LOGAN CAMPUS · AUGUST 24–29</div>
        <h1>Your first week<br/><span>starts here.</span></h1>
        <p>In today&rsquo;s fast-paced higher education landscape, Aggie Launch is not just a schedule, it&rsquo;s your personalized launchpad into everything Utah State has to offer. Seamlessly discover events, effortlessly navigate our vibrant campus, and unlock your full potential from day one.</p>
        <div className="hero-actions"><a className="button button-primary" href="#schedule">View your week <ChevronRight size={17} /></a><a className="button button-secondary" href="#map"><MapPin size={16} /> Explore campus</a></div>
      </div>
      <div className="hero-side-card">
        <div className="hero-ai-lockup">
          <span className="hero-ai-mark" aria-hidden="true"><b>A</b><i>✦</i></span>
          <div><strong>AGGIE LAUNCH</strong></div>
        </div>
        <div className="hero-card-rule" />
        <span className="hero-card-label">ORIENTATION AT A GLANCE</span>
        <div className="hero-date"><strong>{ORIENTATION_MONTH}</strong><b>24</b><span>— 29</span></div>
        <div className="hero-card-rule" />
        <div className="hero-facts"><p><CalendarDays size={16} /><span><strong>6 days</strong> of events and traditions</span></p><p><MapPin size={16} /><span><strong>Logan campus</strong> Utah State University</span></p></div>
        <a href="#schedule">Browse the full schedule <ChevronRight size={15} /></a>
      </div>
    </section>
  );
}
