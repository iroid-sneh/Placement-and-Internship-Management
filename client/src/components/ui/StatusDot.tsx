import React from 'react';
export type StatusType =
'success' |
'warning' |
'info' |
'error' |
'pending' |
'neutral';
interface StatusDotProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
}
export function StatusDot({ status, label, size = 'md' }: StatusDotProps) {
  const colors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    error: 'bg-red-500',
    pending: 'bg-amber-400',
    neutral: 'bg-slate-400'
  };
  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5'
  };
  return (
    <div className="flex items-center">
      <span
        className={`${colors[status]} ${dotSizes[size]} rounded-full ring-2 ring-white`} />

      {label && <span className="ml-2 text-sm text-slate-600">{label}</span>}
    </div>);

}