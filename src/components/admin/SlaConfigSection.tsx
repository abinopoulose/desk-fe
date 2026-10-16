import React, { useEffect, useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { DataGridSkeleton } from '../common/Skeletons';
import { slaApi } from '../../api/slaApi';
import type { SlaConfigDTO, CreateSlaConfigRequest } from '../../types/sla';
import {
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
  const [editingPriority, setEditingPriority] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateSlaConfigRequest>({
    priority: 3,
    resolutionMinutes: 1440,
    workingDays: [1, 2, 3, 4, 5],
    workingHoursStart: '09:00:00',
    workingHoursEnd: '17:00:00',
    escalationHooks: null,
  });

  // Schedule preset state: 'standard' | '24_7'
  const [scheduleMode, setScheduleMode] = useState<'standard' | '24_7'>('standard');
  const [customHours, setCustomHours] = useState<number | string>(24);
  const [isCustomResolution, setIsCustomResolution] = useState(false);

  const loadSlas = () => {
    if (!ticketTypeId) return;
    setLoading(true);
    slaApi
      .getSlaConfigs(ticketTypeId)
      .then(setSlaConfigs)
      .catch((err) => {
        console.error('Failed to load SLA configs', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (ticketTypeId) {
      loadSlas();
    }
  }, [ticketTypeId]);

  // Derive active items to display
  const activeItems: (SlaConfigDTO | (CreateSlaConfigRequest & { id: string }))[] = isCreateMode
    ? (stagedConfigs || []).map((c) => ({ ...c, id: `staged-${c.priority}` }))
    : slaConfigs;

  const usedPriorities = activeItems.map((i) => i.priority);
  const allPrioritiesConfigured = [1, 2, 3, 4].every((p) => usedPriorities.includes(p));

  const handleOpenForm = (item?: SlaConfigDTO | (CreateSlaConfigRequest & { id: string })) => {
    setFormError(null);
    if (item) {
      setEditingId(item.id);
      setEditingPriority(item.priority);
      setFormData({
        priority: item.priority,
        resolutionMinutes: item.resolutionMinutes,
        workingDays: item.workingDays || [1, 2, 3, 4, 5],
        workingHoursStart: item.workingHoursStart || '09:00:00',
        workingHoursEnd: item.workingHoursEnd || '17:00:00',
        escalationHooks: item.escalationHooks || null,
      });

      const isPreset = RESOLUTION_PRESETS.some((p) => p.minutes === item.resolutionMinutes);
      setIsCustomResolution(!isPreset);
      setCustomHours(Math.max(1, Math.round(item.resolutionMinutes / 60)));

      // Determine schedule mode
      const is24_7 =
        item.workingDays?.length === 7 &&
        item.workingHoursStart?.startsWith('00:00') &&
        (item.workingHoursEnd?.startsWith('23:59') || item.workingHoursEnd?.startsWith('24:00'));

      setScheduleMode(is24_7 ? '24_7' : 'standard');
    } else {
      const nextPriority = [1, 2, 3, 4].find((p) => !usedPriorities.includes(p)) || 3;
      setEditingId(null);
      setEditingPriority(null);
      setFormData({
        priority: nextPriority,
        resolutionMinutes: nextPriority === 1 ? 240 : nextPriority === 2 ? 480 : nextPriority === 3 ? 1440 : 2880,
        workingDays: [1, 2, 3, 4, 5],
        workingHoursStart: '09:00:00',
        workingHoursEnd: '17:00:00',
        escalationHooks: null,
      });
      setScheduleMode('standard');
      setIsCustomResolution(false);
      setCustomHours(nextPriority === 1 ? 4 : nextPriority === 2 ? 8 : nextPriority === 3 ? 24 : 48);
    }
    setShowForm(true);
  };

  const handleScheduleModeChange = (mode: 'standard' | '24_7') => {
    setScheduleMode(mode);
    if (mode === 'standard') {
      setFormData((prev) => ({
        ...prev,
        workingDays: [1, 2, 3, 4, 5],
        workingHoursStart: '09:00:00',
        workingHoursEnd: '17:00:00',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        workingDays: [1, 2, 3, 4, 5, 6, 7],
        workingHoursStart: '00:00:00',
        workingHoursEnd: '23:59:00',
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    const finalResolutionMinutes = isCustomResolution
      ? Math.max(1, (parseInt(String(customHours), 10) || 1) * 60)
      : formData.resolutionMinutes;

    try {
      const payload: CreateSlaConfigRequest = {
        priority: formData.priority,
        resolutionMinutes: finalResolutionMinutes,
        workingDays: scheduleMode === '24_7' ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5],
        workingHoursStart: scheduleMode === '24_7' ? '00:00:00' : '09:00:00',
        workingHoursEnd: scheduleMode === '24_7' ? '23:59:00' : '17:00:00',
        escalationHooks: null,
      };

      if (isCreateMode) {
        let currentStaged = stagedConfigs ? [...stagedConfigs] : [];
        if (editingPriority !== null) {
          // Editing existing staged item
          currentStaged = currentStaged.map((c) => (c.priority === editingPriority ? payload : c));
        } else {
          // Adding new: check if already exists
          const existingIdx = currentStaged.findIndex((c) => c.priority === payload.priority);
          if (existingIdx >= 0) {
            currentStaged[existingIdx] = payload;
          } else {
            currentStaged.push(payload);
          }
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
    } catch (err: unknown) {
      console.error(err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save SLA policy. Please check settings.';
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: SlaConfigDTO | (CreateSlaConfigRequest & { id: string })) => {
    if (!confirm('Are you sure you want to delete this SLA policy?')) return;
    try {
      if (isCreateMode) {
        const currentStaged = stagedConfigs ? [...stagedConfigs] : [];
        const nextStaged = currentStaged.filter((c) => c.priority !== item.priority);
        onStagedConfigsChange?.(nextStaged);
      } else {
        await slaApi.deleteSlaConfig(item.id);
        loadSlas();
      }
    } catch (err) {
      console.error('Failed to delete SLA config', err);
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

  const formatDays = (days?: number[]) => {
    if (!days || days.length === 0) return 'None';
    if (days.length === 7) return '24/7 Coverage (All Days)';
    if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) {
      return 'Mon – Fri (Standard Workweek)';
    }
    return `${days.length} days / week`;
  };

  const formatHours = (start?: string, end?: string) => {
    if (!start || !end) return 'Business Hours (9:00 – 17:00)';
    const s = start.substring(0, 5);
    const e = end.substring(0, 5);
    if (s === '00:00' && (e === '23:59' || e === '24:00')) return '24 Hours (Round-the-clock)';
    return `${s} – ${e}`;
  };


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
          <button
            type="button"
            onClick={() => handleOpenForm()}
            disabled={allPrioritiesConfigured}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs ${
              allPrioritiesConfigured
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
            }`}
            title={
              allPrioritiesConfigured
                ? 'All priority levels (P1–P4) already have an SLA policy configured'
                : 'Add a new SLA policy'
            }
          >
            {allPrioritiesConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>All Priorities Configured</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add SLA Policy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main SLA Table */}
      {loading ? (
        <DataGridSkeleton rows={4} columns={5} />
      ) : activeItems.length === 0 ? (
        <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No SLA policies defined yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tickets of this type will not have automatic breach timers until you configure at least one SLA policy.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleApplyDefaults}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Apply 4 Standard SLA Defaults
            </button>
          </div>
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
                  .map((config) => {
                    const priorityMeta =
                      PRIORITY_OPTIONS.find((p) => p.value === config.priority) ||
                      PRIORITY_OPTIONS[2];

                    return (
                      <tr key={config.id} className="hover:bg-slate-50/60 transition-colors">
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
                            onClick={() => handleDelete(config)}
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

      {/* ULTRA-SIMPLIFIED, CLEAN Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
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
                    Set target resolution time and working schedule
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

            {/* Error Message */}
            {formError && (
              <div className="m-4 mb-0 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Simplified 3-Field Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* 1. Priority Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Priority Level <span className="text-rose-500">*</span>
                </label>

                {editingId ? (
                  // When editing, show fixed priority badge
                  (() => {
                    const meta =
                      PRIORITY_OPTIONS.find((p) => p.value === formData.priority) ||
                      PRIORITY_OPTIONS[0];
                    return (
                      <div
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${meta.badgeClass}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                        <span>
                          {meta.name} ({meta.code})
                        </span>
                      </div>
                    );
                  })()
                ) : (
                  // When adding, show clean pill choices
                  <div className="grid grid-cols-2 gap-2">
                    {PRIORITY_OPTIONS.map((p) => {
                      const isSelected = formData.priority === p.value;
                      const isAlreadyConfigured = usedPriorities.includes(p.value);
                      return (
                        <button
                          key={p.value}
                          type="button"
                          disabled={isAlreadyConfigured}
                          onClick={() => setFormData({ ...formData, priority: p.value })}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                            isAlreadyConfigured
                              ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                              : isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-100 shadow-2xs cursor-pointer'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer'
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
                )}
              </div>

              {/* 2. Target Resolution Time */}
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
                  value={isCustomResolution ? 'custom' : formData.resolutionMinutes}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomResolution(true);
                      const currentH = Math.max(1, parseInt(String(customHours), 10) || 1);
                      setCustomHours(currentH);
                      setFormData((prev) => ({ ...prev, resolutionMinutes: currentH * 60 }));
                    } else {
                      setIsCustomResolution(false);
                      const mins = parseInt(e.target.value, 10);
                      setFormData((prev) => ({ ...prev, resolutionMinutes: mins }));
                      setCustomHours(Math.max(1, Math.round(mins / 60)));
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

                {isCustomResolution && (
                  <div className="mt-2 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500">Target:</span>
                    <input
                      type="number"
                      min="1"
                      value={customHours}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomHours(val);
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed) && parsed > 0) {
                          setFormData((prev) => ({ ...prev, resolutionMinutes: parsed * 60 }));
                        }
                      }}
                      onBlur={() => {
                        const parsed = parseInt(String(customHours), 10);
                        const fallback = !isNaN(parsed) && parsed > 0 ? parsed : 1;
                        setCustomHours(fallback);
                        setFormData((prev) => ({ ...prev, resolutionMinutes: fallback * 60 }));
                      }}
                      className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-center font-bold outline-none"
                    />
                    <span className="text-xs text-slate-600">hours</span>
                  </div>
                )}
              </div>

              {/* 3. Working Schedule */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Working Schedule <span className="text-rose-500">*</span>
                </label>

                <select
                  value={scheduleMode}
                  onChange={(e) => handleScheduleModeChange(e.target.value as 'standard' | '24_7')}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none cursor-pointer"
                >
                  <option value="standard">Business Hours (Mon–Fri, 9:00 AM – 5:00 PM)</option>
                  <option value="24_7">24/7 Coverage (Round-the-clock, All Days)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Policy' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
