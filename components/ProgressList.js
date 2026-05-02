export default function ProgressList({ items }) {
  return (
    <div className="d-flex flex-column gap-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="d-flex justify-content-between mb-2">
            <span className="fw-semibold">{item.label}</span>
            <span className="text-muted">{item.value}%</span>
          </div>
          <div className="progress progress-slim">
            <div
              className={`progress-bar progress-bar-${item.tone}`}
              role="progressbar"
              style={{ width: `${item.value}%` }}
              aria-label={item.label}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
