export default function TrendBars({ data }) {
  const max = Math.max(...data.map((item) => item.value));

  return (
    <div className="trend-grid">
      {data.map((item) => (
        <div className="trend-item" key={item.label}>
          <div className="trend-value">Rs. {item.value}k</div>
          <div className="trend-bar-wrap">
            <div
              className="trend-bar"
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </div>
          <div className="trend-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
