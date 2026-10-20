import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Briefcase, 
  AlertCircle, 
  X,
  Check
} from 'lucide-react';
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { DataGridSkeleton } from '../../components/common/Skeletons';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { useDepartments } from '../../hooks/useDepartments';
import type { DepartmentDTO } from '../../types/department';

export const DepartmentAdminPage: React.FC = () => {
  const {
    departments,
    loading,
    error: fetchError,
    formState,
    setFormField,
    isEditing,
    startEdit,
    cancelEdit,
    save,
    remove,
  } = useDepartments();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase().trim();
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
    );
  }, [departments, searchQuery]);

  const openCreateModal = () => {
    setActionError(null);
    setTagsInput('');
    startEdit();
    setIsModalOpen(true);
  };

  const openEditModal = (dept: DepartmentDTO) => {
    setActionError(null);
    setTagsInput((dept.alphaTags || []).join(', '));
    startEdit(dept);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    cancelEdit();
    setIsModalOpen(false);
    setActionError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);
    try {
      await save();
      closeModal();
    } catch (error) {
      console.error('Failed to save department', error);
      setActionError('Failed to save department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setConfirmDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await remove(confirmDelete.id);
    } catch (error) {
      console.error('Failed to delete department', error);
      setActionError('Failed to delete department.');
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  return (
    <PrivilegeGate requiredPrivilege="DEPARTMENT_EDIT">
      <div className="min-h-full bg-slate-50 text-slate-800 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8">
        
        {/* Header Area */}
        <div className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Departments
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {departments.length}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </div>

          {/* Error Banner */}
          {(fetchError || actionError) && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{fetchError || actionError}</span>
            </div>
          )}

          {/* Toolbar: Search and Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white hover:border-slate-300 focus:border-indigo-500 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ×
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-700">{filteredDepartments.length}</span> of {departments.length} departments
            </div>
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="p-6 bg-white rounded-2xl border border-slate-200">
              <DataGridSkeleton rows={5} columns={3} />
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {searchQuery ? 'No matching departments' : 'No departments yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                {searchQuery 
                  ? `No department names or descriptions match "${searchQuery}".` 
                  : 'Get started by creating your organization’s first department.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Department</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-5">Department Name</th>
                      <th className="py-3.5 px-5">Description</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredDepartments.map((dept) => (
                      <tr 
                        key={dept.id} 
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs">
                              {dept.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {dept.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-mono font-semibold">
                                  {dept.displayId || `#${dept.id.slice(0, 8)}`}
                                </span>
                                {dept.alphaTags && dept.alphaTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {dept.alphaTags.map((tag) => (
                                      <span key={tag} className="px-1.5 py-0.2 text-[9px] font-bold font-mono rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-slate-600 max-w-md">
                          <p className="line-clamp-2 leading-relaxed">
                            {dept.description || <span className="text-slate-400 italic">No description provided</span>}
                          </p>
                        </td>

                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(dept)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Edit department"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteClick(dept.id, dept.name)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50/70 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Delete department"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit Department Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div 
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dept-modal-title"
            >
              {/* Modal Header */}
              <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h2 id="dept-modal-title" className="text-base font-bold text-slate-900">
                    {isEditing ? 'Edit Department' : 'Create Department'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {actionError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="dept-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="dept-name"
                    type="text"
                    placeholder="e.g. Engineering, Human Resources, IT"
                    value={formState.name}
                    onChange={(e) => setFormField('name', e.target.value)}
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="dept-desc" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="dept-desc"
                    placeholder="Briefly describe what this department manages or handles..."
                    value={formState.description}
                    onChange={(e) => setFormField('description', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100 leading-relaxed"
                  />
                </div>

                <div>
                  <label htmlFor="dept-tags" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Alpha Tags (Comma-separated)
                  </label>
                  <input
                    id="dept-tags"
                    type="text"
                    placeholder="e.g. AWS, GCP, IT, HR"
                    value={tagsInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTagsInput(val);
                      const parsed = val.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
                      setFormField('alphaTags', parsed);
                    }}
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Alpha tags serve as prefixes for Ticket Types (e.g. AWS-1). Admins select from these tags when configuring ticket types.
                  </p>
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formState.name.trim()}
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Department'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmDialog 
          open={!!confirmDelete} 
          onClose={() => setConfirmDelete(null)} 
          onConfirm={handleConfirmDelete} 
          title="Delete Department" 
          description={
            <>
              Are you sure you want to delete the department <strong>{confirmDelete?.name}</strong>? This action will remove the department and cannot be undone.
            </>
          } 
          loading={isDeleting} 
        />
      </div>
    </PrivilegeGate>
  );
};
