import React, { useState } from 'react';
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
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Interview Mode</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode('Online')}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                mode === 'Online'
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Video className="inline h-4 w-4 mr-1.5" />
              Online
            </button>
            <button
              type="button"
              onClick={() => setMode('Offline')}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                mode === 'Offline'
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin className="inline h-4 w-4 mr-1.5" />
              Offline
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
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
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
            placeholder="Any additional notes for the candidate..."
          />
        </div>
      </div>
    </Modal>
  );
}
