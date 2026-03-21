import React, { Fragment } from 'react';
import { X } from 'lucide-react';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}: ModalProps) {
  if (!isOpen) return null;
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };
  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true" />


        {/* Modal Panel */}
        <span
          className="hidden sm:inline-block sm:h-screen sm:align-middle"
          aria-hidden="true">

          &#8203;
        </span>
        <div
          className={`
          relative z-10 inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all
          sm:my-8 sm:w-full sm:align-middle ${sizes[size]}
        `}>

          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-slate-900">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none">

                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2">{children}</div>
          </div>
          {footer &&
          <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              {footer}
            </div>
          }
        </div>
      </div>
    </div>);

}