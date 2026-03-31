import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MoreVertical } from 'lucide-react';
import { createPortal } from 'react-dom';
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
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: align === 'left' ? rect.left : rect.right - 224,
        right: rect.right
      });
    }
  }, [align]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={triggerRef}>
      <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
        {trigger ||
        <button className="flex items-center rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none">
            <span className="sr-only">Open options</span>
            <MoreVertical className="h-5 w-5" />
          </button>
        }
      </div>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: position.top,
            [align === 'right' ? 'right' : 'left']: align === 'right'
              ? window.innerWidth - position.right
              : position.left
          }}
          className={`
            z-[9999] w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none
          `}
        >
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
                `}
              >
                {item.icon && <span className="mr-3 h-4 w-4">{item.icon}</span>}
                {item.label}
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>);
}