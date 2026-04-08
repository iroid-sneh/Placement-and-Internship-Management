import { useEffect, useState, useRef, useCallback } from 'react';
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
    <div className="shared-dropdown" ref={triggerRef}>
      <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
        {trigger ||
        <button className="shared-dropdown__trigger-default" type="button">
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
          className="shared-dropdown__panel"
        >
          <div className="shared-dropdown__list">
            {items.map((item, index) =>
              <button
                key={index}
                type="button"
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`shared-dropdown__item ${
                  item.variant === 'danger' ? 'shared-dropdown__item--danger' : ''
                }`}
              >
                {item.icon && <span className="shared-dropdown__icon">{item.icon}</span>}
                {item.label}
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>);
}
