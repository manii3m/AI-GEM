import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Save, ArrowLeft, ShieldCheck, FileCheck, CheckSquare, Square } from 'lucide-react';
import { createTender } from '../../services/storage';
import { publishTender } from '../../services/supabase';
import { PageHeader } from '../../components/common/PageHeader';
import { Toast, ToastMessage } from '../../components/common/Toast';

export const CreateTender: React.FC = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('IT Infrastructure Services');
  const [issuingOrg, setIssuingOrg] = useState('Directorate of Public Procurement Automation');
  const [ministryDepartment, setMinistryDepartment] = useState('Ministry of Commerce and Industry');
  const [location, setLocation] = useState('New Delhi (Central Repository)');
  const [description, setDescription] = useState('');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [estimatedValueCr, setEstimatedValueCr] = useState<string>('10.00');
  const [publishedDate, setPublishedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [closingDate, setClosingDate] = useState('2026-05-30');

  // Eligibility Criteria
  const [minExperienceYears, setMinExperienceYears] = useState(5);
  const [minTurnoverCr, setMinTurnoverCr] = useState(10.0);
  const [minLocalContentPct, setMinLocalContentPct] = useState(50);
  const [gstRequired, setGstRequired] = useState(true);
  const [panRequired, setPanRequired] = useState(true);
  const [udyamRequired, setUdyamRequired] = useState(true);
  const [startupIndiaRequired, setStartupIndiaRequired] = useState(false);
  const [nsicRequired, setNsicRequired] = useState(false);
  const [oemAuthRequired, setOemAuthRequired] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([
    'PAN Certificate',
    'GST Certificate',
    'Audited Turnover Certificate',
    'Experience Certificate',
    'Make in India / Local Content Declaration',
  ]);

  const allAvailableDocs = [
    'PAN Certificate',
    'GST Certificate',
    'Audited Turnover Certificate',
    'Experience Certificate',
    'Make in India / Local Content Declaration',
    'Udyam MSME Certificate',
    'Startup India DPIIT Recognition',
    'NSIC Registration Certificate',
    'OEM Authorization Letter',
    'Debarment / Non-Blacklisting Affidavit',
  ];

  const toggleDoc = (doc: string) => {
    if (selectedDocs.includes(doc)) {
      setSelectedDocs(selectedDocs.filter((d) => d !== doc));
    } else {
      setSelectedDocs([...selectedDocs, doc]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !issuingOrg.trim()) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Missing Required Fields',
        message: 'Please complete the tender title, issuing organization, and description.',
      });
      return;
    }

    const valueNum = parseFloat(estimatedValueCr);
    if (isNaN(valueNum) || valueNum <= 0) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Invalid Estimated Value',
        message: 'Please enter a valid numeric value in ₹ Crores.',
      });
      return;
    }

    setIsSubmitting(true);

    const created = createTender({
      title,
      category,
      issuingOrg,
      ministryDepartment,
      location,
      description,
      scopeOfWork: scopeOfWork.trim() || description.trim(),
      estimatedValueCr: valueNum,
      publishedDate,
      closingDate,
      status: 'Active',
      createdBy: 'officer-001',
      eligibilityCriteria: {
        minExperienceYears,
        minTurnoverCr,
        minLocalContentPct,
        gstRequired,
        panRequired,
        udyamRequired,
        startupIndiaRequired,
        nsicRequired,
        oemAuthRequired,
      },
      requiredDocuments: selectedDocs,
    });

    publishTender(created)
      .then((res) => {
        setIsSubmitting(false);
        setToast({
          id: Date.now().toString(),
          type: 'success',
          title: 'Tender Successfully Published',
          message: `Tender ${created.id} has been published and synchronized to live cloud database.`,
        });

        setTimeout(() => {
          navigate('/officer/tenders');
        }, 700);
      })
      .catch((err) => {
        setIsSubmitting(false);
        console.error('Error publishing tender to Supabase:', err);
        navigate('/officer/tenders');
      });
  };

  return (
    <div className="space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Publish New Procurement Tender"
        subtitle="Configure basic specifications, work scope, and statutory compliance eligibility thresholds for automated verification."
        breadcrumbs={[
          { label: 'Officer Portal', href: '/officer/dashboard' },
          { label: 'Tenders', href: '/officer/tenders' },
          { label: 'Create Tender' },
        ]}
        actions={
          <Link
            to="/officer/tenders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Tenders</span>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Basic Tender Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Layers className="h-4 w-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">1. Basic Tender Specifications</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">
                Tender Title / Procurement Work <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Procurement of High-Capacity Air Compressors & Nitrogen Generators"
                className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Procurement Category <span className="text-rose-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden text-xs"
              >
                <option value="IT Infrastructure Services">IT Infrastructure Services</option>
                <option value="Industrial Equipment Procurement">Industrial Equipment Procurement</option>
                <option value="Electrical Equipment Supply">Electrical Equipment Supply</option>
                <option value="Industrial Maintenance Services">Industrial Maintenance Services</option>
                <option value="Safety Equipment Procurement">Safety Equipment Procurement</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Issuing Department / Authority <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={issuingOrg}
                onChange={(e) => setIssuingOrg(e.target.value)}
                placeholder="e.g. Directorate General of Supplies and Disposals"
                className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ministry Oversight
              </label>
              <input
                type="text"
                value={ministryDepartment}
                onChange={(e) => setMinistryDepartment(e.target.value)}
                placeholder="e.g. Ministry of Commerce and Industry"
                className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Estimated Contract Value (₹ Crores) <span className="text-rose-600">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={estimatedValueCr}
                  onChange={(e) => setEstimatedValueCr(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden text-xs font-mono"
                  required
                />
                <span className="text-slate-500 font-medium">Cr</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Published Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Closing Submission Deadline <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden text-xs font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Scope & Description */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <FileCheck className="h-4 w-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">2. Scope of Work & Description</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                General Tender Description <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive overview of procurement item, technical purpose, and contractual expectations..."
                className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden text-xs leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Detailed Scope of Work & Delivery Milestones
              </label>
              <textarea
                rows={3}
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                placeholder="Include site locations, testing procedures, commissioning timelines, and warranty obligations..."
                className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Statutory Eligibility Parameters */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <ShieldCheck className="h-4 w-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">3. Statutory Eligibility Parameters</h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Quantitative Thresholds */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Min. Annual Turnover (₹ Crores)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={minTurnoverCr}
                  onChange={(e) => setMinTurnoverCr(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Cross-verified against Audited / GST returns</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Min. Past Experience (Years)
                </label>
                <input
                  type="number"
                  value={minExperienceYears}
                  onChange={(e) => setMinExperienceYears(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Prior government or enterprise supply history</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Min. Local Content / Make in India (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minLocalContentPct}
                  onChange={(e) => setMinLocalContentPct(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Public Procurement Preference (PPO-2017)</span>
              </div>
            </div>

            {/* Statutory Registrations Toggles */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-800 mb-2">
                Mandatory Statutory Registrations Required for Eligibility
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 p-2.5 rounded-md border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={panRequired}
                    onChange={(e) => setPanRequired(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="font-medium text-slate-800">Valid Income Tax PAN</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-md border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={gstRequired}
                    onChange={(e) => setGstRequired(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="font-medium text-slate-800">Active GST Registration</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-md border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={udyamRequired}
                    onChange={(e) => setUdyamRequired(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="font-medium text-slate-800">Udyam MSME Registration</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-md border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={startupIndiaRequired}
                    onChange={(e) => setStartupIndiaRequired(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="font-medium text-slate-800">DPIIT Startup India</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-md border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={nsicRequired}
                    onChange={(e) => setNsicRequired(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="font-medium text-slate-800">NSIC Registration</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-md border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={oemAuthRequired}
                    onChange={(e) => setOemAuthRequired(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="font-medium text-slate-800">OEM Authorization (MAF)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Required Compliance Documents */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <FileCheck className="h-4 w-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">4. Required Compliance Document Attachments</h2>
          </div>

          <div className="text-xs space-y-2">
            <p className="text-slate-500">
              Select mandatory documentary proofs that bidders must upload in their technical packet:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {allAvailableDocs.map((doc) => {
                const isSelected = selectedDocs.includes(doc);
                return (
                  <button
                    type="button"
                    key={doc}
                    onClick={() => toggleDoc(doc)}
                    className={`flex items-center gap-2 p-2.5 rounded-md text-left transition-colors border ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 border-blue-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-blue-700 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{doc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <Link
            to="/officer/tenders"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel & Return
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Publishing Tender...' : 'Publish & Sync to Live Database'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
