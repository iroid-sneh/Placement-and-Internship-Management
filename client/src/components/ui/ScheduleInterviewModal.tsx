import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Video, MapPin } from 'lucide-react';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (data: ScheduleInterviewData) => Promise<void>;
  applicantName?: string;
}

export interface ScheduleInterviewData {
  date: string;
  time: string;
  mode: 'Online' | 'Offline';
  link: string;
  notes: string;
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  onSchedule,
  applicantName
}: ScheduleInterviewModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState<'Online' | 'Offline'>('Online');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setDate('');
    setTime('');
    setMode('Online');
    setLink('');
    setNotes('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!date) {
      setError('Interview date is required');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await onSchedule({ date, time, mode, link, notes });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={applicantName ? `Schedule Interview — ${applicantName}` : 'Schedule Interview'}
      preventCloseOnBackdrop
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Schedule
          </Button>
        </>
      }
    >
      <div className="shared-schedule">
        {error && (
          <div className="shared-schedule__error-wrap">
            <div className="shared-schedule__error">
            {error}
            </div>
          </div>
        )}
        <div className="shared-schedule__grid">
          <div className="shared-schedule__field">
            <label className="shared-schedule__label">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="shared-input-reset"
            />
          </div>
          <div className="shared-schedule__field">
            <label className="shared-schedule__label">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="shared-input-reset"
            />
          </div>
        </div>
        <div className="shared-schedule__field">
          <label className="shared-schedule__label">Interview Mode</label>
          <div className="shared-schedule__mode-row">
            <button
              type="button"
              onClick={() => setMode('Online')}
              className={`shared-schedule__mode-button ${
                mode === 'Online'
                  ? 'shared-schedule__mode-button--active'
                  : ''
              }`}
            >
              <Video className="shared-schedule__mode-icon h-4 w-4" />
              Online
            </button>
            <button
              type="button"
              onClick={() => setMode('Offline')}
              className={`shared-schedule__mode-button ${
                mode === 'Offline'
                  ? 'shared-schedule__mode-button--active'
                  : ''
              }`}
            >
              <MapPin className="shared-schedule__mode-icon h-4 w-4" />
              Offline
            </button>
          </div>
        </div>
        <div className="shared-schedule__field">
          <label className="shared-schedule__label">
            {mode === 'Online' ? 'Meeting Link' : 'Location'}
          </label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder={
              mode === 'Online'
                ? 'https://meet.google.com/...'
                : 'Office address or venue'
            }
            className="shared-input-reset"
          />
        </div>
        <div className="shared-schedule__field">
          <label className="shared-schedule__label">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="shared-textarea-reset"
            placeholder="Any additional notes for the candidate..."
          />
        </div>
      </div>
    </Modal>
  );
}
