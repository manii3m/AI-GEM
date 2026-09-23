import { AuditEvent, AuditEventType } from '../types';
import { getCurrentUser } from './storage';

const STORAGE_AUDIT_KEY = 'gem_procure_audit_events';

const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'AUD-2026-0901',
    timestamp: '2026-03-18 10:15:20 IST',
    eventType: 'AUTH_LOGIN',
    userId: 'usr-officer-001',
    userName: 'Dr. Vikram Malhotra',
    userRole: 'officer',
    entityId: 'AUTH-SESSION',
    description: 'Procurement Officer authenticated via secure two-factor portal gateway.',
    ipAddress: '10.42.18.91 (NIC Secure Gateway)',
  },
  {
    id: 'AUD-2026-0902',
    timestamp: '2026-03-18 10:20:45 IST',
    eventType: 'TENDER_CREATE',
    userId: 'usr-officer-001',
    userName: 'Dr. Vikram Malhotra',
    userRole: 'officer',
    entityId: 'DEMO-GEM-2026-001',
    description: 'Published procurement notice "Enterprise Server & Cloud Infrastructure Refresh".',
    ipAddress: '10.42.18.91 (NIC Secure Gateway)',
    details: { estimatedValueCr: 18.5, localContentMinPct: 50 },
  },
  {
    id: 'AUD-2026-0903',
    timestamp: '2026-03-18 11:05:10 IST',
    eventType: 'AUTH_LOGIN',
    userId: 'usr-bidder-001',
    userName: 'ABC Technologies Pvt. Ltd.',
    userRole: 'bidder',
    entityId: 'AUTH-SESSION',
    description: 'Vendor authenticated via GeM Vendor Identity Service.',
    ipAddress: '49.36.112.5 (Vendor Public Gateway)',
  },
  {
    id: 'AUD-2026-0904',
    timestamp: '2026-03-18 11:24:00 IST',
    eventType: 'BID_SUBMIT',
    userId: 'usr-bidder-001',
    userName: 'ABC Technologies Pvt. Ltd.',
    userRole: 'bidder',
    entityId: 'BID-2026-0911',
    description: 'Submitted electronic bid package for DEMO-GEM-2026-001 with financial quote ₹ 17.85 Cr.',
    ipAddress: '49.36.112.5 (Vendor Public Gateway)',
    details: { quotedAmountCr: 17.85, tenderId: 'DEMO-GEM-2026-001' },
  },
  {
    id: 'AUD-2026-0905',
    timestamp: '2026-03-18 14:10:00 IST',
    eventType: 'VERIF_START',
    userId: 'SYSTEM',
    userName: 'Automated Compliance Engine',
    userRole: 'system',
    entityId: 'BID-2026-0911',
    description: 'Initiated 3-way cross-verification pipeline for BID-2026-0911 against CBDT, GSTN, and MSME registries.',
    ipAddress: '127.0.0.1 (GeM Core Engine)',
  },
];

/**
 * Initializes and retrieves all audit events.
 */
export const getAuditEvents = (): AuditEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(INITIAL_AUDIT_EVENTS));
      return INITIAL_AUDIT_EVENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_EVENTS;
  }
};

/**
 * Appends a new immutable audit record to the centralized audit ledger.
 */
export const logAuditEvent = (
  eventType: AuditEventType,
  entityId: string,
  description: string,
  details?: Record<string, any>
): AuditEvent => {
  const events = getAuditEvents();
  const currentUser = getCurrentUser();

  const now = new Date();
  const timestamp =
    now.toISOString().split('T')[0] +
    ' ' +
    now.toLocaleTimeString('en-IN', { hour12: false }) +
    ' IST';

  const nextSeq = String(events.length + 900 + 1).padStart(4, '0');
  const eventId = `AUD-2026-${nextSeq}`;

  const newEvent: AuditEvent = {
    id: eventId,
    timestamp,
    eventType,
    userId: currentUser?.id || 'SYSTEM',
    userName: currentUser?.name || 'Automated Compliance Engine',
    userRole: currentUser?.role || 'system',
    entityId,
    description,
    ipAddress: currentUser?.role === 'officer' ? '10.42.18.91 (NIC Secure Gateway)' : '49.36.112.5 (External Session)',
    details,
  };

  events.unshift(newEvent);
  try {
    localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to persist audit event:', e);
  }

  return newEvent;
};

/**
 * Filters audit events based on search keyword and criteria.
 */
export const filterAuditEvents = (
  events: AuditEvent[],
  criteria: {
    query?: string;
    role?: string;
    eventType?: string;
  }
): AuditEvent[] => {
  return events.filter((ev) => {
    if (criteria.role && criteria.role !== 'all' && ev.userRole !== criteria.role) {
      return false;
    }

    if (criteria.eventType && criteria.eventType !== 'all' && ev.eventType !== criteria.eventType) {
      return false;
    }

    if (criteria.query && criteria.query.trim() !== '') {
      const q = criteria.query.toLowerCase().trim();
      const match =
        ev.id.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.entityId.toLowerCase().includes(q) ||
        (ev.userName && ev.userName.toLowerCase().includes(q)) ||
        ev.userId.toLowerCase().includes(q) ||
        ev.eventType.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
};
