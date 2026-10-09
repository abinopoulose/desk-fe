import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { DataGridSkeleton } from '../../components/common/Skeletons';
import React from 'react';
import { useRoles } from '../../hooks';
import { AVAILABLE_PERMISSIONS, PERMISSION_LABELS } from '../../constants';

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

  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteClick = (roleName: string) => {
    setConfirmDelete(roleName);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await remove(confirmDelete, true); // true to skip confirm in hook
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  return (
    <>
    <div className="p-6">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Role Admin Page</h1>
        <button
          onClick={() => startEdit()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          Create Role
        </button>
        
    </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
          
    </div>
      )}

      {loading ? (
        <div className="p-6"><DataGridSkeleton rows={5} columns={4} /></div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-600">Role Name</th>
                <th className="p-4 font-medium text-gray-600">Description</th>
                <th className="p-4 font-medium text-gray-600">Privileges</th>
                <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id || role.roleName} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{role.roleName}</td>
                  <td className="p-4 text-gray-600">{role.description || '-'}</td>
                  <td className="p-4 text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {role.privileges.map((priv) => (
                        <span key={priv} className="px-2 py-1 bg-gray-100 text-xs rounded">
                          {(PERMISSION_LABELS[priv] || priv).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      ))}
                      
    </div>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => startEdit(role)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(role.roleName)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
    </div>
      )}

      {/* Create / Edit Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? 'Edit Role' : 'Create Role'}
            </h2>
            <form onSubmit={save} className="flex flex-col flex-1 min-h-0">
              <div className="mb-4">
                <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name *
                </label>
                <input
                  id="roleName"
                  type="text"
                  value={formState.name}
                  onChange={(e) => setFormField('name', e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                  disabled={isEditing}
                />
                
    </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  id="description"
                  type="text"
                  value={formState.description}
                  onChange={(e) => setFormField('description', e.target.value)}
                  className="w-full border p-2 rounded"
                />
                
    </div>
              <div className="mb-4 flex-1 overflow-y-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Privileges / Permissions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_PERMISSIONS.map((priv) => (
                    <label key={priv} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formState.permissions.includes(priv)}
                        onChange={() => togglePermission(priv)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">
                        {(PERMISSION_LABELS[priv] || priv).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                  
    </div>
                
    </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  {isEditing ? 'Update Role' : 'Save Role'}
                </button>
                
    </div>
            </form>
            
    </div>
          
    </div>
      )}
      
    </div>
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleConfirmDelete} title="Delete Role" description={<>Are you sure you want to delete the role <strong>{confirmDelete}</strong>? This action cannot be undone.</>} loading={isDeleting} />
  </>
  );
};
