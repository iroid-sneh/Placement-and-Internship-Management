import React from 'react';
import { X } from 'lucide-react';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  preventCloseOnBackdrop?: boolean;
}
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  preventCloseOnBackdrop = false
}: ModalProps) {
  if (!isOpen) return null;
  const sizes = {
    sm: 'student-modal__panel--sm',
    md: 'student-modal__panel--md',
    lg: 'student-modal__panel--lg',
    xl: 'student-modal__panel--xl'
  };
  const handleBackdropClick = () => {
    if (!preventCloseOnBackdrop) {
      onClose();
    }
  };
  return (
    <div className="student-modal">
      <div className="student-modal__backdrop"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div className={`student-modal__panel ${sizes[size]}`}>
        {/* Backdrop */}
          <div className="student-modal__body">
            <div className="student-modal__header">
              <h3 className="student-modal__title">
                {title}
              </h3>
              {preventCloseOnBackdrop ? (
                <button
                  onClick={onClose}
                  className="student-modal__close"
                  title="Close"
                >
                  <X />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="student-modal__close"
                >
                  <X />
                </button>
              )}
            </div>
            <div>{children}</div>
          </div>
          {footer && (
            <div className="student-modal__footer">
              {footer}
            </div>
          )}
      </div>
    </div>
  );
}
