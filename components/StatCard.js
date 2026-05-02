export default function StatCard({ label, value, delta, tone }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="d-flex justify-content-between align-items-start gap-3">
        <div>
          <p className="stat-label mb-2">{label}</p>
          <h3 className="stat-value mb-0">{value}</h3>
        </div>
        <span className="stat-delta">{delta}</span>
      </div>
    </div>
  );
}
