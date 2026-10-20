import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Shield, 
  AlertCircle, 
  X, 
  Check, 
  Lock,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { DataGridSkeleton } from '../../components/common/Skeletons';
import { useRoles } from '../../hooks';
import { PERMISSION_LABELS } from '../../constants';
import type { RoleDTO } from '../../types/role';

interface PermissionGroup {
  id: string;
  title: string;
  permissions: string[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'simplified_privileges',
    title: 'Privileges',
    permissions: [
      'USER_EDIT',
      'TICKET_TYPE_EDIT',
      'DEPARTMENT_EDIT',
      'ROLE_EDIT',
    ],
  },
];

function parsePermissionLabel(priv: string): { title: string; desc: string | null } {
  const raw = PERMISSION_LABELS[priv] || priv;
  const match = raw.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return { title: match[1].trim(), desc: match[2].trim() };
  }
  return { title: raw, desc: null };
}

export const RoleAdminPage: React.FC = () => {
  const {
    roles,
    loading,
    error,
    formState,
    setFormField,
    togglePermission,
    isEditing,
    isModalOpen,
    startEdit,
    cancelEdit,
    save,
    remove,
  } = useRoles({ autoFetch: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase().trim();
    return roles.filter(
      (r) =>
        r.roleName.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.privileges && r.privileges.some((p) => p.toLowerCase().includes(q)))
    );
  }, [roles, searchQuery]);

  const handleDeleteClick = (roleName: string) => {
    setConfirmDelete(roleName);
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

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);
    try {
      const result = await save(e);
      if (!result) {
        setModalError('Failed to save role. Please check your inputs.');
      }
    } catch (err: unknown) {
      console.error('Save failed', err);
      setModalError('Failed to save role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group permission helpers
  const handleToggleGroup = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every((p) => formState.permissions.includes(p));
    let nextPermissions: string[];
    if (allSelected) {
      nextPermissions = formState.permissions.filter((p) => !groupPermissions.includes(p));
    } else {
      const added = groupPermissions.filter((p) => !formState.permissions.includes(p));
      nextPermissions = [...formState.permissions, ...added];
    }
    setFormField('permissions', nextPermissions);
  };

  const displayGroups = useMemo(() => {
    const basePerms = PERMISSION_GROUPS[0].permissions;
    const extraPerms = formState.permissions.filter((p) => !basePerms.includes(p as any));
    const combined = [...basePerms, ...extraPerms];
    return [
      {
        id: 'simplified_privileges',
        title: 'Privileges',
        permissions: combined,
      },
    ];
  }, [formState.permissions]);

  const totalPermCount = displayGroups[0].permissions.length;

  const handleSelectAllPermissions = () => {
    const all = displayGroups.flatMap((g) => g.permissions);
    setFormField('permissions', Array.from(new Set(all)));
  };

  const handleClearAllPermissions = () => {
    setFormField('permissions', []);
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8">
      <div className="w-full space-y-6">
        
        {/* Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Roles & Permissions
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {roles.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure security roles, access policies, and granular system privileges
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setModalError(null);
              startEdit();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search roles or privileges..."
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
            Showing <span className="font-semibold text-slate-700">{filteredRoles.length}</span> of {roles.length} roles
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="p-6 bg-white rounded-2xl border border-slate-200">
            <DataGridSkeleton rows={5} columns={4} />
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {searchQuery ? 'No matching roles' : 'No roles created'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4">
              {searchQuery 
                ? `No role names, descriptions, or privileges match "${searchQuery}".` 
                : 'Define roles to control what your employees and administrators can access.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => startEdit()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Role</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-5">Role Name</th>
                    <th className="py-3.5 px-5">Description</th>
                    <th className="py-3.5 px-5">Assigned Privileges</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRoles.map((role: RoleDTO) => {
                    const privCount = role.privileges?.length || 0;
                    const isSuperAdmin = role.privileges?.includes('ADMIN_FULL_ACCESS');
                    return (
                      <tr 
                        key={role.id || role.roleName} 
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <Shield className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {role.roleName}
                                </span>
                                {isSuperAdmin && (
                                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-bold">
                                    Admin
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-slate-600 max-w-xs">
                          <p className="line-clamp-2 leading-relaxed">
                            {role.description || <span className="text-slate-400 italic">No description</span>}
                          </p>
                        </td>

                        <td className="py-4 px-5 max-w-md">
                          <div className="flex flex-wrap items-center gap-1">
                            {role.privileges?.slice(0, 4).map((priv) => (
                              <span 
                                key={priv} 
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-md border border-slate-200/70 truncate max-w-[150px]"
                                title={PERMISSION_LABELS[priv] || priv}
                              >
                                {PERMISSION_LABELS[priv] || priv}
                              </span>
                            ))}
                            {privCount > 4 && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-md border border-indigo-100">
                                +{privCount - 4} more
                              </span>
                            )}
                            {privCount === 0 && (
                              <span className="text-slate-400 text-xs italic">
                                No privileges assigned
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setModalError(null);
                                startEdit(role);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Edit role"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteClick(role.roleName)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50/70 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Delete role"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create / Edit Role Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-150">
            <div 
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="role-modal-title"
            >
              {/* Modal Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 id="role-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                      {isEditing ? `Edit Role: ${formState.name}` : 'Create New Role'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isEditing ? 'Modify permissions and role description' : 'Define name, purpose, and system privileges'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveRole} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                  {modalError && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{modalError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="roleName" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Role Identifier <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="roleName"
                        type="text"
                        placeholder="e.g. TIER_1_SUPPORT"
                        value={formState.name}
                        onChange={(e) => setFormField('name', e.target.value)}
                        disabled={isEditing}
                        className="w-full bg-slate-50/70 hover:bg-white focus:bg-white disabled:bg-slate-100 disabled:text-slate-500 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                        required
                        autoFocus={!isEditing}
                      />
                      {isEditing ? (
                        <span className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          Role identifiers cannot be renamed once created
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Unique system identifier (e.g. COMPLIANCE_OFFICER, TIER_1_SUPPORT)
                        </span>
                      )}
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Description
                      </label>
                      <input
                        id="description"
                        type="text"
                        placeholder="e.g. Handles initial triage and customer queries"
                        value={formState.description}
                        onChange={(e) => setFormField('description', e.target.value)}
                        className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  {/* Permissions Selection Header */}
                  <div className="pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                          Role Privileges ({formState.permissions.length} of {totalPermCount})
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Select the specific operations and capabilities this role is allowed to perform
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={handleSelectAllPermissions}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={handleClearAllPermissions}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Categorized Permission Groups */}
                    <div className="space-y-4 mt-4">
                      {displayGroups.map((group) => {
                        const groupActiveCount = group.permissions.filter((p) => formState.permissions.includes(p)).length;
                        const isAllSelected = groupActiveCount === group.permissions.length;

                        return (
                          <div key={group.id} className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/60">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                                <Layers className="w-4 h-4 text-indigo-500" />
                                {group.title}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleToggleGroup(group.permissions)}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1.5"
                              >
                                {isAllSelected ? (
                                  <>
                                    <Square className="w-3.5 h-3.5" />
                                    <span>Deselect Group</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    <span>Select Group</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="flex flex-col gap-2.5">
                              {group.permissions.map((priv) => {
                                const isChecked = formState.permissions.includes(priv);
                                const { title, desc } = parsePermissionLabel(priv);
                                return (
                                  <label
                                    key={priv}
                                    className={`w-full flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                      isChecked
                                        ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-500/20 text-indigo-950 shadow-2xs'
                                        : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => togglePermission(priv)}
                                      className="w-4 h-4 mt-0.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 shrink-0 cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                                          {title}
                                        </span>
                                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/70">
                                          {priv}
                                        </span>
                                      </div>
                                      {desc && (
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                          {desc}
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Modal Action Footer */}
                <div className="p-4 sm:p-5 px-6 sm:px-8 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/70 shrink-0">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formState.name.trim()}
                    className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Role'}</span>
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
          title="Delete Role" 
          description={
            <>
              Are you sure you want to delete the role <strong>{confirmDelete}</strong>? Any users assigned this role will lose its permissions.
            </>
          } 
          loading={isDeleting} 
        />
      </div>
    </div>
  );
};
