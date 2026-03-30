import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { StatusDot } from '../../components/ui/StatusDot';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { useAuth } from '../../context/AuthContext';
import { getAdminApplications, updateAdminApplicationStatus } from '../../services/api/admin';
import type { Application } from '../../types/app';
import {
  MoreHorizontal,
  Trash,
  Calendar,
  Clock } from
'lucide-react';
interface InterviewManagementProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}
export function InterviewManagement({
  onNavigate,
  onLogout
}: InterviewManagementProps) {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const loadApplications = async (): Promise<void> => {
    try {
      const response = await getAdminApplications();
      setApplications(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load interviews');
    }
  };
  useEffect(() => {
    void loadApplications();
  }, []);
  const interviews = useMemo(
    () =>
      applications
        .filter(
          (application) =>
            application.status === 'Interview Scheduled' && application.interviewDate
        )
        .map((application) => {
          const student = typeof application.studentId === 'string' ? null : application.studentId;
          const job = typeof application.jobId === 'string' ? null : application.jobId;
          const company = job && typeof job.companyId !== 'string' ? job.companyId.name : '-';
          const dateObject = application.interviewDate ? new Date(application.interviewDate) : null;
          return {
            id: application._id,
            student: student?.name || '-',
            company,
            role: job?.title || '-',
            date: dateObject ? dateObject.toLocaleDateString() : '-',
            time: dateObject ? dateObject.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
            type: 'Interview',
            status: application.status === 'Selected' ? 'success' : application.status === 'Rejected' ? 'error' : 'pending'
          };
        }),
    [applications]
  );

  const columns = [
  {
    key: 'student',
    header: 'Student',
    sortable: true
  },
  {
    key: 'company',
    header: 'Company',
    sortable: true
  },
  {
    key: 'role',
    header: 'Role'
  },
  {
    key: 'date',
    header: 'Date',
    sortable: true
  },
  {
    key: 'time',
    header: 'Time'
  },
  {
    key: 'type',
    header: 'Round'
  },
  {
    key: 'status',
    header: 'Status',
    render: (item: any) =>
    <StatusDot
      status={item.status}
      label={
      item.status === 'success' ?
      'Completed' :
      item.status === 'error' ?
      'Cancelled' :
      'Scheduled'
      } />


  }];

  // Calendar view data
  const [weekOffset, setWeekOffset] = useState(0);
  const getWeekDates = (offset: number) => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };
  const weekDates = getWeekDates(weekOffset);
  const calendarDays = weekDates.map((d) => d.toLocaleDateString('en-US', { weekday: 'short' }));
  const calendarDateLabels = weekDates.map((d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const timeSlots = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM'];
  const getInterviewsForSlot = (dayIndex: number, timeSlot: string) => {
    return interviews.filter((interview) => {
      if (interview.date === '-') return false;
      const interviewDateObj = new Date(
        applications.find((a) => a._id === interview.id)?.interviewDate || ''
      );
      if (isNaN(interviewDateObj.getTime())) return false;
      const slotDate = weekDates[dayIndex];
      if (
        interviewDateObj.getFullYear() !== slotDate.getFullYear() ||
        interviewDateObj.getMonth() !== slotDate.getMonth() ||
        interviewDateObj.getDate() !== slotDate.getDate()
      ) return false;
      const hour = interviewDateObj.getHours();
      const parsedSlotHour = timeSlot === '12:00 PM' ? 12 : parseInt(timeSlot.split(':')[0]) + (timeSlot.includes('PM') ? 12 : 0);
      return hour === parsedSlotHour;
    });
  };
  const scheduleInterview = async (): Promise<void> => {
    if (!selectedApplicationId || !interviewDate) {
      setModalErrorMessage('Select application and interview date');
      return;
    }
    try {
      const combinedDate = interviewTime
        ? new Date(`${interviewDate}T${interviewTime}`).toISOString()
        : new Date(interviewDate).toISOString();
      await updateAdminApplicationStatus(
        selectedApplicationId,
        'Interview Scheduled',
        combinedDate
      );
      setModalErrorMessage('');
      setIsAddModalOpen(false);
      setSelectedApplicationId('');
      setInterviewDate('');
      setInterviewTime('');
      await loadApplications();
    } catch (error) {
      setModalErrorMessage(error instanceof Error ? error.message : 'Failed to schedule interview');
    }
  };

  return (
    <DashboardLayout
      userRole="admin"
      currentPath="interviews"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Admin',
        email: user?.email || ''
      }}
      breadcrumbs={[
      {
        label: 'Interview Management'
      }]
      }>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Interviews</h1>
            <p className="text-slate-600">
              Schedule and manage placement interviews.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-slate-200 p-1 bg-white">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>

                Table
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>

                Calendar
              </button>
            </div>
            <Button
              icon={<Calendar className="h-4 w-4" />}
              onClick={() => {
                setModalErrorMessage('');
                setIsAddModalOpen(true);
              }}>

              Schedule Interview
            </Button>
          </div>
        </div>
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {viewMode === 'table' ?
        <DataTable
          data={interviews}
          columns={columns}
          keyField="id"
          actions={(item) =>
          <DropdownMenu
            items={[
            {
              label: 'Cancel',
              icon: <Trash className="h-4 w-4" />,
              variant: 'danger',
              onClick: async () => {
                await updateAdminApplicationStatus(item.id, 'Rejected');
                await loadApplications();
              }
            }]
            }
            trigger={
            <button className="p-1 text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
            } />

          } />
        /* Calendar View */ :

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDates[4].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setWeekOffset((prev) => prev - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWeekOffset((prev) => prev + 1)}>
                  Next
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-6 min-w-[800px]">
                {/* Header */}
                <div className="bg-slate-50 p-3 border-b border-r border-slate-200"></div>
                {calendarDays.map((day, i) =>
              <div
                key={`${day}-${i}`}
                className="bg-slate-50 p-3 border-b border-r border-slate-200 text-center">

                    <p className="font-medium text-slate-900">{day}</p>
                    <p className="text-sm text-slate-500">{calendarDateLabels[i]}</p>
                  </div>
              )}

                {/* Time slots */}
                {timeSlots.map((time) =>
              <Fragment key={time}>
                    <div className="p-3 border-b border-r border-slate-200 text-sm text-slate-500 bg-slate-50">
                      {time}
                    </div>
                    {calendarDays.map((day, dayIndex) => {
                  const slotInterviews = getInterviewsForSlot(dayIndex, time);
                  return (
                    <div
                      key={`${time}-${day}-${dayIndex}`}
                      className="p-2 border-b border-r border-slate-200 min-h-[60px]">
                      {slotInterviews.map((interview) => (
                        <div key={interview.id} className="bg-teal-100 text-teal-800 p-2 rounded text-xs mb-1">
                          <p className="font-medium">{interview.student}</p>
                          <p>{interview.company} - {interview.role}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
                  </Fragment>
              )}
              </div>
            </div>
          </div>
        }

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setModalErrorMessage('');
          }}
          title="Schedule Interview"
          footer={
          <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setModalErrorMessage('');
                }}>
                Cancel
              </Button>
              <Button onClick={scheduleInterview}>Schedule</Button>
            </>
          }>

          <div className="space-y-4">
            {modalErrorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalErrorMessage}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Application
              </label>
              <select
                value={selectedApplicationId}
                onChange={(event) => setSelectedApplicationId(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none">
                <option value="">Select Application</option>
                {applications.map((application) => {
                  const student = typeof application.studentId === 'string' ? '-' : application.studentId.name;
                  const job = typeof application.jobId === 'string' ? '-' : application.jobId.title;
                  return (
                    <option key={application._id} value={application._id}>
                      {student} - {job}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                value={interviewDate}
                onChange={(event) => setInterviewDate(event.target.value)}
                icon={<Calendar className="h-4 w-4" />} />

              <Input
                label="Time"
                type="time"
                value={interviewTime}
                onChange={(event) => setInterviewTime(event.target.value)}
                icon={<Clock className="h-4 w-4" />} />

            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>);

}