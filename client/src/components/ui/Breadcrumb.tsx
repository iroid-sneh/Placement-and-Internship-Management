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
    <nav className="shared-breadcrumb" aria-label="Breadcrumb">
      <ol className="shared-breadcrumb__list">
        <li className="shared-breadcrumb__item">
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="shared-breadcrumb__home"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </button>
        </li>
        {items.map((item, index) =>
        <li key={index} className="shared-breadcrumb__item">
            <ChevronRight className="shared-breadcrumb__icon h-4 w-4" />
            {item.href ?
          <button
            onClick={() => onNavigate?.(item.href!)}
            className="shared-breadcrumb__link"
          >
                {item.label}
              </button> :

          <span
            className="shared-breadcrumb__current"
            aria-current="page">
                {item.label}
              </span>
          }
          </li>
        )}
      </ol>
    </nav>);

}
