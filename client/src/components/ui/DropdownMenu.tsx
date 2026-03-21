import React, { useEffect, useState, useRef } from 'react';
import { MoreVertical } from 'lucide-react';
export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}
interface DropdownMenuProps {
  items: DropdownItem[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
}
export function DropdownMenu({
  items,
  trigger,
  align = 'right'
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger ||
        <button className="flex items-center rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none">
            <span className="sr-only">Open options</span>
            <MoreVertical className="h-5 w-5" />
          </button>
        }
      </div>

      {isOpen &&
      <div
        className={`
          absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none
          ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}
        `}>

          <div className="py-1">
            {items.map((item, index) =>
          <button
            key={index}
            onClick={() => {
              item.onClick();
              setIsOpen(false);
            }}
            className={`
                  flex w-full items-center px-4 py-2 text-sm
                  ${item.variant === 'danger' ? 'text-red-700 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100'}
                `}>

                {item.icon && <span className="mr-3 h-4 w-4">{item.icon}</span>}
                {item.label}
              </button>
          )}
          </div>
        </div>
      }
    </div>);

}