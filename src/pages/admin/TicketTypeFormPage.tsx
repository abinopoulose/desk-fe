import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  FolderTree, 
  Layers, 
  Building2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Clock, 
  FolderCheck,
  FolderOpen
} from 'lucide-react';
import { DataGridSkeleton } from '../../components/common/Skeletons';
import { ROUTES } from '../../constants';
import { SchemaBuilder } from '../../components/admin/SchemaBuilder';
import { SlaConfigSection } from '../../components/admin/SlaConfigSection';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { FolderExplorerModal } from '../../components/folders/FolderExplorerModal';
import { useTicketTypeForm, useDepartments, useFolderTree } from '../../hooks';
import type { FolderNodeDTO } from '../../types/folder';

/** Helper to derive breadcrumb path for display */
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

export const TicketTypeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    ticketTypeId,
    isEditMode,
    title,
    setTitle,
    description,
    setDescription,
    folderId,
    setFolderId,
    departmentId,
    setDepartmentId,
    formSchema,
    setFormSchema,
    isActive,
    setIsActive,
    loading: formLoading,
    submitting,
    error,
    handleSubmit,
  } = useTicketTypeForm();

  const { departments, loading: depsLoading } = useDepartments();
  const { treeData, isLoading: treeLoading } = useFolderTree();

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'form' | 'sla'>('details');

  // Derive folder path breadcrumbs and folder name
  const currentFolderPath = useMemo(() => {
    if (!folderId) return [];
    return findFolderPath(treeData, folderId) || [];
  }, [treeData, folderId]);

  const currentFolderName = currentFolderPath.length > 0 
    ? currentFolderPath[currentFolderPath.length - 1] 
    : 'No folder assigned';

  if (formLoading || depsLoading || treeLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <DataGridSkeleton rows={6} columns={4} />
      </div>
    );
  }

  const handleFolderSelect = (newFolderId: string) => {
    setFolderId(newFolderId);
  };

  return (
    <PrivilegeGate requiredPrivilege="TICKET_TYPE_WRITE">
      <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
        
        {/* Sticky Top Header */}
        <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-2xs">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN.TICKET_TYPES)}
                className="w-9 h-9 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Back to Ticket Types"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Ticket Master
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : null}
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                  {ticketTypeId && (
                    <span className="text-[11px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                      #{ticketTypeId.slice(0, 8)}
                    </span>
                  )}
                </div>
                
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                  <span>{isEditMode ? title || 'Edit Ticket Type' : 'Create New Ticket Type'}</span>
                </h1>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN.TICKET_TYPES)}
                className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={(e) => handleSubmit(e)}
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{submitting ? 'Saving Changes...' : 'Save Ticket Type'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 border-t border-slate-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>General Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'form'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Form Schema Builder</span>
              {formSchema?.fields?.length ? (
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
                  {formSchema.fields.length}
                </span>
              ) : null}
            </button>

            {isEditMode && ticketTypeId && (
              <button
                type="button"
                onClick={() => setActiveTab('sla')}
                className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'sla'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>SLA Configuration</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3 text-sm" role="alert">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: General Settings */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              
              {/* Basic Information Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 lg:p-8">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Basic Information</h2>
                    <p className="text-xs text-slate-500">Configure ticket title, department, and description</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="title"
                      type="text"
                      required
                      placeholder="e.g. Laptop Replacement Request"
                      value={title || ''}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label htmlFor="departmentId" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="departmentId"
                        required
                        value={departmentId || ''}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all outline-none focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select a department</option>
                        {departments.map((dep) => (
                          <option key={dep.id} value={dep.id}>{dep.name}</option>
                        ))}
                      </select>
                      <Building2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      placeholder="Provide helpful guidance for users submitting this ticket..."
                      value={description || ''}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100 leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* FOLDER LOCATION CARD (File Explorer Navigation instead of dropdown) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 lg:p-8">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Folder & Category Location</h2>
                      <p className="text-xs text-slate-500">
                        Organize where this ticket type appears in the folder hierarchy
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFolderModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{folderId ? 'Change / Move Folder' : 'Select Folder'}</span>
                  </button>
                </div>

                {/* Display Current Folder Location */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <FolderCheck className="w-5 h-5" />
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium overflow-x-auto whitespace-nowrap mb-0.5">
                        <span>Drive</span>
                        {currentFolderPath.map((segment, idx) => (
                          <React.Fragment key={idx}>
                            <span>/</span>
                            <span className={idx === currentFolderPath.length - 1 ? 'text-slate-600 font-semibold' : ''}>
                              {segment}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>

                      <p className="text-sm font-bold text-slate-800">
                        {currentFolderName}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFolderModalOpen(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    Browse Folder Explorer →
                  </button>
                </div>
              </div>

              {/* Status Toggle Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Active Status</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      When enabled, users will see this ticket type in the catalog and can submit tickets.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Form Schema Builder */}
          {activeTab === 'form' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Form Schema Builder</h2>
                    <p className="text-xs text-slate-500">Design custom dynamic fields and validations for this ticket form</p>
                  </div>
                </div>
              </div>

              <SchemaBuilder schema={formSchema} onChange={setFormSchema} />
            </div>
          )}

          {/* TAB 3: SLA Configuration */}
          {activeTab === 'sla' && isEditMode && ticketTypeId && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">SLA Policy Configuration</h2>
                  <p className="text-xs text-slate-500">Define resolution targets and working schedules for each priority level</p>
                </div>
              </div>

              <SlaConfigSection ticketTypeId={ticketTypeId} />
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate(ROUTES.ADMIN.TICKET_TYPES)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e)}
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Changes...' : 'Save Ticket Type'}</span>
            </button>
          </div>
        </div>

        {/* FOLDER EXPLORER MODAL (Real File Explorer Navigator) */}
        <FolderExplorerModal
          isOpen={isFolderModalOpen}
          onClose={() => setIsFolderModalOpen(false)}
          onSelect={handleFolderSelect}
          currentFolderId={folderId}
          treeData={treeData}
          title="Select Folder Location"
          description={`Choose the folder where "${title || 'this ticket type'}" should be organized.`}
          allowRoot={false}
        />
      </div>
    </PrivilegeGate>
  );
};
