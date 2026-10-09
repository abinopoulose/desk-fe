import React, { useEffect, useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  X,
} from 'lucide-react';
import { DataGridSkeleton } from '../common/Skeletons';
import { slaApi } from '../../api/slaApi';
import type { SlaConfigDTO, CreateSlaConfigRequest } from '../../types/sla';
import {
  DAYS_OF_WEEK,
  PRIORITY_OPTIONS,
  RESOLUTION_PRESETS,
  formatResolutionTime,
} from '../../constants/slaConstants';

export interface SlaConfigSectionProps {
  ticketTypeId?: string;
  stagedConfigs?: CreateSlaConfigRequest[];
  onStagedConfigsChange?: (configs: CreateSlaConfigRequest[]) => void;
}

export const SlaConfigSection: React.FC<SlaConfigSectionProps> = ({
  ticketTypeId,
  stagedConfigs,
  onStagedConfigsChange,
}) => {
  const isCreateMode = !ticketTypeId;
  const [slaConfigs, setSlaConfigs] = useState<SlaConfigDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateSlaConfigRequest>({
    priority: 3,
    resolutionMinutes: 1440,
    workingDays: [1, 2, 3, 4, 5],
    workingHoursStart: '09:00:00',
    workingHoursEnd: '17:00:00',
    escalationHooks: null,
  });

  // Schedule preset state: 'standard' | '24_7' | 'custom'
  const [scheduleMode, setScheduleMode] = useState<'standard' | '24_7' | 'custom'>('standard');
  const [customHours, setCustomHours] = useState<number>(24);

  const loadSlas = () => {
    if (!ticketTypeId) return;
    setLoading(true);
    slaApi
      .getSlaConfigs(ticketTypeId)
      .then(setSlaConfigs)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (ticketTypeId) {
      loadSlas();
    }
  }, [ticketTypeId]);

  // Derive active items to display
  const activeItems: (SlaConfigDTO | (CreateSlaConfigRequest & { id: string }))[] = isCreateMode
    ? (stagedConfigs || []).map((c, i) => ({ ...c, id: `staged-${i}` }))
    : slaConfigs;

  const handleOpenForm = (item?: SlaConfigDTO | (CreateSlaConfigRequest & { id: string })) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        priority: item.priority,
        resolutionMinutes: item.resolutionMinutes,
        workingDays: item.workingDays || [1, 2, 3, 4, 5],
        workingHoursStart: item.workingHoursStart || '09:00:00',
        workingHoursEnd: item.workingHoursEnd || '17:00:00',
        escalationHooks: item.escalationHooks || null,
      });

      setCustomHours(Math.round(item.resolutionMinutes / 60));

      // Determine schedule mode
      const isMonFri =
        item.workingDays?.length === 5 && [1, 2, 3, 4, 5].every((d) => item.workingDays.includes(d));
      const is9to5 =
        item.workingHoursStart?.startsWith('09:00') && item.workingHoursEnd?.startsWith('17:00');
      const is24_7 =
        item.workingDays?.length === 7 &&
        item.workingHoursStart?.startsWith('00:00') &&
        (item.workingHoursEnd?.startsWith('23:59') || item.workingHoursEnd?.startsWith('24:00'));

      if (isMonFri && is9to5) {
        setScheduleMode('standard');
      } else if (is24_7) {
        setScheduleMode('24_7');
      } else {
        setScheduleMode('custom');
      }
    } else {
      const usedPriorities = activeItems.map((i) => i.priority);
      const nextPriority = [1, 2, 3, 4].find((p) => !usedPriorities.includes(p)) || 3;
      setEditingId(null);
      setFormData({
        priority: nextPriority,
        resolutionMinutes: 1440,
        workingDays: [1, 2, 3, 4, 5],
        workingHoursStart: '09:00:00',
        workingHoursEnd: '17:00:00',
        escalationHooks: null,
      });
      setScheduleMode('standard');
      setCustomHours(24);
    }
    setShowForm(true);
  };

  const handleScheduleModeChange = (mode: 'standard' | '24_7' | 'custom') => {
    setScheduleMode(mode);
    if (mode === 'standard') {
      setFormData({
        ...formData,
        workingDays: [1, 2, 3, 4, 5],
        workingHoursStart: '09:00:00',
        workingHoursEnd: '17:00:00',
      });
    } else if (mode === '24_7') {
      setFormData({
        ...formData,
        workingDays: [1, 2, 3, 4, 5, 6, 7],
        workingHoursStart: '00:00:00',
        workingHoursEnd: '23:59:00',
      });
    }
  };

  const handleDayToggle = (day: number) => {
    const current = formData.workingDays || [];
    if (current.includes(day)) {
      setFormData({ ...formData, workingDays: current.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, workingDays: [...current, day].sort() });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: CreateSlaConfigRequest = {
        priority: formData.priority,
        resolutionMinutes: formData.resolutionMinutes,
        workingDays: formData.workingDays,
        workingHoursStart: formData.workingHoursStart,
        workingHoursEnd: formData.workingHoursEnd,
        escalationHooks: null,
      };

      if (isCreateMode) {
        const currentStaged = stagedConfigs ? [...stagedConfigs] : [];
        if (editingId && editingId.startsWith('staged-')) {
          const idx = parseInt(editingId.replace('staged-', ''), 10);
          currentStaged[idx] = payload;
        } else {
          currentStaged.push(payload);
        }
        onStagedConfigsChange?.(currentStaged);
        setShowForm(false);
      } else {
        if (editingId) {
          await slaApi.updateSlaConfig(editingId, payload);
        } else if (ticketTypeId) {
          await slaApi.createSlaConfig(ticketTypeId, payload);
        }
        setShowForm(false);
        loadSlas();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save SLA policy. Please check settings.');
    }
  };

  const handleDelete = async (id: string, index?: number) => {
    if (!confirm('Are you sure you want to delete this SLA policy?')) return;
    try {
      if (isCreateMode) {
        const currentStaged = stagedConfigs ? [...stagedConfigs] : [];
        const targetIdx = index !== undefined ? index : parseInt(id.replace('staged-', ''), 10);
        currentStaged.splice(targetIdx, 1);
        onStagedConfigsChange?.(currentStaged);
      } else {
        await slaApi.deleteSlaConfig(id);
        loadSlas();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyDefaults = async () => {
    const defaultPolicies: CreateSlaConfigRequest[] = [
      {
        priority: 1, // Critical
        resolutionMinutes: 240, // 4 hours
        workingDays: [1, 2, 3, 4, 5],
        workingHoursStart: '09:00:00',
        workingHoursEnd: '17:00:00',
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
    ];

    if (isCreateMode) {
      onStagedConfigsChange?.(defaultPolicies);
    } else if (ticketTypeId) {
      setLoading(true);
      try {
        for (const policy of defaultPolicies) {
          await slaApi.createSlaConfig(ticketTypeId, policy);
        }
        loadSlas();
      } catch (err) {
        console.error('Error applying standard policies', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDays = (days: number[]) => {
    if (!days || days.length === 0) return 'No days set';
    if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) {
      return 'Mon – Fri (Standard Workweek)';
    }
    if (days.length === 7) {
      return 'Every Day (Mon – Sun)';
    }
    return days
      .slice()
      .sort()
      .map((d) => DAYS_OF_WEEK.find((dw) => dw.value === d)?.short)
      .join(', ');
  };

  const formatHours = (start?: string, end?: string) => {
    if (!start || !end) return 'Not configured';
    const s = start.substring(0, 5);
    const e = end.substring(0, 5);
    return `${s} – ${e}`;
  };

  // Determine if current resolution time matches a preset
  const isPresetSelected = RESOLUTION_PRESETS.some(
    (p) => p.minutes === formData.resolutionMinutes
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Target Resolution Policies</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure expected resolution times and working schedules for each priority level.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeItems.length === 0 && (
            <button
              type="button"
              onClick={handleApplyDefaults}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Apply Standard SLAs</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add SLA Policy</span>
          </button>
        </div>
      </div>

      {loading ? (
        <DataGridSkeleton rows={3} columns={4} />
      ) : activeItems.length === 0 ? (
        <div className="bg-slate-50/60 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No SLA policies defined yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-5">
            Setting SLA targets ensures tickets are resolved on time based on employee urgency.
          </p>
          <button
            type="button"
            onClick={handleApplyDefaults}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply 4 Standard SLA Defaults (Critical: 4h, High: 8h, Medium: 24h, Low: 48h)</span>
          </button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Priority Level</th>
                  <th className="py-3.5 px-5">Target Resolution Time</th>
                  <th className="py-3.5 px-5">Working Days</th>
                  <th className="py-3.5 px-5">Working Hours</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {activeItems
                  .slice()
                  .sort((a, b) => a.priority - b.priority)
                  .map((config, index) => {
                    const priorityMeta =
                      PRIORITY_OPTIONS.find((p) => p.value === config.priority) ||
                      PRIORITY_OPTIONS[2];

                    return (
                      <tr key={config.id || index} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${priorityMeta.badgeClass}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${priorityMeta.dotClass}`} />
                            <span>
                              {priorityMeta.name} ({priorityMeta.code})
                            </span>
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <div className="font-semibold text-slate-900">
                            {formatResolutionTime(config.resolutionMinutes)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {config.resolutionMinutes} minutes target
                          </div>
                        </td>

                        <td className="py-4 px-5 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDays(config.workingDays)}</span>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatHours(config.workingHoursStart, config.workingHoursEnd)}</span>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenForm(config)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(config.id, index)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SIMPLIFIED Add/Edit Modal (Clean, compact, no overwhelming boxes) */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingId ? 'Edit SLA Policy' : 'Add SLA Policy'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Set resolution target time and work schedule
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Simple 3 Fields */}
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* 1. Priority Selection (Simple horizontal pill buttons) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Priority Level <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITY_OPTIONS.map((p) => {
                    const isSelected = formData.priority === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p.value })}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-100 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${p.dotClass} shrink-0`} />
                        <span className="truncate">
                          {p.name} ({p.code})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Target Resolution Time (Single clean dropdown + custom input if needed) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Target Resolution Time <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-indigo-600">
                    {formatResolutionTime(formData.resolutionMinutes)}
                  </span>
                </div>

                <select
                  value={isPresetSelected ? formData.resolutionMinutes : 'custom'}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setFormData({ ...formData, resolutionMinutes: customHours * 60 });
                    } else {
                      const mins = parseInt(e.target.value, 10);
                      setFormData({ ...formData, resolutionMinutes: mins });
                      setCustomHours(Math.round(mins / 60));
                    }
                  }}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none cursor-pointer"
                >
                  {RESOLUTION_PRESETS.map((preset) => (
                    <option key={preset.minutes} value={preset.minutes}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="custom">Custom Hours...</option>
                </select>

                {/* Custom Hours Input (only shown when custom option chosen) */}
                {!isPresetSelected && (
                  <div className="mt-2 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500">Custom target:</span>
                    <input
                      type="number"
                      min="1"
                      value={customHours}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                        setCustomHours(val);
                        setFormData({ ...formData, resolutionMinutes: val * 60 });
                      }}
                      className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-center font-bold outline-none"
                    />
                    <span className="text-xs text-slate-600">hours</span>
                  </div>
                )}
              </div>

              {/* 3. Working Schedule (Clean 2-choice selector with optional custom expand) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Working Schedule <span className="text-rose-500">*</span>
                </label>

                <select
                  value={scheduleMode}
                  onChange={(e) =>
                    handleScheduleModeChange(e.target.value as 'standard' | '24_7' | 'custom')
                  }
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none cursor-pointer"
                >
                  <option value="standard">Mon – Fri, 9:00 AM – 5:00 PM (Standard Business Hours)</option>
                  <option value="24_7">Every Day, 24/7 Coverage (Around the Clock)</option>
                  <option value="custom">Custom Days & Hours...</option>
                </select>

                {/* Custom schedule details (only visible if user specifically selects custom) */}
                {scheduleMode === 'custom' && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Active Days:
                      </span>
                      <div className="grid grid-cols-7 gap-1">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = (formData.workingDays || []).includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => handleDayToggle(day.value)}
                              className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all text-center cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {day.short}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Start Time</span>
                        <input
                          type="time"
                          value={formData.workingHoursStart?.substring(0, 5) || '09:00'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              workingHoursStart: `${e.target.value}:00`,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">End Time</span>
                        <input
                          type="time"
                          value={formData.workingHoursEnd?.substring(0, 5) || '17:00'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              workingHoursEnd: `${e.target.value}:00`,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingId ? 'Update Policy' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
