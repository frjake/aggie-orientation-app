const VALUE_PILLARS = [
  { id: 'personalized', icon: '🎯', title: 'Personalized', copy: 'A schedule that adapts to you, not the other way around.' },
  { id: 'connected', icon: '🤝', title: 'Connected', copy: 'Real mentors, real answers, in real time.' },
  { id: 'effortless', icon: '🚀', title: 'Effortless', copy: 'Everything you need for week one, in one place.' },
];

export function ValuePillars() {
  return (
    <section className="value-pillars">
      {VALUE_PILLARS.map((pillar) => (
        <div className="value-pillar" key={pillar.id}>
          <span aria-hidden="true">{pillar.icon}</span>
          <strong>{pillar.title}</strong>
          <p>{pillar.copy}</p>
        </div>
      ))}
    </section>
  );
}
