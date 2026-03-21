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
  gradient?: 'teal' | 'purple' | 'orange' | 'blue';
  className?: string;
}
export function StatCard({
  title,
  value,
  icon,
  trend,
  gradient = 'teal',
  className = ''
}: StatCardProps) {
  const gradients = {
    teal: 'from-teal-500 to-cyan-600',
    purple: 'from-purple-500 to-pink-600',
    orange: 'from-orange-500 to-yellow-500',
    blue: 'from-blue-500 to-indigo-600'
  };
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradients[gradient]} p-6 text-white shadow-md ${className}`}>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <h3 className="mt-2 text-3xl font-bold">{value}</h3>
        </div>
        <div className="rounded-lg bg-white/20 p-2 text-white backdrop-blur-sm">
          {icon}
        </div>
      </div>

      {trend &&
      <div className="mt-4 flex items-center text-sm">
          <span
          className={`flex items-center rounded-full bg-white/20 px-2 py-0.5 font-medium backdrop-blur-sm`}>

            {trend.direction === 'up' &&
          <ArrowUpRight className="mr-1 h-3 w-3" />
          }
            {trend.direction === 'down' &&
          <ArrowDownRight className="mr-1 h-3 w-3" />
          }
            {trend.direction === 'neutral' &&
          <Minus className="mr-1 h-3 w-3" />
          }
            {trend.value}
          </span>
          <span className="ml-2 text-white/70">vs last month</span>
        </div>
      }
    </div>);

}