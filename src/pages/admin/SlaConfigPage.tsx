import React from 'react';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { DAYS_OF_WEEK } from '../../constants';
import { useSlaConfigs } from '../../hooks';

export const SlaConfigPage: React.FC = () => {
  const {
    configs,
    loading,
    error,
    validationErrors,
    formState,
    setFormField,
    handleDayToggle,
    editingId,
    showForm,
    startEdit,
    cancelEdit,
    save,
    remove,
    ticketTypes,
    selectedTicketTypeId,
    setSelectedTicketTypeId,
  } = useSlaConfigs();

  const formatDays = (days: number[]) => {
    if (!days || days.length === 0) return 'None';
    return [...days]
      .sort((a, b) => a - b)
      .map((d) => DAYS_OF_WEEK.find((dw) => dw.value === d)?.label.substring(0, 3))
      .filter(Boolean)
      .join(', ');
  };

  return (
    <PrivilegeGate requiredPrivilege="SLA_WRITE">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SLA Configuration</h1>
          <button
            onClick={() => startEdit()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            disabled={!selectedTicketTypeId}
          >
            Add SLA Rule
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Ticket Type</label>
          <select
            className="border p-2 rounded w-full max-w-md"
            value={selectedTicketTypeId}
            onChange={(e) => setSelectedTicketTypeId(e.target.value)}
          >
            {ticketTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-medium text-gray-600">Priority</th>
                  <th className="p-4 font-medium text-gray-600">Resolution Minutes</th>
                  <th className="p-4 font-medium text-gray-600">Working Days</th>
                  <th className="p-4 font-medium text-gray-600">Working Hours</th>
                  <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((config) => (
                  <tr key={config.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{config.priority}</td>
                    <td className="p-4 text-gray-600">{config.resolutionMinutes}</td>
                    <td className="p-4 text-gray-600">{formatDays(config.workingDays)}</td>
                    <td className="p-4 text-gray-600">
                      {config.workingHoursStart} - {config.workingHoursEnd}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => startEdit(config)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(config.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {configs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No SLA rules found for this ticket type.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit SLA Rule' : 'Add SLA Rule'}</h2>
              <form onSubmit={save} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border p-2 rounded"
                    value={formState.priority || ''}
                    onChange={(e) => setFormField('priority', e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                    required
                  />
                  {validationErrors.priority && (
                    <span className="text-sm text-red-600">{validationErrors.priority}</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Resolution Minutes</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border p-2 rounded"
                    value={formState.resolutionMinutes || ''}
                    onChange={(e) => setFormField('resolutionMinutes', e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                    required
                  />
                  {validationErrors.resolutionMinutes && (
                    <span className="text-sm text-red-600">{validationErrors.resolutionMinutes}</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Working Days</label>
                  <div className="flex flex-wrap gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <label key={day.value} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formState.workingDays.includes(day.value)}
                          onChange={() => handleDayToggle(day.value)}
                        />
                        <span className="text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      step="1"
                      className="w-full border p-2 rounded"
                      value={formState.workingHoursStart}
                      onChange={(e) => setFormField('workingHoursStart', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      step="1"
                      className="w-full border p-2 rounded"
                      value={formState.workingHoursEnd}
                      onChange={(e) => setFormField('workingHoursEnd', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Escalation Hooks (JSON)</label>
                  <textarea
                    className="w-full border p-2 rounded h-24 font-mono text-sm"
                    value={formState.hooksJson}
                    onChange={(e) => setFormField('hooksJson', e.target.value)}
                    placeholder="{}"
                  />
                  {validationErrors.hooksJson && (
                    <span className="text-sm text-red-600">{validationErrors.hooksJson}</span>
                  )}
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
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
