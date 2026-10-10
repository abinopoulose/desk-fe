import React from 'react';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

export interface TicketFormDataCardProps {
  formData?: Record<string, unknown>;
}

/** Convert snake_case / camelCase keys to friendly labels */
const humanizeKey = (key: string): string =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

export const TicketFormDataCard: React.FC<TicketFormDataCardProps> = ({ formData = {} }) => {
  const entries = Object.entries(formData);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Submitted Form Details</h3>
          <p className="text-xs text-slate-400">Information provided by the requester upon submission</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          No additional form fields were required for this ticket type.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {entries.map(([key, value]) => (
            <div key={key} className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {humanizeKey(key)}
              </span>
              <div className="text-xs text-slate-800 font-medium">
                {typeof value === 'boolean' ? (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    value ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {value ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                    <span>{value ? 'Yes' : 'No'}</span>
                  </span>
                ) : Array.isArray(value) ? (
                  <ul className="list-disc pl-4 space-y-0.5">
                    {value.map((v, i) => (
                      <li key={i}>{String(v)}</li>
                    ))}
                  </ul>
                ) : (
                  <span>{String(value) || '–'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
