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
  const inferredPlaceholder =
    props.placeholder ?? (label && !props.disabled ? `Enter ${label.toLowerCase()}` : undefined);

  return (
    <div className="student-input-group">
      {label &&
      <label className="student-input__label">
          {label}
        </label>
      }
      <div className="student-input__control">
        {icon &&
        <div className="student-input__icon">
            {icon}
          </div>
        }
        <input
          placeholder={inferredPlaceholder}
          className={`student-input ${icon ? 'student-input--with-icon' : ''} ${className}`}
          {...props} />

      </div>
      {error && <p className="student-input__error">{error}</p>}
    </div>);

}
