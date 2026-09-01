import { MessageCircle } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Utah State Orientation home">
        <span className="brand-a" aria-hidden="true"><span>A</span></span>
        <span><strong>UTAH STATE</strong><small>STUDENT ORIENTATION</small></span>
      </a>
      <nav aria-label="Main navigation"><a href="#schedule">Schedule</a><a href="#map">Campus map</a><a href="#mentor">Mentor chat</a></nav>
      <a className="header-chat-link" href="#mentor"><MessageCircle size={15} /> Chat with a mentor</a>
    </header>
  );
}
