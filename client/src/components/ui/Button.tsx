import React from 'react';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  icon,
  className = '',
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'student-button--primary',
    secondary: 'student-button--secondary',
    outline: 'student-button--outline',
    ghost: 'student-button--ghost',
    danger: 'student-button--danger'
  };
  const sizes = {
    sm: 'student-button--sm',
    md: 'student-button--md',
    lg: 'student-button--lg'
  };
  return (
    <button
      className={`student-button ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}>

      {isLoading ?
      <svg
        className="student-button__spinner"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24">

          <circle
          className="student-button__spinner-track"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4">
        </circle>
          <path
          className="student-button__spinner-fill"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
        </svg> :
      icon ?
      <span className="student-button__icon">{icon}</span> :
      null}
      {children}
    </button>);

}
