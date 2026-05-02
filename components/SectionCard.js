export default function SectionCard({ title, description, children }) {
  return (
    <section className="panel-card h-100">
      <div className="panel-card-header">
        <div>
          <h2 className="panel-title mb-1">{title}</h2>
          <p className="panel-description mb-0">{description}</p>
        </div>
      </div>
      <div className="panel-card-body">{children}</div>
    </section>
  );
}
