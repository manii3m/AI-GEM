import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Bell,
  CheckCheck,
  ExternalLink,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notificationService';
import { NotificationItem } from '../../types';

export const BidderNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const loadNotifications = () => {
    const list = getNotifications('bidder');
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead('bidder');
    loadNotifications();
  };

  const filteredList = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portal Notifications & Statutory Alerts"
        subtitle="Official statutory updates regarding tender timelines, officer clarification notices, and verification determinations."
        breadcrumbs={[
          { label: 'Portal', href: '/bidder/dashboard' },
          { label: 'Notifications' },
        ]}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark All as Read</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
              filter === 'UNREAD'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg shadow-xs space-y-2">
          <Bell className="h-8 w-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Notifications</h3>
          <p className="text-xs text-slate-500">You are all caught up with your procurement alerts and notices.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((alert) => {
            const icon =
              alert.type === 'warning' ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              ) : alert.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : alert.type === 'critical' ? (
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              ) : (
                <Info className="h-5 w-5 text-blue-600 shrink-0" />
              );

            const borderStyle =
              alert.type === 'warning'
                ? 'border-amber-200 bg-amber-50/40'
                : alert.type === 'success'
                ? 'border-emerald-200 bg-emerald-50/40'
                : alert.type === 'critical'
                ? 'border-red-200 bg-red-50/40'
                : 'border-blue-200 bg-blue-50/40';

            return (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 bg-white shadow-xs ${borderStyle} flex items-start gap-3.5 transition-colors ${
                  !alert.isRead ? 'ring-1 ring-blue-500/30' : 'opacity-90'
                }`}
              >
                {icon}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900">{alert.title}</h3>
                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" title="Unread" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {alert.category}
                      </span>
                      <span>
                        {new Date(alert.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">{alert.message}</p>

                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    {alert.linkUrl ? (
                      <Link
                        to={alert.linkUrl}
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 text-[11px]"
                      >
                        <span>View Details / Respond</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span />
                    )}

                    {!alert.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default BidderNotifications;
