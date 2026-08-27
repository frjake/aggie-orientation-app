import { ArrowLeft, MessageCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { OrientationChat } from '../../components/OrientationChat';

export default function MentorWorkspace() {
  return (
    <main className="mentor-workspace">
      <header className="mentor-topbar">
        <div className="mentor-wordmark"><span>A</span><div><strong>UTAH STATE</strong><small>A-TEAM MENTOR DESK</small></div></div>
        <div className="mentor-user"><span>MP</span><div><strong>Mentor Portal</strong><small>Available</small></div></div>
      </header>
      <div className="mentor-layout">
        <aside className="mentor-sidebar">
          <Link href="/"><ArrowLeft size={16} /> Student site</Link>
          <p>CONVERSATIONS</p>
          <button className="mentor-thread active"><span className="thread-avatar"><Users size={17} /></span><span><strong>Incoming students</strong><small>Shared orientation chat</small></span><i /></button>
          <div className="mentor-queue-note"><MessageCircle size={18} /><strong>All caught up</strong><span>New student messages appear automatically.</span></div>
        </aside>
        <section className="mentor-chat-area">
          <div className="mentor-chat-title"><div><span>ACTIVE CONVERSATION</span><h1>Incoming students</h1></div><p>Logan campus · Orientation Week</p></div>
          <OrientationChat sender="mentor" />
        </section>
      </div>
    </main>
  );
}
