import { ExternalLink } from 'lucide-react';

export function CampusMapSection() {
  return (
    <section className="campus-map-section" id="map">
      <div className="map-heading"><div><span>GETTING AROUND</span><h2>Logan campus map</h2><p>Navigating a new campus can feel overwhelming, but it doesn&rsquo;t have to be. Search buildings, get directions, and see exactly where every orientation moment is happening.</p></div><a href="https://www.google.com/maps/dir/?api=1&destination=Utah+State+University,+Logan,+UT" target="_blank" rel="noreferrer">Get directions <ExternalLink size={15} /></a></div>
      <div className="google-map-frame"><iframe title="Google Maps view of Utah State University Logan campus" src="https://www.google.com/maps?q=Utah+State+University,+Logan,+UT&z=16&output=embed" loading="lazy" referrerPolicy="no-referrer" /><div className="map-overlay-card"><span>UTAH STATE UNIVERSITY</span><strong>Logan Campus</strong><p>Old Main Hill, Logan, UT 84322</p><a href="https://www.google.com/maps/search/?api=1&query=Utah+State+University,+Logan,+UT" target="_blank" rel="noreferrer">Open in Google Maps <ExternalLink size={13} /></a></div></div>
    </section>
  );
}
