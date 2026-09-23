import { NotificationItem } from '../types';

const STORAGE_NOTIF_KEY = 'gem_procure_notifications';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-001',
    targetRole: 'bidder',
    title: 'Bid Successfully Submitted: BID-2026-0911',
    message: 'Your bid for DEMO-GEM-2026-001 (Server Infrastructure Refresh) has been officially recorded in central queue.',
    category: 'Bid Submission',
    type: 'success',
    timestamp: '2026-03-18 11:24 IST',
    isRead: false,
    link: '/bidder/applications',
  },
  {
    id: 'NOTIF-002',
    targetRole: 'bidder',
    title: 'Annual Turnover Reconciled with GSTN',
    message: 'Your declared annual turnover of ₹ 24.50 Cr has been matched with MCA-21 and GSTR-3B filings.',
    category: 'Statutory Verification',
    type: 'info',
    timestamp: '2026-03-18 12:00 IST',
    isRead: false,
    link: '/bidder/profile',
  },
  {
    id: 'NOTIF-003',
    targetRole: 'officer',
    title: 'New Bid Received: DEMO-GEM-2026-001',
    message: 'ABC Technologies Pvt. Ltd. submitted bid packet for Server Infrastructure Refresh (Quote: ₹ 17.85 Cr).',
    category: 'Procurement Queue',
    type: 'info',
    timestamp: '2026-03-18 11:25 IST',
    isRead: false,
    link: '/officer/bids',
  },
  {
    id: 'NOTIF-004',
    targetRole: 'officer',
    title: 'Automated Verification Pending',
    message: 'Verification queue has bids awaiting automated OCR extraction and dataset reconciliation.',
    category: 'Compliance Audit',
    type: 'warning',
    timestamp: '2026-03-18 13:00 IST',
    isRead: false,
    link: '/officer/dashboard',
  },
];

export const getNotifications = (role?: 'bidder' | 'officer' | 'all', userId?: string): NotificationItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_NOTIF_KEY);
    const list: NotificationItem[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;

    if (!raw) {
      localStorage.setItem(STORAGE_NOTIF_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    }

    return list.filter((n) => {
      if (role && role !== 'all' && n.targetRole !== 'all' && n.targetRole !== role) {
        return false;
      }
      if (userId && n.targetUserId && n.targetUserId !== userId) {
        return false;
      }
      return true;
    });
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
};

export const addNotification = (
  item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>
): NotificationItem => {
  const all = getNotifications('all');
  const now = new Date();
  const timestamp =
    now.toISOString().split('T')[0] +
    ' ' +
    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) +
    ' IST';

  const newItem: NotificationItem = {
    ...item,
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp,
    isRead: false,
  };

  all.unshift(newItem);
  try {
    localStorage.setItem(STORAGE_NOTIF_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save notification:', e);
  }

  return newItem;
};

export const markNotificationAsRead = (id: string): void => {
  const all = getNotifications('all');
  const found = all.find((n) => n.id === id);
  if (found) {
    found.isRead = true;
    try {
      localStorage.setItem(STORAGE_NOTIF_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to update notification:', e);
    }
  }
};

export const markAllNotificationsAsRead = (role: 'bidder' | 'officer'): void => {
  const all = getNotifications('all');
  all.forEach((n) => {
    if (n.targetRole === role || n.targetRole === 'all') {
      n.isRead = true;
    }
  });
  try {
    localStorage.setItem(STORAGE_NOTIF_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to update notifications:', e);
  }
};
