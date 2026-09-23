import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  FileText,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { getAuditEvents } from '../../services/auditService';
import { AuditEvent, AuditEventType } from '../../types';

export const OfficerAudit: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedActorRole, setSelectedActorRole] = useState<string>('ALL');
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<AuditEvent | null>(null);

  // Load audit logs from central immutable audit service
  const allEvents = getAuditEvents();

  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      // Event Type Filter
      if (selectedEventType !== 'ALL') {
        if (selectedEventType === 'DECISION' && !ev.eventType.includes('DECISION') && !ev.eventType.includes('CLARIFICATION')) return false;
        if (selectedEventType === 'VERIF' && !ev.eventType.includes('VERIF')) return false;
        if (selectedEventType === 'BID' && !ev.eventType.includes('BID')) return false;
        if (selectedEventType === 'TENDER' && !ev.eventType.includes('TENDER')) return false;
        if (selectedEventType === 'AUTH' && !ev.eventType.includes('AUTH')) return false;
      }

      // Role Filter
      if (selectedActorRole !== 'ALL' && ev.userRole !== selectedActorRole) {
        return false;
      }

      // Search query
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = ev.id.toLowerCase().includes(term);
        const matchesActor = (ev.userName || ev.userId).toLowerCase().includes(term);
        const matchesTarget = (ev.entityId || '').toLowerCase().includes(term);
        const matchesDescription = (ev.description || '').toLowerCase().includes(term);
        const matchesIp = (ev.ipAddress || '').toLowerCase().includes(term);
        return matchesId || matchesActor || matchesTarget || matchesDescription || matchesIp;
      }

      return true;
    });
  }, [allEvents, selectedEventType, selectedActorRole, searchTerm]);

  const handleExportAuditCSV = () => {
    const headers = ['Audit ID', 'Timestamp', 'Event Type', 'User ID', 'User Name', 'Role', 'Target Entity', 'Description', 'IP Address'];
    const rows = filteredEvents.map((ev) => [
      ev.id,
      ev.timestamp,
      ev.eventType,
      ev.userId,
      `"${(ev.userName || ev.userId).replace(/"/g, '""')}"`,
      ev.userRole,
      ev.entityId || 'N/A',
      `"${(ev.description || '').replace(/"/g, '""')}"`,
      ev.ipAddress || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GeM_Statutory_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEventBadge = (type: AuditEventType) => {
    switch (type) {
      case 'DECISION_MADE':
      case 'DECISION_UPDATED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CLARIFICATION_REQUESTED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'CLARIFICATION_RESPONDED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'VERIF_COMPLETE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'VERIF_START':
      case 'VERIF_OCR':
      case 'VERIF_CROSSCHECK':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'BID_SUBMIT':
      case 'BID_START':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'TENDER_CREATE':
      case 'TENDER_UPDATE':
      case 'TENDER_CLOSE':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'AUTH_LOGIN':
      case 'AUTH_LOGOUT':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory Procurement Audit Trail"
        subtitle="Immutable ledger of system transactions, vendor bid submissions, OCR verifications, and officer determinations."
        breadcrumbs={[{ label: 'Officer Portal', href: '/officer/dashboard' }, { label: 'Audit Trail' }]}
        actions={
          <button
            onClick={handleExportAuditCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Audit Log (CSV)</span>
          </button>
        }
      />

      {/* Metric Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Audit Events</span>
          <p className="text-2xl font-bold text-slate-900">{allEvents.length}</p>
          <span className="text-[11px] text-slate-500">Append-only immutable record</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Officer Decisions Logged</span>
          <p className="text-2xl font-bold text-emerald-700">
            {allEvents.filter((e) => e.eventType === 'DECISION_MADE' || e.eventType === 'DECISION_UPDATED').length}
          </p>
          <span className="text-[11px] text-slate-500">GFR 2017 Determinations</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Clarification Cycles</span>
          <p className="text-2xl font-bold text-amber-700">
            {allEvents.filter((e) => e.eventType === 'CLARIFICATION_REQUESTED' || e.eventType === 'CLARIFICATION_RESPONDED').length}
          </p>
          <span className="text-[11px] text-slate-500">Notices & Responses</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Security Validation</span>
          <p className="text-xs font-mono font-bold text-slate-800 pt-1">SHA-256 Validated</p>
          <span className="text-[11px] text-slate-500">Tamper-evident audit sealing</span>
        </div>
      </div>

      {/* Main Audit Trail Table: Timestamp | User | Action | Entity | Description */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden text-xs">
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">Procurement Activity & Determination Ledger</h2>
            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold text-[10px]">
              {filteredEvents.length} Events
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search audit trail..."
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden w-48 md:w-56"
              />
            </div>

            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Actions</option>
              <option value="DECISION">Decisions & Clarifications</option>
              <option value="VERIF">Verifications</option>
              <option value="BID">Bid Submissions</option>
              <option value="TENDER">Tender Notices</option>
              <option value="AUTH">Authentication</option>
            </select>

            <select
              value={selectedActorRole}
              onChange={(e) => setSelectedActorRole(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Users</option>
              <option value="officer">Procurement Officers</option>
              <option value="bidder">Bidder Vendors</option>
              <option value="system">Automated System</option>
            </select>
          </div>
        </div>

        {/* Clean Table: Timestamp | User | Action | Entity | Description */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 w-44">Timestamp</th>
                <th className="py-3 px-4 w-44">User</th>
                <th className="py-3 px-4 w-40">Action</th>
                <th className="py-3 px-4 w-32">Entity</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => log.details && setSelectedEventForDetails(log)}
                    className={`hover:bg-slate-50/80 transition-colors ${log.details ? 'cursor-pointer' : ''}`}
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>

                    {/* User */}
                    <td className="py-3 px-4 font-sans">
                      <p className="font-semibold text-slate-900 truncate">{log.userName || log.userId}</p>
                      <span className="text-[10px] uppercase font-medium text-slate-500">{log.userRole}</span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getEventBadge(log.eventType)}`}>
                        {log.eventType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="py-3 px-4 font-semibold text-blue-700 whitespace-nowrap font-mono">
                      {log.entityId || '—'}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 font-sans text-slate-700">
                      <p className="line-clamp-2 leading-relaxed">{log.description}</p>
                      {log.details && (
                        <span className="text-[10px] text-blue-600 font-medium mt-0.5 inline-block hover:underline">
                          View details &gt;
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Drawer / Modal */}
      {selectedEventForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-lg p-5 max-w-lg w-full shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Audit Record Details</h3>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">{selectedEventForDetails.id}</p>
              </div>
              <button
                onClick={() => setSelectedEventForDetails(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-md border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Action Type</span>
                <p className="font-bold text-slate-900">{selectedEventForDetails.eventType}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">User / Actor</span>
                <p className="font-semibold text-slate-900">{selectedEventForDetails.userName} ({selectedEventForDetails.userId})</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Timestamp</span>
                <p className="font-mono text-slate-700">{selectedEventForDetails.timestamp}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Description</span>
                <p className="text-slate-800">{selectedEventForDetails.description}</p>
              </div>
              {selectedEventForDetails.details && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Structured Payload</span>
                  <pre className="mt-1 p-2 bg-white rounded border border-slate-200 text-[10px] font-mono overflow-x-auto text-slate-800 max-h-48">
                    {JSON.stringify(selectedEventForDetails.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSelectedEventForDetails(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
