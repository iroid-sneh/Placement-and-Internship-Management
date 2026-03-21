import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
interface BreadcrumbItem {
  label: string;
  href?: string;
}
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
}
export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="text-slate-400 hover:text-slate-600 transition-colors">

            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </button>
        </li>
        {items.map((item, index) =>
        <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
            {item.href ?
          <button
            onClick={() => onNavigate?.(item.href!)}
            className="ml-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">

                {item.label}
              </button> :

          <span
            className="ml-2 text-sm font-medium text-slate-900"
            aria-current="page">

                {item.label}
              </span>
          }
          </li>
        )}
      </ol>
    </nav>);

}