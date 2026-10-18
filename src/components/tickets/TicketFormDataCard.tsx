import React, { useMemo } from 'react';
import { FileText, CheckCircle, XCircle } from 'lucide-react';
import type { FormSchema, FormField } from '../../types/formSchema';

export interface TicketFormDataCardProps {
  formData?: Record<string, unknown>;
  formSchema?: FormSchema | Record<string, unknown> | null;
}

/** Fallback cleaner that strips technical suffixes and returns readable words */
// eslint-disable-next-line react-refresh/only-export-components
export const cleanFallbackKey = (key: string): string => {
  // Strip generated random hashes like _mvbyx4zs_0ygg or timestamp suffixes
  const stripped = key
    .replace(/_[a-z0-9]{7,12}_[a-z0-9]{3,6}$/i, '')
    .replace(/_[0-9]{10,}$/i, '');

  return stripped
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || key;
};

export const TicketFormDataCard: React.FC<TicketFormDataCardProps> = ({ formData = {}, formSchema }) => {
  const { fieldMap, orderedKeys } = useMemo(() => {
    const map = new Map<string, FormField>();
    const schemaKeyOrder: string[] = [];
    if (formSchema) {
      let s: any = formSchema;
      if (typeof s === 'string') {
        try {
          s = JSON.parse(s);
        } catch {
          // ignore
        }
      }
      const fieldsList: FormField[] = Array.isArray(s?.fields) ? s.fields : Array.isArray(s) ? s : [];
      fieldsList.forEach((f) => {
        if (f && f.name) {
          map.set(f.name, f);
          schemaKeyOrder.push(f.name);
        }
      });
    }

    const formKeys = Object.keys(formData);
    const ordered: string[] = [];
    schemaKeyOrder.forEach((k) => {
      if (formKeys.includes(k)) {
        ordered.push(k);
      }
    });
    formKeys.forEach((k) => {
      if (!ordered.includes(k)) {
        ordered.push(k);
      }
    });

    return { fieldMap: map, orderedKeys: ordered };
  }, [formData, formSchema]);

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

      {orderedKeys.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          No additional form fields were required for this ticket type.
        </div>
      ) : (
        <div className="space-y-3">
          {orderedKeys.map((key) => {
            const value = formData[key];
            const fieldDef = fieldMap.get(key);
            const label = fieldDef?.label || cleanFallbackKey(key);

            return (
              <div key={key} className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-600 mb-1.5 block">
                  {label}
                </span>
                <div className="text-xs text-slate-900 font-medium">
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
                    <span>{value !== undefined && value !== null && String(value) !== '' ? String(value) : '–'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
