import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { EligibilityEvaluation } from '../../types';

interface EligibilityMatrixProps {
  evaluation: EligibilityEvaluation;
  onUpdateProfileClick?: () => void;
  className?: string;
}

export const EligibilityMatrix: React.FC<EligibilityMatrixProps> = ({
  evaluation,
  onUpdateProfileClick,
  className = '',
}) => {
  const { overallStatus, passedCount, totalCount, items, summaryMessage } = evaluation;

  const statusConfig = {
    Eligible: {
      border: 'border-emerald-200 bg-emerald-50/40',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      iconChar: '✓',
      title: 'Full Tender Eligibility Verified',
    },
    Conditional: {
      border: 'border-amber-200 bg-amber-50/40',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      iconChar: '!',
      title: 'Conditional Eligibility — Action Required',
    },
    Ineligible: {
      border: 'border-rose-200 bg-rose-50/40',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      iconChar: '×',
      title: 'Eligibility Gaps Detected',
    },
  }[overallStatus];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overview Status Banner */}
      <div className={`rounded-lg border p-4 ${statusConfig.border}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-sm bg-white border border-slate-200 shadow-2xs">
              {statusConfig.iconChar === '✓' && <span className="text-emerald-700">✓</span>}
              {statusConfig.iconChar === '!' && <span className="text-amber-700 font-bold">!</span>}
              {statusConfig.iconChar === '×' && <span className="text-rose-700 font-bold">×</span>}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{statusConfig.title}</h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${statusConfig.badge}`}
                >
                  {overallStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{summaryMessage}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-medium">Compliance Match</span>
              <p className="text-xs font-bold text-slate-900">
                {passedCount} of {totalCount} Criteria Met
              </p>
            </div>
            {overallStatus !== 'Eligible' && onUpdateProfileClick && (
              <button
                type="button"
                onClick={onUpdateProfileClick}
                className="text-xs font-semibold text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors shadow-2xs"
              >
                Update Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Item-by-item Compliance Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-xs">
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Statutory Eligibility Verification Matrix
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">Cross-verified with Bidder Profile & Registries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Requirement Parameter</th>
                <th className="py-2.5 px-4 font-semibold">Tender Threshold</th>
                <th className="py-2.5 px-4 font-semibold">Submitted Profile Value</th>
                <th className="py-2.5 px-4 font-semibold">Result</th>
                <th className="py-2.5 px-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <tr
                  key={index}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    !item.isEligible ? 'bg-rose-50/20' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{item.ruleName}</span>
                      {item.isMandatory && (
                        <span className="text-[11px] text-rose-600 font-bold" title="Mandatory Statutory Requirement">
                          *
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{item.requirement}</td>
                  <td className="py-3 px-4 font-mono text-slate-900 font-medium">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                        item.isEligible
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-rose-50 text-rose-800 border border-rose-200 font-bold'
                      }`}
                    >
                      {item.bidderValue}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.isEligible ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2 py-0.5 rounded text-[11px]">
                        <span>✓</span>
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-800 bg-rose-50 border border-rose-200/90 px-2 py-0.5 rounded text-[11px]">
                        <span>×</span>
                        <span>Failed</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs">{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
