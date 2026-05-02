export default function FeatureCard({ title, description, meta }) {
  return (
    <div className="feature-card h-100">
      <div className="feature-badge">{meta}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description mb-0">{description}</p>
    </div>
  );
}
