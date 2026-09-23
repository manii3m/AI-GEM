import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Edit,
  PowerOff,
  Search,
  Layers,
  FileText,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { getTenders, updateTender, closeTender } from '../../services/storage';
import { fetchTenders, updateTenderInCloud, subscribeToTenders } from '../../services/supabase';
import { Tender } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Toast, ToastMessage } from '../../components/common/Toast';

export const OfficerTenders: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadData = async () => {
    const list = await fetchTenders();
    setTenders(list);

    // If query has ?edit=ID, open edit modal
    const editId = searchParams.get('edit');
    if (editId) {
      const target = list.find((t) => t.id === editId);
      if (target) setEditingTender({ ...target });
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToTenders(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [searchParams]);

  const handleCloseTender = async (tenderId: string) => {
    if (
      window.confirm(
        `Are you sure you want to officially Close tender ${tenderId}? No further bids will be accepted.`
      )
    ) {
      closeTender(tenderId);
      const target = tenders.find((t) => t.id === tenderId);
      if (target) {
        await updateTenderInCloud({ ...target, status: 'Closed' });
      }
      await loadData();
      setToast({
        id: Date.now().toString(),
        type: 'info',
        title: 'Tender Closed',
        message: `Tender ${tenderId} has been marked as Closed.`,
      });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTender) return;

    updateTender(editingTender);
    await updateTenderInCloud(editingTender);
    await loadData();
    setEditingTender(null);
    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Tender Updated',
      message: `Specifications and criteria for ${editingTender.id} updated successfully in cloud database.`,
    });
  };

  // Filter tenders based on search and status
  const filtered = tenders.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.issuingOrg.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Tenders Management"
        subtitle="Create, configure, publish, and close procurement tender notices under your department oversight."
        breadcrumbs={[
          { label: 'Officer Portal', href: '/officer/dashboard' },
          { label: 'Tenders' },
        ]}
        actions={
          <Link
            to="/officer/tenders/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Tender</span>
          </Link>
        }
      />

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tender ID, title, or department..."
            className="block w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Closing Soon">Closing Soon</option>
            <option value="Under Evaluation">Under Evaluation</option>
            <option value="Closed">Closed</option>
          </select>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {filtered.length} tenders
          </span>
        </div>
      </div>

      {/* Professional Table: Tender ID | Title | Department | Deadline | Status | Applications | Actions */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Tender ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Applications</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No tenders match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((tender) => (
                  <tr key={tender.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Tender ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                      {tender.id}
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-semibold text-slate-900 truncate">{tender.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="truncate">{tender.category}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-700 font-medium">₹ {tender.estimatedValueCr.toFixed(2)} Cr</span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {tender.issuingOrg}
                    </td>

                    {/* Deadline */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {tender.closingDate}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={tender.status} size="sm" />
                    </td>

                    {/* Applications */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {tender.bidsCount} Received
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingTender({ ...tender })}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors shadow-2xs inline-flex items-center gap-1"
                          title="Edit Tender Specifications"
                        >
                          <Edit className="h-3 w-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        {tender.status !== 'Closed' && (
                          <button
                            type="button"
                            onClick={() => handleCloseTender(tender.id)}
                            className="px-2 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded transition-colors"
                            title="Officially Close Tender"
                          >
                            <PowerOff className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Tender Modal: Clean, well-spaced form */}
      {editingTender && (
        <Modal
          isOpen={!!editingTender}
          onClose={() => setEditingTender(null)}
          title={`Edit Tender — ${editingTender.id}`}
          subtitle="Modify statutory parameters, closing deadline, and minimum eligibility criteria"
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTender(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-tender-form"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors"
              >
                Save & Update Database
              </button>
            </div>
          }
        >
          <form id="edit-tender-form" onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tender Title</label>
              <input
                type="text"
                value={editingTender.title}
                onChange={(e) =>
                  setEditingTender({ ...editingTender, title: e.target.value })
                }
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Department / Issuing Org</label>
                <input
                  type="text"
                  value={editingTender.issuingOrg}
                  onChange={(e) =>
                    setEditingTender({ ...editingTender, issuingOrg: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category</label>
                <input
                  type="text"
                  value={editingTender.category}
                  onChange={(e) =>
                    setEditingTender({ ...editingTender, category: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Est. Value (₹ Cr)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTender.estimatedValueCr}
                  onChange={(e) =>
                    setEditingTender({
                      ...editingTender,
                      estimatedValueCr: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Closing Deadline</label>
                <input
                  type="date"
                  value={editingTender.closingDate}
                  onChange={(e) =>
                    setEditingTender({ ...editingTender, closingDate: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Status</label>
                <select
                  value={editingTender.status}
                  onChange={(e) =>
                    setEditingTender({
                      ...editingTender,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="Active">Active</option>
                  <option value="Closing Soon">Closing Soon</option>
                  <option value="Under Evaluation">Under Evaluation</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Eligibility Thresholds Sub-Panel */}
            <div className="border border-slate-200 rounded-md p-3 bg-slate-50/60 space-y-3">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                Mandatory Eligibility Criteria Thresholds
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Min. Turnover (₹ Cr)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingTender.eligibilityCriteria.minTurnoverCr}
                    onChange={(e) =>
                      setEditingTender({
                        ...editingTender,
                        eligibilityCriteria: {
                          ...editingTender.eligibilityCriteria,
                          minTurnoverCr: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1 border border-slate-200 rounded bg-white text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Min. Experience (Years)</label>
                  <input
                    type="number"
                    value={editingTender.eligibilityCriteria.minExperienceYears}
                    onChange={(e) =>
                      setEditingTender({
                        ...editingTender,
                        eligibilityCriteria: {
                          ...editingTender.eligibilityCriteria,
                          minExperienceYears: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1 border border-slate-200 rounded bg-white text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Min. Local Content (%)</label>
                  <input
                    type="number"
                    value={editingTender.eligibilityCriteria.minLocalContentPct}
                    onChange={(e) =>
                      setEditingTender({
                        ...editingTender,
                        eligibilityCriteria: {
                          ...editingTender.eligibilityCriteria,
                          minLocalContentPct: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1 border border-slate-200 rounded bg-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
