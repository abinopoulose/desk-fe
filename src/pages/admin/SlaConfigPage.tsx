import React, { useEffect, useState } from 'react';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { ticketTypeApi } from '../../api/ticketTypeApi';
import { slaApi } from '../../api/slaApi';
import type { TicketTypeSummaryDTO } from '../../types/ticket';
import type { SlaConfigDTO, CreateSlaConfigRequest } from '../../types/sla';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

export const SlaConfigPage: React.FC = () => {
  const [ticketTypes, setTicketTypes] = useState<TicketTypeSummaryDTO[]>([]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>('');
  const [slaConfigs, setSlaConfigs] = useState<SlaConfigDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateSlaConfigRequest>({
    priority: 1,
    resolutionMinutes: 60,
    workingDays: [1, 2, 3, 4, 5],
    workingHoursStart: '09:00:00',
    workingHoursEnd: '17:00:00',
    escalationHooks: null,
  });
  const [hooksJson, setHooksJson] = useState('{}');

  useEffect(() => {
    ticketTypeApi.getTicketTypes().then((types) => {
      setTicketTypes(types);
      if (types.length > 0) {
        setSelectedTicketTypeId(types[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedTicketTypeId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    slaApi.getSlaConfigs(selectedTicketTypeId)
      .then(setSlaConfigs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedTicketTypeId]);

  const loadSlas = () => {
    if (!selectedTicketTypeId) return;
    slaApi.getSlaConfigs(selectedTicketTypeId).then(setSlaConfigs).catch(console.error);
  };

  const handleOpenForm = (config?: SlaConfigDTO) => {
    if (config) {
      setEditingId(config.id);
      setFormData({
        priority: config.priority,
        resolutionMinutes: config.resolutionMinutes,
        workingDays: config.workingDays || [],
        workingHoursStart: config.workingHoursStart,
        workingHoursEnd: config.workingHoursEnd,
        escalationHooks: config.escalationHooks,
      });
      setHooksJson(config.escalationHooks ? JSON.stringify(config.escalationHooks, null, 2) : '{}');
    } else {
      setEditingId(null);
      setFormData({
        priority: 1,
        resolutionMinutes: 60,
        workingDays: [1, 2, 3, 4, 5],
        workingHoursStart: '09:00:00',
        workingHoursEnd: '17:00:00',
        escalationHooks: null,
      });
      setHooksJson('{}');
    }
    setShowForm(true);
  };

  const handleDayToggle = (day: number) => {
    setFormData((prev) => {
      const days = prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: days };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketTypeId) return;
    try {
      let parsedHooks = null;
      if (hooksJson && hooksJson.trim() !== '') {
        parsedHooks = JSON.parse(hooksJson);
      }
      const dataToSave = { ...formData, escalationHooks: parsedHooks };
      
      // format time properly (append :00 if missing)
      if (dataToSave.workingHoursStart.split(':').length === 2) {
        dataToSave.workingHoursStart += ':00';
      }
      if (dataToSave.workingHoursEnd.split(':').length === 2) {
        dataToSave.workingHoursEnd += ':00';
      }

      if (editingId) {
        await slaApi.updateSlaConfig(editingId, dataToSave);
      } else {
        await slaApi.createSlaConfig(selectedTicketTypeId, dataToSave);
      }
      setShowForm(false);
      loadSlas();
    } catch (err) {
      console.error(err);
      alert('Failed to save SLA config. Check JSON format and required fields.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SLA rule?')) return;
    try {
      await slaApi.deleteSlaConfig(id);
      loadSlas();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDays = (days: number[]) => {
    if (!days || days.length === 0) return 'None';
    return days.sort().map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.label.substring(0, 3)).join(', ');
  };

  return (
    <PrivilegeGate requiredPrivilege="SLA_WRITE">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SLA Configuration</h1>
          <button
            onClick={() => handleOpenForm()}
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
                {slaConfigs.map((config) => (
                  <tr key={config.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{config.priority}</td>
                    <td className="p-4 text-gray-600">{config.resolutionMinutes}</td>
                    <td className="p-4 text-gray-600">{formatDays(config.workingDays)}</td>
                    <td className="p-4 text-gray-600">
                      {config.workingHoursStart} - {config.workingHoursEnd}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenForm(config)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {slaConfigs.length === 0 && (
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
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border p-2 rounded"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Resolution Minutes</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border p-2 rounded"
                    value={formData.resolutionMinutes}
                    onChange={(e) => setFormData({ ...formData, resolutionMinutes: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Working Days</label>
                  <div className="flex flex-wrap gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <label key={day.value} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formData.workingDays.includes(day.value)}
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
                      value={formData.workingHoursStart}
                      onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      step="1"
                      className="w-full border p-2 rounded"
                      value={formData.workingHoursEnd}
                      onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Escalation Hooks (JSON)</label>
                  <textarea
                    className="w-full border p-2 rounded h-24 font-mono text-sm"
                    value={hooksJson}
                    onChange={(e) => setHooksJson(e.target.value)}
                    placeholder="{}"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
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
