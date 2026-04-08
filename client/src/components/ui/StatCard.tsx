import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  trendLabel?: string;
  gradient?: 'teal' | 'purple' | 'orange' | 'blue';
  className?: string;
}
export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  gradient = 'teal',
  className = ''
}: StatCardProps) {
  const gradients = {
    teal: 'student-stat-card--teal',
    purple: 'student-stat-card--purple',
    orange: 'student-stat-card--orange',
    blue: 'student-stat-card--blue'
  };
  return (
    <div
      className={`student-stat-card ${gradients[gradient]} ${className}`}>

      <div className="student-stat-card__top">
        <div>
          <p className="student-stat-card__label">{title}</p>
          <h3 className="student-stat-card__value">{value}</h3>
        </div>
        <div className="student-stat-card__icon">
          {icon}
        </div>
      </div>

      {trend &&
      <div className="student-stat-card__trend">
          <span className="student-stat-card__trend-pill">

            {trend.direction === 'up' &&
          <ArrowUpRight />
          }
            {trend.direction === 'down' &&
          <ArrowDownRight />
          }
            {trend.direction === 'neutral' &&
          <Minus />
          }
            {trend.value}
          </span>
          {trendLabel ? <span>{trendLabel}</span> : null}
        </div>
      }
    </div>);

}
