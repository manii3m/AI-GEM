import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  FileCheck,
  Briefcase,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { getCurrentUser, getBidderProfile, updateBidderProfile } from '../../services/storage';
import { BidderProfile } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Toast, ToastMessage } from '../../components/common/Toast';

interface BidderProfilePageProps {
  isEditMode?: boolean;
}

export const BidderProfilePage: React.FC<BidderProfilePageProps> = ({ isEditMode = false }) => {
  const user = getCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<BidderProfile | null>(null);
  const [formData, setFormData] = useState<BidderProfile | null>(null);
  const [isEditing, setIsEditing] = useState(isEditMode || location.pathname.endsWith('/edit'));
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditMode || location.pathname.endsWith('/edit')) {
      setIsEditing(true);
    }
  }, [location.pathname, isEditMode]);

  useEffect(() => {
    const current = getBidderProfile(user?.bidderId);
    if (current) {
      setProfile(current);
      setFormData(current);
    }
  }, [user?.bidderId, user?.id]);

  if (!formData) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading bidder profile...
      </div>
    );
  }

  const handleInputChange = (
    field: keyof BidderProfile,
    value: string | number | boolean
  ) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required';
    }
    if (!formData.pan.trim() || formData.pan.trim().length !== 10) {
      errors.pan = 'Valid 10-character PAN is required (e.g. AABCA9812M)';
    }
    if (!formData.gstin.trim() || formData.gstin.trim().length !== 15) {
      errors.gstin = 'Valid 15-character GSTIN is required (e.g. 07AABCA9812M1Z3)';
    }
    if (formData.yearsOfExperience < 0) {
      errors.yearsOfExperience = 'Years of experience cannot be negative';
    }
    if (formData.annualTurnoverCr < 0) {
      errors.annualTurnoverCr = 'Turnover cannot be negative';
    }
    if (
      formData.localContentPercentage < 0 ||
      formData.localContentPercentage > 100
    ) {
      errors.localContentPercentage = 'Local content must be between 0 and 100%';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Validation Errors',
        message: 'Please resolve marked errors before saving the profile.',
      });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const success = updateBidderProfile(formData);
      setIsSaving(false);
      if (success) {
        setProfile(formData);
        setIsEditing(false);
        if (location.pathname.endsWith('/edit')) {
          navigate('/bidder/profile');
        }
        setToast({
          id: Date.now().toString(),
          type: 'success',
          title: 'Profile Updated Successfully',
          message:
            'Tender eligibility matching engine has updated with your latest profile criteria.',
        });
      } else {
        setToast({
          id: Date.now().toString(),
          type: 'error',
          title: 'Update Failed',
          message: 'Could not write to local storage. Please try again.',
        });
      }
    }, 200);
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
    setValidationErrors({});
    if (location.pathname.endsWith('/edit')) {
      navigate('/bidder/profile');
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Bidder Organization Profile"
        subtitle="Manage statutory entity registrations, financial metrics, and compliance parameters used for automated tender eligibility determination."
        breadcrumbs={[
          { label: 'Portal', href: '/bidder/dashboard' },
          { label: 'Profile' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  navigate('/bidder/profile/edit');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Profile Notice Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-950">
            Eligibility Impact Notice (Problem Statement 26100 Compliance Engine)
          </p>
          <p className="mt-0.5 text-blue-800">
            Values updated in this profile (Annual Turnover, Years of Experience, Local Content %, and OEM Status) are immediately used to calculate real-time eligibility across all tenders.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Company Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
            <Building2 className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">1. Company Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              ) : (
                <p className="font-medium text-slate-900 py-1">{formData.companyName}</p>
              )}
              {validationErrors.companyName && (
                <p className="text-rose-600 text-[11px] mt-0.5">{validationErrors.companyName}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Type</label>
              {isEditing ? (
                <select
                  value={formData.companyType}
                  onChange={(e) => handleInputChange('companyType', e.target.value as any)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-white"
                >
                  <option value="Private Limited">Private Limited</option>
                  <option value="Public Limited">Public Limited</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Proprietorship">Proprietorship</option>
                </select>
              ) : (
                <p className="font-medium text-slate-900 py-1">{formData.companyType}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              ) : (
                <p className="font-medium text-slate-900 py-1">{formData.state}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              ) : (
                <p className="font-medium text-slate-900 py-1">{formData.city}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              ) : (
                <p className="font-medium text-slate-900 py-1">{formData.pincode}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              ) : (
                <p className="font-medium text-slate-900 py-1">{formData.contactEmail}</p>
              )}
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Registered Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              ) : (
                <p className="font-medium text-slate-900 py-1">{formData.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Registration Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
            <FileCheck className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">2. Registration Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Permanent Account Number (PAN)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.pan}
                  maxLength={10}
                  onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono focus:ring-1 focus:ring-blue-600 focus:outline-hidden uppercase"
                />
              ) : (
                <p className="font-mono font-bold text-slate-900 py-1">{formData.pan}</p>
              )}
              {validationErrors.pan && (
                <p className="text-rose-600 text-[11px] mt-0.5">{validationErrors.pan}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                GSTIN (Goods and Services Tax Number)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.gstin}
                  maxLength={15}
                  onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono focus:ring-1 focus:ring-blue-600 focus:outline-hidden uppercase"
                />
              ) : (
                <p className="font-mono font-bold text-slate-900 py-1">{formData.gstin}</p>
              )}
              {validationErrors.gstin && (
                <p className="text-rose-600 text-[11px] mt-0.5">{validationErrors.gstin}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Udyam / MSME Registration Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.udyamNumber}
                  onChange={(e) => handleInputChange('udyamNumber', e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              ) : (
                <p className="font-mono font-medium text-slate-900 py-1">{formData.udyamNumber || 'N/A'}</p>
              )}
            </div>

            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={formData.isStartupIndia}
                  onChange={(e) => handleInputChange('isStartupIndia', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800 select-none">
                  Startup India Recognized (DPIIT)
                </span>
              </label>
            </div>

            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={formData.isNsicRegistered}
                  onChange={(e) => handleInputChange('isNsicRegistered', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800 select-none">
                  NSIC Single Point Registered
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Business Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
            <Briefcase className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">3. Business Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Years of Business Experience
              </label>
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={formData.yearsOfExperience}
                    onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                  />
                  <span className="text-slate-500 font-medium">years</span>
                </div>
              ) : (
                <p className="font-bold text-slate-900 py-1">{formData.yearsOfExperience} Years</p>
              )}
              {validationErrors.yearsOfExperience && (
                <p className="text-rose-600 text-[11px] mt-0.5">
                  {validationErrors.yearsOfExperience}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Annual Turnover (₹ Crores)
              </label>
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">₹</span>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={formData.annualTurnoverCr}
                    onChange={(e) =>
                      handleInputChange('annualTurnoverCr', parseFloat(e.target.value) || 0)
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                  />
                  <span className="text-slate-500 font-medium">Cr</span>
                </div>
              ) : (
                <p className="font-bold text-slate-900 py-1">
                  ₹ {formData.annualTurnoverCr.toFixed(2)} Cr
                </p>
              )}
              {validationErrors.annualTurnoverCr && (
                <p className="text-rose-600 text-[11px] mt-0.5">
                  {validationErrors.annualTurnoverCr}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Total Employee Strength
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min={1}
                  value={formData.employeeCount}
                  onChange={(e) => handleInputChange('employeeCount', parseInt(e.target.value) || 1)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              ) : (
                <p className="font-bold text-slate-900 py-1">{formData.employeeCount} personnel</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Completed Govt Projects
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min={0}
                  value={formData.pastGovtProjectsCount}
                  onChange={(e) =>
                    handleInputChange('pastGovtProjectsCount', parseInt(e.target.value) || 0)
                  }
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              ) : (
                <p className="font-bold text-slate-900 py-1">
                  {formData.pastGovtProjectsCount} contracts
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Compliance Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
            <ShieldCheck className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">4. Compliance Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">EPFO Status</label>
              {isEditing ? (
                <select
                  value={formData.epfoStatus}
                  onChange={(e) => handleInputChange('epfoStatus', e.target.value as any)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-white"
                >
                  <option value="Compliant">Compliant</option>
                  <option value="Pending">Pending</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                  <option value="Exempt">Exempt</option>
                </select>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {formData.epfoStatus}
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ESIC Status</label>
              {isEditing ? (
                <select
                  value={formData.esicStatus}
                  onChange={(e) => handleInputChange('esicStatus', e.target.value as any)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-white"
                >
                  <option value="Compliant">Compliant</option>
                  <option value="Pending">Pending</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                  <option value="Exempt">Exempt</option>
                </select>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {formData.esicStatus}
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Make in India Local Content Percentage
              </label>
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.localContentPercentage}
                    onChange={(e) =>
                      handleInputChange('localContentPercentage', parseInt(e.target.value) || 0)
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                  />
                  <span className="text-slate-500 font-bold">%</span>
                </div>
              ) : (
                <p className="font-bold text-slate-900 py-1">
                  {formData.localContentPercentage}% (Class-1 Local Supplier)
                </p>
              )}
              {validationErrors.localContentPercentage && (
                <p className="text-rose-600 text-[11px] mt-0.5">
                  {validationErrors.localContentPercentage}
                </p>
              )}
            </div>

            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={formData.hasOemAuthorization}
                  onChange={(e) => handleInputChange('hasOemAuthorization', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800 select-none">
                  Valid OEM Authorization (MAF) Available
                </span>
              </label>
            </div>

            {formData.hasOemAuthorization && (
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  OEM Partner Organization Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.oemPartnerName || ''}
                    onChange={(e) => handleInputChange('oemPartnerName', e.target.value)}
                    placeholder="e.g. Bharat Electronics Network Systems"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                  />
                ) : (
                  <p className="font-medium text-slate-900 py-1">
                    {formData.oemPartnerName || 'Standard OEM Partner'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Save/Cancel Bar when editing */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 p-4 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-md transition-colors"
            >
              Cancel Changes
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
