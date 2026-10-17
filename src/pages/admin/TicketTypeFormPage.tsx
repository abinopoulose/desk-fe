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
  FolderOpen,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { DataGridSkeleton } from '../../components/common/Skeletons';
import { ROUTES } from '../../constants';
import { SchemaBuilder } from '../../components/admin/SchemaBuilder';
import { SlaConfigSection } from '../../components/admin/SlaConfigSection';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { FolderExplorerModal } from '../../components/folders/FolderExplorerModal';
import { useTicketTypeForm, useDepartments, useFolderTree } from '../../hooks';
import { slaApi } from '../../api/slaApi';
import type { FolderNodeDTO } from '../../types/folder';
import type { CreateSlaConfigRequest } from '../../types/sla';

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

  // Staged SLA configurations for Create mode
  const [stagedSlas, setStagedSlas] = useState<CreateSlaConfigRequest[]>([
    {
      priority: 1, // Critical
      resolutionMinutes: 240, // 4 hours
      workingDays: [1, 2, 3, 4, 5, 6, 7],
      workingHoursStart: '00:00:00',
      workingHoursEnd: '23:59:00',
      escalationHooks: null,
    },
    {
      priority: 2, // High
      resolutionMinutes: 480, // 8 hours
      workingDays: [1, 2, 3, 4, 5],
      workingHoursStart: '09:00:00',
      workingHoursEnd: '17:00:00',
      escalationHooks: null,
    },
    {
      priority: 3, // Medium
      resolutionMinutes: 1440, // 24 hours
      workingDays: [1, 2, 3, 4, 5],
      workingHoursStart: '09:00:00',
      workingHoursEnd: '17:00:00',
      escalationHooks: null,
    },
    {
      priority: 4, // Low
      resolutionMinutes: 2880, // 48 hours
      workingDays: [1, 2, 3, 4, 5],
      workingHoursStart: '09:00:00',
      workingHoursEnd: '17:00:00',
      escalationHooks: null,
    },
  ]);

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
    alphaTag,
    setAlphaTag,
    originalAlphaTag,
    formSchema,
    setFormSchema,
    isActive,
    setIsActive,
    loading: formLoading,
    submitting,
    error,
    handleSubmit,
  } = useTicketTypeForm({
    onSuccess: async (createdTicketType) => {
      // If we were creating a brand new ticket type, persist any configured SLA policies!
      if (!isEditMode && stagedSlas.length > 0) {
        try {
          await Promise.allSettled(
            stagedSlas.map((sla) => slaApi.createSlaConfig(createdTicketType.id, sla))
          );
        } catch (err) {
          console.error('Error persisting SLA policies on creation', err);
        }
      }
      navigate(ROUTES.ADMIN.TICKET_TYPES);
    },
  });

  const { departments, loading: depsLoading } = useDepartments();
  const { treeData, isLoading: treeLoading } = useFolderTree();

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'form' | 'sla'>('details');
  const [showWarningModal, setShowWarningModal] = useState(false);

  const selectedDepartment = useMemo(() => {
    return departments.find((d) => d.id === departmentId);
  }, [departments, departmentId]);

  const availableAlphaTags = useMemo(() => {
    return selectedDepartment?.alphaTags || [];
  }, [selectedDepartment]);

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && originalAlphaTag && alphaTag && originalAlphaTag.trim().toUpperCase() !== alphaTag.trim().toUpperCase()) {
      setShowWarningModal(true);
      return;
    }
    handleSubmit(e);
  };

  const handleConfirmTagMutation = async () => {
    setShowWarningModal(false);
    await handleSubmit();
  };

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
    <PrivilegeGate requiredPrivilege="TICKET_TYPE_EDIT">
      <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
        
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200/80 shadow-2xs">
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
                    Service Catalog
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : null}
                    {isActive ? 'Available to Staff' : 'Draft / Inactive'}
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
                onClick={handleSaveClick}
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

            {/* SLA tab is available in BOTH Create mode and Edit mode! */}
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
              <span>SLA Policy Configuration</span>
              {!isEditMode && stagedSlas.length > 0 && (
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
                  {stagedSlas.length}
                </span>
              )}
            </button>
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

          {/* TAB 1: General Settings (Simplified for HR / Non-Technical Users) */}
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
                    <p className="text-xs text-slate-500">
                      Configure the ticket name, handling department, and employee guidance
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Ticket Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="title"
                      type="text"
                      required
                      placeholder="e.g. Vacation Request, Hardware Replacement, Payroll Inquiry"
                      value={title || ''}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      The descriptive name shown to employees in the service catalog.
                    </p>
                  </div>

                  {/* Department */}
                  <div>
                    <label htmlFor="departmentId" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Handling Department <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="departmentId"
                        required
                        value={departmentId || ''}
                        onChange={(e) => {
                          const newDeptId = e.target.value;
                          setDepartmentId(newDeptId);
                          const dept = departments.find(d => d.id === newDeptId);
                          if (dept?.alphaTags && dept.alphaTags.length > 0 && (!alphaTag || !dept.alphaTags.includes(alphaTag))) {
                            setAlphaTag(dept.alphaTags[0]);
                          }
                        }}
                        className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all outline-none focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select the department responsible</option>
                        {departments.map((dep) => (
                          <option key={dep.id} value={dep.id}>{dep.name}</option>
                        ))}
                      </select>
                      <Building2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tickets created under this type will be assigned to this department.
                    </p>
                  </div>

                  {/* Alpha Tag (Dynamic Ticket Display ID Prefix) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="alphaTag" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Alpha Tag (ID Prefix) <span className="text-rose-500">*</span>
                      </label>
                      {isEditMode && originalAlphaTag && alphaTag && originalAlphaTag !== alphaTag && (
                        <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          ID Mutation Warning
                        </span>
                      )}
                    </div>
                    {availableAlphaTags.length > 0 ? (
                      <div className="relative">
                        <select
                          id="alphaTag"
                          required
                          value={alphaTag || ''}
                          onChange={(e) => setAlphaTag(e.target.value)}
                          className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 transition-all outline-none focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Select an Alpha Tag from {selectedDepartment?.name}</option>
                          {availableAlphaTags.map((tag) => (
                            <option key={tag} value={tag}>
                              {tag} (e.g. {tag}-1, {tag}-2)
                            </option>
                          ))}
                          {alphaTag && !availableAlphaTags.includes(alphaTag) && (
                            <option value={alphaTag}>{alphaTag} (Custom/Current)</option>
                          )}
                        </select>
                        <Tag className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          id="alphaTag"
                          type="text"
                          required
                          placeholder="e.g. AWS, GCP, IT, HR"
                          value={alphaTag || ''}
                          onChange={(e) => setAlphaTag(e.target.value.toUpperCase())}
                          className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <Tag className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tickets raised under this type will have Display IDs formatted as <strong className="font-mono text-indigo-600">{alphaTag || 'TAG'}-1</strong>.
                    </p>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Instructions & Policy for Employees
                    </label>
                    <textarea
                      id="description"
                      placeholder="e.g. Please submit this form at least 48 hours prior to your requested leave dates..."
                      value={description || ''}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100 leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Clear instructions or eligibility criteria displayed to employees before filling out the form.
                    </p>
                  </div>
                </div>
              </div>

              {/* FOLDER LOCATION CARD (Interactive File Explorer Navigation) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Catalog Category Location</h2>
                      <p className="text-xs text-slate-500">
                        Choose which catalog folder employees browse to find this ticket
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFolderModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{folderId ? 'Change Category Folder' : 'Select Category Folder'}</span>
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
                        <span>Catalog</span>
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
                    Open Folder Navigator →
                  </button>
                </div>
              </div>

              {/* Status Toggle Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Available to Employees</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      When enabled, employees will see this ticket in the service catalog and can submit requests.
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
                    <h2 className="text-base font-bold text-slate-900">Form Questions Builder</h2>
                    <p className="text-xs text-slate-500">Design the custom questions employees answer when submitting this ticket</p>
                  </div>
                </div>
              </div>

              <SchemaBuilder schema={formSchema} onChange={setFormSchema} />
            </div>
          )}

          {/* TAB 3: SLA Configuration (Available in both Create & Edit mode!) */}
          {activeTab === 'sla' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">SLA Policy Configuration</h2>
                  <p className="text-xs text-slate-500">
                    {isEditMode
                      ? 'Define resolution targets and working schedules for each priority level'
                      : 'Configure SLA resolution policies for this new ticket type. They will be saved when created.'}
                  </p>
                </div>
              </div>

              <SlaConfigSection
                ticketTypeId={ticketTypeId}
                stagedConfigs={stagedSlas}
                onStagedConfigsChange={setStagedSlas}
              />
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
              onClick={handleSaveClick}
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Changes...' : 'Save Ticket Type'}</span>
            </button>
          </div>
        </div>

        {/* CRITICAL - ADMIN WARNING POPUP (Tag Mutation Confirmation Modal) */}
        {showWarningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div 
              className="bg-white rounded-2xl max-w-lg w-full border border-rose-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="tag-mutation-title"
            >
              <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full border border-rose-200">
                    Critical Display ID Mutation
                  </span>
                  <h2 id="tag-mutation-title" className="text-lg font-bold text-slate-900 mt-1">
                    Mutate All Historical Ticket IDs?
                  </h2>
                  <p className="text-xs text-rose-700 mt-0.5 font-medium">
                    This change impacts historical Display IDs across the entire workspace.
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Original Prefix:</span>
                    <span className="font-mono bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded">
                      {originalAlphaTag} (e.g. {originalAlphaTag}-33)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">New Prefix:</span>
                    <span className="font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-200 font-bold">
                      {alphaTag} (e.g. {alphaTag}-33)
                    </span>
                  </div>
                </div>

                <p>
                  You are changing the Ticket Type Alpha Tag from <strong className="font-mono text-slate-900">{originalAlphaTag}</strong> to <strong className="font-mono text-rose-700">{alphaTag}</strong>.
                </p>

                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <p className="font-semibold flex items-center gap-1.5 mb-1 text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    Widespread ID Mutation Warning
                  </p>
                  <p>
                    Because ticket display IDs are dynamically resolved, changing this tag will <strong>instantly mutate the Display IDs of all existing tickets</strong> raised under this type! Every historical ticket like <span className="font-mono font-semibold">{originalAlphaTag}-1</span> will now render as <span className="font-mono font-semibold">{alphaTag}-1</span> across the dashboard, APIs, emails, and links.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWarningModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel & Keep {originalAlphaTag}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTagMutation}
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 font-bold"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Mutating IDs...' : 'I Understand, Mutate Historical IDs'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOLDER EXPLORER MODAL (Real File Explorer Navigator) */}
        <FolderExplorerModal
          isOpen={isFolderModalOpen}
          onClose={() => setIsFolderModalOpen(false)}
          onSelect={handleFolderSelect}
          currentFolderId={folderId}
          treeData={treeData}
          title="Select Category Folder"
          description={`Choose where "${title || 'this ticket type'}" should appear in the employee catalog.`}
          allowRoot={false}
        />
      </div>
    </PrivilegeGate>
  );
};
