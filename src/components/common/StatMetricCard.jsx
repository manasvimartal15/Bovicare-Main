import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function StatMetricCard({
  title,
  value,
  subvalue,
  trendLabel,
  trendDirection = 'up', // up | down | neutral
  icon: Icon,
  variant = 'default',
}) {
  return (
    <div className={`stat-metric-card variant-${variant}`}>
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div className="stat-icon-wrap">
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="stat-card-body">
        <div className="stat-value-row">
          <span className="stat-main-value">{value}</span>
          {subvalue && <span className="stat-sub-value">{subvalue}</span>}
        </div>

        {trendLabel && (
          <div className={`stat-trend-pill trend-${trendDirection}`}>
            {trendDirection === 'up' && <ArrowUpRight size={13} />}
            {trendDirection === 'down' && <ArrowDownRight size={13} />}
            {trendDirection === 'neutral' && <Minus size={13} />}
            <span>{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
