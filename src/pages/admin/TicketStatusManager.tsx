import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { DataGridSkeleton } from "../../components/common/Skeletons";
import { ROUTES } from '../../constants';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { useTicketStatuses } from '../../hooks';
import {
  ArrowLeft,
  Plus,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  GitCommit,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Workflow
} from 'lucide-react';

export const TicketStatusManager: React.FC = () => {
  const navigate = useNavigate();
  const {
    ticketType,
    statuses,
    loading,
    error,
    formState,
    setFormField,
    isModalOpen,
    editingStatus,
    startEdit,
    cancelEdit,
    save,
    remove,
    handleMove,
  } = useTicketStatuses();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string) => {
    setConfirmDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await remove(confirmDelete, true);
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
        <div className="bg-white border-b border-slate-200/80 px-6 py-6 lg:px-10 shadow-2xs">
          <div className="max-w-5xl mx-auto h-16 flex items-center">
            <div className="h-6 w-48 bg-slate-200 animate-pulse rounded" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
          <DataGridSkeleton rows={5} columns={4} />
        </div>
      </div>
    );
  }

  return (
    <PrivilegeGate requiredPrivilege="TICKET_TYPE_EDIT">
      <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200/80 px-6 py-6 lg:px-10 shadow-2xs">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN.TICKET_TYPES)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                title="Back to Ticket Types"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Workflow className="w-3.5 h-3.5" />
                    Lifecycle Stages
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {statuses.length} {statuses.length === 1 ? 'stage' : 'stages'}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Statuses</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Workflow progression stages for <span className="font-semibold text-slate-700">{ticketType?.title || 'Ticket Type'}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => startEdit()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Status Stage
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Progression Pipeline</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order determines the step-by-step progress shown to employees and support agents.
                </p>
              </div>
            </div>

            <div className="p-6">
              {statuses.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <GitCommit className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">No status stages defined yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Add status stages like "New", "In Progress", and "Resolved" to define your resolution workflow.
                  </p>
                  <button
                    type="button"
                    onClick={() => startEdit()}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add First Stage
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {statuses.map((status, index) => {
                    const isOpen = status.mappedState === 'OPEN';
                    return (
                      <div
                        key={status.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50/70 hover:border-slate-300 transition-all gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Step number badge */}
                          <div className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shadow-2xs flex-shrink-0">
                            {index + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-semibold text-sm text-slate-900 truncate">
                                {status.name}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                  isOpen
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {isOpen ? (
                                  <>
                                    <Clock className="w-3 h-3 text-emerald-600" />
                                    Active / In-Progress
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-slate-500" />
                                    Resolved / Closed
                                  </>
                                )}
                              </span>
                            </div>
                            <p className="text-2xs text-slate-400 mt-0.5">
                              System mapped state: <span className="font-mono font-medium">{status.mappedState}</span>
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0}
                            title="Move stage up"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-lg transition-colors"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === statuses.length - 1}
                            title="Move stage down"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-lg transition-colors"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <div className="h-4 w-px bg-slate-200 mx-1" />
                          <button
                            type="button"
                            onClick={() => startEdit(status)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-400" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(status.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg shadow-2xs transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Workflow className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingStatus ? 'Edit Status Stage' : 'Add Status Stage'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={save} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Stage Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormField('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all"
                    placeholder="e.g., In Progress, Awaiting Review"
                    autoFocus
                  />
                  <p className="text-2xs text-slate-400 mt-1">
                    Label displayed to employees and support teams.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ticket Lifecycle State
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormField('mappedState', 'OPEN')}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        formState.mappedState === 'OPEN'
                          ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        OPEN
                      </span>
                      <span className="text-2xs text-slate-500">
                        Active, in-progress ticket
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormField('mappedState', 'CLOSED')}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        formState.mappedState === 'CLOSED'
                          ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                        CLOSED
                      </span>
                      <span className="text-2xs text-slate-500">
                        Resolved, closed ticket
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                  >
                    {editingStatus ? 'Update Stage' : 'Create Stage'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Status Stage"
          description="Are you sure you want to delete this status stage? Tickets currently assigned to this status may need to be updated."
          loading={isDeleting}
        />
      </div>
    </PrivilegeGate>
  );
};
