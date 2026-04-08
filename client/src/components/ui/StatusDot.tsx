export type StatusType =
'success' |
'warning' |
'info' |
'error' |
'pending' |
'neutral';
interface StatusDotProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
}
export function StatusDot({ status, label, size = 'md' }: StatusDotProps) {
  return (
    <div className="shared-status">
      <span
        className={`shared-status__dot shared-status__dot--${status} shared-status__dot--${size}`} />

      {label && <span className="shared-status__label">{label}</span>}
    </div>);

}
