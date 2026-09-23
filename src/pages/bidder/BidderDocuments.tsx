import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Download,
  ShieldCheck,
  Eye,
  Trash2,
  X,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast, ToastMessage } from '../../components/common/Toast';

export interface ComplianceDocument {
  id: string;
  name: string;
  category: string;
  fileSize: string;
  uploadDate: string;
  validUntil: string;
  verificationStatus: 'Verified' | 'Pending' | 'Review Required';
  ocrReadiness: string;
}

const DEFAULT_DOCUMENTS: ComplianceDocument[] = [
  {
    id: 'DOC-001',
    name: 'GST_Registration_Certificate_REG06.pdf',
    category: 'Statutory Registration',
    fileSize: '1.2 MB',
    uploadDate: '2026-01-10',
    validUntil: 'Lifetime / Active',
    verificationStatus: 'Verified',
    ocrReadiness: 'OCR Extraction Complete (GSTIN, Entity Name, Filing State)',
  },
  {
    id: 'DOC-002',
    name: 'Permanent_Account_Number_PAN_Copy.pdf',
    category: 'Statutory ID',
    fileSize: '840 KB',
    uploadDate: '2026-01-10',
    validUntil: 'Permanent',
    verificationStatus: 'Verified',
    ocrReadiness: 'OCR Extraction Complete (PAN, Incorporation Date)',
  },
  {
    id: 'DOC-003',
    name: 'MSME_Udyam_Registration_Certificate.pdf',
    category: 'Enterprise Classification',
    fileSize: '1.6 MB',
    uploadDate: '2026-02-01',
    validUntil: '2027-03-31',
    verificationStatus: 'Verified',
    ocrReadiness: 'OCR Extraction Complete (Enterprise Type, Major Activity)',
  },
  {
    id: 'DOC-004',
    name: 'Audited_Balance_Sheet_Profit_Loss_FY25.pdf',
    category: 'Financial Statements',
    fileSize: '4.8 MB',
    uploadDate: '2026-02-15',
    validUntil: '2026-12-31',
    verificationStatus: 'Verified',
    ocrReadiness: 'Financial Tables Parsed (Annual Turnover, Net Worth)',
  },
  {
    id: 'DOC-005',
    name: 'Manufacturer_Authorization_Form_OEM_2026.pdf',
    category: 'OEM Authorization',
    fileSize: '2.1 MB',
    uploadDate: '2026-02-28',
    validUntil: '2027-02-28',
    verificationStatus: 'Review Required',
    ocrReadiness: 'Digital Signature pending manual officer confirmation',
  },
];

const STORAGE_KEY = 'gem_procure_documents';

export const BidderDocuments: React.FC = () => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState<ComplianceDocument | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Statutory Registration');
  const [uploadValidity, setUploadValidity] = useState('2027-12-31');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDocuments(JSON.parse(stored));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DOCUMENTS));
        setDocuments(DEFAULT_DOCUMENTS);
      }
    } catch {
      setDocuments(DEFAULT_DOCUMENTS);
    }
  }, []);

  const saveDocumentsToStorage = (updatedDocs: ComplianceDocument[]) => {
    setDocuments(updatedDocs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocs));
    } catch (err) {
      console.error('Failed to persist documents to localStorage', err);
    }
  };

  const handleDownloadDocument = (doc: ComplianceDocument) => {
    const fileContent = `================================================================================
GOVERNMENT E-MARKETPLACE (GeM) - STATUTORY COMPLIANCE DOCUMENT
================================================================================
Document Title       : ${doc.name}
Document ID          : ${doc.id}
Category             : ${doc.category}
File Size Reference  : ${doc.fileSize}
Registered Upload On : ${doc.uploadDate}
Statutory Validity   : ${doc.validUntil}
Verification Status  : ${doc.verificationStatus}
OCR Readiness        : ${doc.ocrReadiness}
Authentication Hash  : SHA256:${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}
================================================================================
Issued to: ABC Technologies Pvt. Ltd. (GeM Vendor ID: bidder-001)
Digital Signature: Digitally authenticated via GeM Bid Compliance Verification Portal.
================================================================================`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.name.endsWith('.pdf') ? doc.name.replace('.pdf', '_certified.txt') : `${doc.name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Document Downloaded',
      message: `${doc.name} has been downloaded with statutory digital verification tags.`,
    });
  };

  const handleOpenUploadModal = () => {
    setUploadTitle('');
    setUploadCategory('Statutory Registration');
    setUploadValidity('2027-12-31');
    setUploadFile(null);
    setIsUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle.trim()) {
        setUploadTitle(file.name);
      }
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile && !uploadTitle.trim()) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'File Required',
        message: 'Please choose a valid compliance document file to upload.',
      });
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      const fileName = uploadFile ? uploadFile.name : `${uploadTitle.trim().replace(/\s+/g, '_')}.pdf`;
      const sizeFormatted = uploadFile
        ? uploadFile.size > 1024 * 1024
          ? `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(uploadFile.size / 1024)} KB`
        : '1.4 MB';

      const newDoc: ComplianceDocument = {
        id: `DOC-0${documents.length + 1}`,
        name: fileName,
        category: uploadCategory,
        fileSize: sizeFormatted,
        uploadDate: new Date().toISOString().split('T')[0],
        validUntil: uploadValidity.trim() || '2027-12-31',
        verificationStatus: 'Verified',
        ocrReadiness: 'OCR Extraction Complete (Document cataloged into verification pipeline)',
      };

      const updated = [newDoc, ...documents];
      saveDocumentsToStorage(updated);
      setIsUploading(false);
      setIsUploadModalOpen(false);

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Document Successfully Uploaded',
        message: `${newDoc.name} has been cataloged and saved to your compliance repository.`,
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Compliance Document Repository"
        subtitle="Manage certified digital documents, statutory filings, and OCR-extracted attributes required for automated GeM tender cross-verification."
        breadcrumbs={[
          { label: 'Portal', href: '/bidder/dashboard' },
          { label: 'Documents' },
        ]}
        actions={
          <button
            type="button"
            onClick={handleOpenUploadModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload New Certificate</span>
          </button>
        }
      />

      {/* OCR Pipeline Notice */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-slate-900">
            Automated Cross-Verification Architecture Active
          </p>
          <p className="text-slate-600 mt-0.5">
            Documents cataloged in this repository are cross-verified against Form Data, Gemini OCR Extraction, and the 500-record Government Master Register during tender evaluation.
          </p>
        </div>
      </div>

      {/* Document List Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4">Validity Period</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4">OCR Extraction Note</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                      <span className="font-mono text-slate-800 text-[11px] font-semibold">{doc.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{doc.category}</td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{doc.fileSize}</td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{doc.uploadDate}</td>
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">{doc.validUntil}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={doc.verificationStatus} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-500 max-w-xs truncate">
                    {doc.ocrReadiness}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedDocForView(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-blue-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                        title="Inspect document metadata & OCR parsing"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDocument(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer"
                        title="Download authenticated certificate file"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Certificate Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-slate-800" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Upload Compliance Certificate
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Select Certificate File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-300 rounded p-1 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">Supported formats: PDF, JPG, PNG (Max 10 MB)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. ISO_9001_Quality_Certificate.pdf"
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Document Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                  >
                    <option value="Statutory Registration">Statutory Registration</option>
                    <option value="Statutory ID">Statutory ID</option>
                    <option value="Enterprise Classification">Enterprise Classification</option>
                    <option value="Financial Statements">Financial Statements</option>
                    <option value="OEM Authorization">OEM Authorization</option>
                    <option value="Technical Certifications">Technical Certifications</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Statutory Validity Period
                  </label>
                  <input
                    type="text"
                    value={uploadValidity}
                    onChange={(e) => setUploadValidity(e.target.value)}
                    placeholder="e.g. 2027-12-31 or Lifetime"
                    className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded text-[11px] text-blue-900 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  The document will be securely cataloged and made accessible for automatic cross-verification in all active tender applications.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{isUploading ? 'Uploading...' : 'Save & Catalog'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Inspector Modal */}
      {selectedDocForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-700" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Document Inspection: {selectedDocForView.id}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocForView(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">File Name:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{selectedDocForView.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Category:</span>
                  <span className="text-slate-800">{selectedDocForView.category}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Size:</span>
                  <span className="text-slate-800">{selectedDocForView.fileSize}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Upload Date:</span>
                  <span className="text-slate-800">{selectedDocForView.uploadDate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Valid Until:</span>
                  <span className="font-semibold text-slate-900">{selectedDocForView.validUntil}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500">Verification:</span>
                  <StatusBadge status={selectedDocForView.verificationStatus} size="sm" />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded">
                <span className="text-[10px] font-bold text-emerald-900 uppercase block mb-0.5">
                  OCR Parser Metadata Extraction
                </span>
                <p className="text-xs text-emerald-950 leading-relaxed">
                  {selectedDocForView.ocrReadiness}
                </p>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleDownloadDocument(selectedDocForView);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-2xs cursor-pointer"
              >
                <Download className="h-3 w-3" />
                <span>Download Certified File</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDocForView(null)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded cursor-pointer"
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
export default BidderDocuments;
