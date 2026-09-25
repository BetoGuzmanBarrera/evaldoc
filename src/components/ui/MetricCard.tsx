export function MetricCard({ label, value, caption, tone = 'success' }: { label: string; value: string | number; caption: string; tone?: 'success' | 'danger' | 'warning' }) {
  return <div className="metric-card"><p className="metric-label">{label}</p><strong className="metric-value">{value}</strong><span className={`metric-caption metric-caption-${tone}`}>{caption}</span></div>
}
