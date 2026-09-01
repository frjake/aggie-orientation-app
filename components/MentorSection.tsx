import { OrientationChat } from './OrientationChat';

export function MentorSection() {
  return (
    <section className="mentor-section" id="mentor">
      <div className="mentor-copy"><span>A-TEAM MENTORS</span><h2>Questions are welcome.</h2><p>Orientation mentors are current USU students who have walked this exact path. They are here to help you plan, connect, and thrive, whether that means decoding your schedule, finding the right building, or just figuring out where to get ice cream.</p><ul><li><i /> Replies during orientation desk hours</li><li><i /> TSC Room 105 · (435) 797-0283</li><li><i /> orientation@usu.edu</li></ul></div>
      <OrientationChat sender="student" compact />
    </section>
  );
}
