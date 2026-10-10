import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Send, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { PageHeaderSkeleton, CardSkeleton } from '../../components/common/Skeletons';
import { DynamicFormRenderer } from '../../components/forms/DynamicFormRenderer';
import type { FormSchema, FormField } from '../../types/formSchema';
import type { FolderNodeDTO } from '../../types/folder';
import { useCreateTicket, useDepartments, useFolderTree } from '../../hooks';
import { ROUTES, TICKET_PRIORITY_ITEMS } from '../../constants';
import { ArchiveBrowser } from '../../components/archive/ArchiveBrowser';

function findFolderPath(nodes: FolderNodeDTO[], targetId: string, path: string[] = []): string[] | null {
  for (const node of nodes) {
    const current = [...path, node.name];
    if (node.id === targetId) return current;
    if (node.children?.length) {
      const found = findFolderPath(node.children, targetId, current);
      if (found) return found;
    }
  }
  return null;
}

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    typeId,
    schemaResponse,
    loadingSchema,
    error,
    fieldErrors,
    priority,
    setPriority,
    isSubmitting,
    showConfirmModal,
    setShowConfirmModal,
    stagedFormData,
    handleFormSubmit,
    confirmSubmission,
  } = useCreateTicket();

  const { departments } = useDepartments();
  const { treeData } = useFolderTree();

  const departmentName = useMemo(() => {
    if (!schemaResponse?.departmentId) return null;
    return departments.find((d) => d.id === schemaResponse.departmentId)?.name || null;
  }, [departments, schemaResponse?.departmentId]);

  const folderPath = useMemo(() => {
    if (!schemaResponse?.folderId) return [];
    return findFolderPath(treeData, schemaResponse.folderId) || [];
  }, [treeData, schemaResponse?.folderId]);

  if (!typeId) {
    return <ArchiveBrowser />;
  }

  if (loadingSchema) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <PageHeaderSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error && !schemaResponse) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl flex items-start gap-3 shadow-xs" role="alert">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">Failed to Load Ticket Type</h3>
            <p className="text-xs text-red-700 mt-1">{error}</p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.TICKETS.NEW)}
              className="mt-3 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!schemaResponse) {
    return null;
  }

  const formSchema = schemaResponse.formSchema as unknown as FormSchema;
  const fields: FormField[] = formSchema?.fields || [];
  const selectedPriorityItem = TICKET_PRIORITY_ITEMS.find((p) => p.value === priority) || TICKET_PRIORITY_ITEMS[2];

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
      {/* Top Header Card */}
      <div className="bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-5">
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.TICKETS.NEW)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Service Catalog</span>
            </button>
          </div>

          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mb-2">
            <span>Service Catalog</span>
            {departmentName && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-slate-600 font-medium">{departmentName}</span>
              </>
            )}
            {folderPath.map((folder, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-slate-600 font-medium">{folder}</span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{schemaResponse.title}</span>
              </h1>
              {schemaResponse.description && (
                <p className="text-sm text-slate-500 mt-1 max-w-2xl">{schemaResponse.description}</p>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Create New Request</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        {/* Error notification banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3 text-sm shadow-xs" role="alert">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">Unable to submit ticket: </span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Priority Selection Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Ticket Priority</h2>
              <p className="text-xs text-slate-500 mt-0.5">Select urgency to ensure appropriate response and SLA resolution time</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
              Level {priority}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TICKET_PRIORITY_ITEMS.map((p) => {
              const isSelected = priority === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                  }`}
                  data-testid={`priority-${p.value}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${p.colorClass}`}>
                      P{p.value}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">{p.label}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {p.value === 1 ? 'Immediate response' : p.value === 2 ? 'High urgency' : p.value === 3 ? 'Standard response' : 'Routine'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Details Form Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Ticket Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">Please fill out all required details below to raise this ticket</p>
            </div>
          </div>

          <DynamicFormRenderer
            schema={formSchema}
            onSubmit={handleFormSubmit}
            externalErrors={fieldErrors}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200" role="dialog" aria-modal="true">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Ticket Submission</h3>
                <p className="text-xs text-slate-500">Review your ticket details before submitting</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Request Type</span>
                  <span className="font-semibold text-slate-800">{schemaResponse.title}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Priority</span>
                  <span className={`inline-block font-semibold mt-0.5 px-2 py-0.5 rounded text-[11px] ${selectedPriorityItem.colorClass}`}>
                    P{priority} - {selectedPriorityItem.label}
                  </span>
                </div>
              </div>

              {/* Form responses list */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Submitted Responses</h4>
                {fields.length > 0 ? (
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 max-h-52 overflow-y-auto space-y-2">
                    {fields.map((f) => {
                      const val = stagedFormData[f.name];
                      if (val === undefined || val === null || val === '') return null;
                      return (
                        <div key={f.name} className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-slate-200/50 last:border-0 text-xs">
                          <span className="font-medium text-slate-500">{f.label || f.name}:</span>
                          <span className="text-slate-900 font-semibold text-right break-words">
                            {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs text-slate-500 italic">
                    Standard submission with no custom fields.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSubmission}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                disabled={isSubmitting}
                data-testid="confirm-submit-btn"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting Ticket...' : 'Confirm & Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
