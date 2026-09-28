import React, { useEffect, useState } from 'react';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { getAllRoles, createRole, assignRoles, getUserRoles } from '../../api/roleApi';
import { getAllUsers } from '../../api/userApi';
import type { RoleDTO } from '../../types/role';
import type { UserSummaryDTO } from '../../types/user';

const AVAILABLE_PRIVILEGES = [
  'USER_READ', 'USER_WRITE', 'USER_DELETE',
  'ROLE_READ', 'ROLE_WRITE',
  'TICKET_READ', 'TICKET_WRITE', 'TICKET_DELETE', 'TICKET_MANAGEMENT',
  'TICKET_TYPE_READ', 'TICKET_TYPE_WRITE', 'TICKET_TYPE_DELETE',
  'DEPARTMENT_READ', 'DEPARTMENT_WRITE', 'DEPARTMENT_DELETE',
  'FOLDER_READ', 'FOLDER_WRITE', 'FOLDER_DELETE',
  'SLA_READ', 'SLA_WRITE',
  'METRICS_READ',
  'AUDIT_READ',
  'ADMIN_FULL_ACCESS'
];

export const RoleAdminPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [users, setUsers] = useState<UserSummaryDTO[]>([]);
  
  const [loadingRoles, setLoadingRoles] = useState(true);
  
  // Create Role state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedPrivileges, setSelectedPrivileges] = useState<string[]>([]);
  
  // Assign Role state
  const [selectedUser, setSelectedUser] = useState<UserSummaryDTO | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const data = await getAllRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to load users', error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRoles();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsers();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRole({ roleName: newRoleName, privileges: selectedPrivileges });
      setIsRoleModalOpen(false);
      setNewRoleName('');
      setSelectedPrivileges([]);
      loadRoles();
    } catch (error) {
      console.error('Failed to create role', error);
      alert('Failed to create role');
    }
  };

  const togglePrivilege = (privilege: string) => {
    setSelectedPrivileges(prev => 
      prev.includes(privilege) 
        ? prev.filter(p => p !== privilege)
        : [...prev, privilege]
    );
  };

  const openAssignModal = async (user: UserSummaryDTO) => {
    setSelectedUser(user);
    try {
      const roles = await getUserRoles(user.id);
      setUserRoles(roles);
      setIsAssignModalOpen(true);
    } catch (error) {
      console.error('Failed to load user roles', error);
      alert('Failed to load user roles');
    }
  };

  const handleAssignRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await assignRoles(selectedUser.id, userRoles);
      setIsAssignModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to assign roles', error);
      alert('Failed to assign roles');
    }
  };

  const toggleUserRole = (roleName: string) => {
    setUserRoles(prev => 
      prev.includes(roleName)
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    );
  };

  return (
    <PrivilegeGate requiredPrivilege="ROLE_WRITE">
      <div className="p-6">
        
        {/* Role Management Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Role Management</h1>
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Create Role
            </button>
          </div>

          {loadingRoles ? (
            <div>Loading roles...</div>
          ) : (
            <div className="bg-white rounded shadow overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-medium text-gray-600">Role Name</th>
                    <th className="p-4 font-medium text-gray-600">Privileges</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id || role.roleName} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{role.roleName}</td>
                      <td className="p-4 text-gray-600">
                        <div className="flex flex-wrap gap-1">
                          {role.privileges.map(priv => (
                            <span key={priv} className="px-2 py-1 bg-gray-100 text-xs rounded">
                              {priv}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {roles.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-gray-500">
                        No roles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Role Assignment Section */}
        <div>
          <h2 className="text-xl font-bold mb-6">User Role Assignment</h2>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-medium text-gray-600">User Name</th>
                  <th className="p-4 font-medium text-gray-600">Email</th>
                  <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{user.fullName}</td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openAssignModal(user)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Manage Roles
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Role Modal */}
        {isRoleModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
              <h2 className="text-xl font-bold mb-4">Create Role</h2>
              <form onSubmit={handleCreateRole} className="flex flex-col flex-1 min-h-0">
                <div className="mb-4">
                  <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input
                    id="roleName"
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div className="mb-4 flex-1 overflow-y-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Privileges</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_PRIVILEGES.map(priv => (
                      <label key={priv} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedPrivileges.includes(priv)}
                          onChange={() => togglePrivilege(priv)}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm">{priv}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsRoleModalOpen(false)}
                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Roles Modal */}
        {isAssignModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Assign Roles for {selectedUser.fullName}</h2>
              <form onSubmit={handleAssignRoles}>
                <div className="mb-6 max-h-64 overflow-y-auto">
                  {roles.map(role => (
                    <label key={role.id || role.roleName} className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={userRoles.includes(role.roleName)}
                        onChange={() => toggleUserRole(role.roleName)}
                        className="rounded text-blue-600"
                      />
                      <span>{role.roleName}</span>
                    </label>
                  ))}
                  {roles.length === 0 && <div className="text-gray-500">No roles available</div>}
                </div>
                <div className="flex justify-end space-x-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PrivilegeGate>
  );
};
