/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { useTenantConfig } from '../../hooks/useTenantConfig';

export const TenantConfigPage: React.FC = () => {
  const { config, loading, saving, error, updateConfig } = useTenantConfig();
  
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [superAdminEmail, setSuperAdminEmail] = useState<string>('');
  const [newDomain, setNewDomain] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (config) {
      setAllowedDomains(config.allowedDomains || []);
      setSuperAdminEmail(config.superAdminEmail || '');
    }
  }, [config]);

  const handleAddDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    if (domain && !allowedDomains.includes(domain)) {
      setAllowedDomains([...allowedDomains, domain]);
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setAllowedDomains(allowedDomains.filter((d) => d !== domainToRemove));
  };

  const handleSaveClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    await updateConfig({
      allowedDomains,
      superAdminEmail,
    });
  };

  if (error) {
    return (
      <PrivilegeGate requiredPrivilege="TENANT_MANAGE">
        <div className="p-6 max-w-4xl mx-auto text-red-600">{error}</div>
      </PrivilegeGate>
    );
  }

  return (
    <PrivilegeGate requiredPrivilege="TENANT_MANAGE">
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Tenant Configuration</h1>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded shadow p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Super Admin Email</label>
              <input
                type="email"
                className="w-full border p-2 rounded"
                value={superAdminEmail}
                onChange={(e) => setSuperAdminEmail(e.target.value)}
                placeholder="admin@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                The primary email address for the tenant super administrator.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Email Domains</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  className="flex-1 border p-2 rounded"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="e.g., company.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDomain();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddDomain}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium"
                >
                  Add Domain
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {allowedDomains.length === 0 && (
                  <span className="text-gray-500 text-sm">No domains allowed.</span>
                )}
                {allowedDomains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {domain}
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(domain)}
                      className="text-blue-600 hover:text-blue-900 focus:outline-none"
                      aria-label={`Remove ${domain}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Users can only sign in if their email domain is listed here.
              </p>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={handleSaveClick}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        )}

        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
              <h2 className="text-lg font-bold mb-4 text-red-600">Warning</h2>
              <p className="text-gray-700 mb-6">
                Modifying allowed domains can lock users out of the system. Are you sure you want to save these changes?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Yes, Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PrivilegeGate>
  );
};
