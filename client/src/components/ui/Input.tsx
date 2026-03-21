import React from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}
export function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label &&
      <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      }
      <div className="relative">
        {icon &&
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        }
        <input
          className={`
            block h-11 w-full rounded-lg border bg-white shadow-sm
            pr-3 text-sm text-slate-900 placeholder:text-slate-400
            focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20
            disabled:bg-slate-50 disabled:text-slate-500
            ${icon ? 'pl-10' : 'pl-3'}
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300'}
            ${className}
          `}
          {...props} />

      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>);

}