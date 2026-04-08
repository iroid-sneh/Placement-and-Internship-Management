import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Notification } from '../../types/app';

interface NotificationBellProps {
  fetchNotifications: () => Promise<{ notifications: Notification[]; unreadCount: number }>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export function NotificationBell({
  fetchNotifications,
  markRead,
  markAllRead,
  onNavigate,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Store latest function refs to avoid stale closures
  const fetchRef = useRef(fetchNotifications);
  const markReadRef = useRef(markRead);
  const markAllReadRef = useRef(markAllRead);
  fetchRef.current = fetchNotifications;
  markReadRef.current = markRead;
  markAllReadRef.current = markAllRead;

  // Load notifications on mount and every 30 seconds
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchRef.current();
        if (active) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch {
        // API may be unavailable
      }
    };
    void load();
    const interval = setInterval(() => { void load(); }, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // Update dropdown position when opened
  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    };
    updatePosition();
    // Refresh on open
    fetchRef.current()
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => undefined);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleMarkRead = async (id: string) => {
    try {
      await markReadRef.current(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReadRef.current();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleClick = (n: Notification) => {
    void handleMarkRead(n._id);
    if (n.conversationId) {
      onNavigate(`chat/${n.conversationId}`);
    } else if (n.link) {
      onNavigate(n.link);
    }
    setIsOpen(false);
  };

  const icon = (type: string) => {
    if (type === 'message') return '\uD83D\uDCAC';
    if (type === 'system') return '\uD83D\uDCE2';
    if (type === 'job') return '\uD83D\uDCBC';
    if (type === 'new_application') return '\uD83D\uDCCB';
    if (type === 'application_status_updated') return '\u2705';
    if (type === 'interview_scheduled') return '\uD83D\uDCC5';
    if (type === 'interview_reminder') return '\u23F0';
    if (type === 'interview_result_pending') return '\u23F3';
    return '\uD83D\uDD14';
  };

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  };

  return (
    <div className="shared-notification" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="shared-notification__trigger"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="shared-notification__badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: position.top, right: position.right }}
          className="shared-notification__panel"
        >
          <div className="shared-notification__header">
            <h3 className="shared-notification__title">Notifications</h3>
            <div className="shared-notification__header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="shared-notification__mark-all"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="shared-notification__close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="shared-notification__body">
            {notifications.length === 0 ? (
              <div className="shared-notification__empty">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="shared-notification__empty-text">No notifications yet</p>
              </div>
            ) : (
              <div className="shared-notification__list">
                {notifications.map((n) => (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`shared-notification__item ${!n.isRead ? 'shared-notification__item--unread' : ''}`}
                  >
                    <span className="shared-notification__emoji">{icon(n.type)}</span>
                    <div className="shared-notification__content">
                      <div className="shared-notification__content-top">
                        <p className={`shared-notification__item-title ${!n.isRead ? 'shared-notification__item-title--unread' : 'shared-notification__item-title--read'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <span className="shared-notification__dot" />}
                      </div>
                      <p className="shared-notification__message">{n.message}</p>
                      <p className="shared-notification__time">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
