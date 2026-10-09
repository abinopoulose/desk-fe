import React, { useEffect, useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  X,
  Sliders,
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

  // Custom duration helper
  const [customValue, setCustomValue] = useState<number>(24);
  const [customUnit, setCustomUnit] = useState<'hours' | 'days'>('hours');

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
      // Derive custom hours or days
      if (item.resolutionMinutes % 1440 === 0) {
        setCustomValue(item.resolutionMinutes / 1440);
        setCustomUnit('days');
      } else {
        setCustomValue(Math.round(item.resolutionMinutes / 60));
        setCustomUnit('hours');
      }
    } else {
      // Find the next unused priority if possible
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
      setCustomValue(24);
      setCustomUnit('hours');
    }
    setShowForm(true);
  };

  const handleDayToggle = (day: number) => {
    const current = formData.workingDays || [];
    if (current.includes(day)) {
      setFormData({ ...formData, workingDays: current.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, workingDays: [...current, day].sort() });
    }
  };

  const handleSetPresetDays = (days: number[]) => {
    setFormData({ ...formData, workingDays: days });
  };

  const handleSelectPresetTime = (minutes: number) => {
    setFormData({ ...formData, resolutionMinutes: minutes });
    if (minutes % 1440 === 0) {
      setCustomValue(minutes / 1440);
      setCustomUnit('days');
    } else {
      setCustomValue(Math.round(minutes / 60));
      setCustomUnit('hours');
    }
  };

  const handleCustomDurationChange = (val: number, unit: 'hours' | 'days') => {
    setCustomValue(val);
    setCustomUnit(unit);
    const calculatedMinutes = unit === 'days' ? val * 1440 : val * 60;
    setFormData({ ...formData, resolutionMinutes: calculatedMinutes });
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
        escalationHooks: formData.escalationHooks,
      };

      if (isCreateMode) {
        // Handle staged configuration
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
        resolutionMinutes: 480, // 8 hours (1 business day)
        workingDays: [1, 2, 3, 4, 5],
        workingHoursStart: '09:00:00',
        workingHoursEnd: '17:00:00',
        escalationHooks: null,
      },
      {
        priority: 3, // Medium
        resolutionMinutes: 1440, // 24 hours (1 day)
        workingDays: [1, 2, 3, 4, 5],
        workingHoursStart: '09:00:00',
        workingHoursEnd: '17:00:00',
        escalationHooks: null,
      },
      {
        priority: 4, // Low
        resolutionMinutes: 2880, // 48 hours (2 days)
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
                        {/* Priority Badge */}
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

                        {/* Resolution Time */}
                        <td className="py-4 px-5">
                          <div className="font-semibold text-slate-900">
                            {formatResolutionTime(config.resolutionMinutes)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {config.resolutionMinutes} minutes target
                          </div>
                        </td>

                        {/* Working Days */}
                        <td className="py-4 px-5 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDays(config.workingDays)}</span>
                          </div>
                        </td>

                        {/* Working Hours */}
                        <td className="py-4 px-5 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatHours(config.workingHoursStart, config.workingHoursEnd)}</span>
                          </div>
                        </td>

                        {/* Actions */}
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

      {/* Simplified Add/Edit Modal for HR / Business Users */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingId ? 'Edit SLA Policy' : 'Add SLA Policy'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define target resolution timeline and business hours
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* 1. Priority Selection Cards */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  1. Select Priority Level <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {PRIORITY_OPTIONS.map((p) => {
                    const isSelected = formData.priority === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p.value })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-100 shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${p.dotClass}`} />
                          <span className="text-xs font-bold text-slate-900">
                            {p.name} ({p.code})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {p.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Target Resolution Time */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    2. Target Resolution Time <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-indigo-600">
                    {formatResolutionTime(formData.resolutionMinutes)}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {RESOLUTION_PRESETS.map((preset) => {
                    const isSelected = formData.resolutionMinutes === preset.minutes;
                    return (
                      <button
                        key={preset.minutes}
                        type="button"
                        onClick={() => handleSelectPresetTime(preset.minutes)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom duration inputs */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">Custom duration:</span>
                  <input
                    type="number"
                    min="1"
                    value={customValue}
                    onChange={(e) =>
                      handleCustomDurationChange(Math.max(1, parseInt(e.target.value) || 1), customUnit)
                    }
                    className="w-20 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none text-center font-bold"
                  />
                  <select
                    value={customUnit}
                    onChange={(e) =>
                      handleCustomDurationChange(customValue, e.target.value as 'hours' | 'days')
                    }
                    className="bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none font-medium cursor-pointer"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Business Days</option>
                  </select>
                  <span className="text-[11px] text-slate-400 ml-auto">
                    ({formData.resolutionMinutes} mins total)
                  </span>
                </div>
              </div>

              {/* 3. Working Days Schedule */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    3. Applicable Working Days <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays([1, 2, 3, 4, 5])}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Mon – Fri
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays([1, 2, 3, 4, 5, 6, 7])}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      All Days
                    </button>
                  </div>
                </div>

                {/* Day selector pills */}
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = (formData.workingDays || []).includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Working Hours Schedule */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  4. Business Hours Window <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[11px] text-slate-500 mb-1">Day Starts At</span>
                    <input
                      type="time"
                      value={formData.workingHoursStart?.substring(0, 5) || '09:00'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workingHoursStart: `${e.target.value}:00`,
                        })
                      }
                      required
                      className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-500 mb-1">Day Ends At</span>
                    <input
                      type="time"
                      value={formData.workingHoursEnd?.substring(0, 5) || '17:00'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workingHoursEnd: `${e.target.value}:00`,
                        })
                      }
                      required
                      className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Advanced Settings (Hidden by default so HR users are never overwhelmed) */}
              <details className="text-xs border border-slate-200/80 rounded-xl p-3 bg-slate-50/50 group">
                <summary className="font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer list-none">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>Advanced: Escalation Webhooks (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal ml-auto group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="pt-3 mt-2 border-t border-slate-200/60">
                  <p className="text-[11px] text-slate-500 mb-2">
                    Webhook triggers for external alerting systems (leave empty if not configured).
                  </p>
                  <textarea
                    rows={2}
                    value={
                      formData.escalationHooks
                        ? JSON.stringify(formData.escalationHooks, null, 2)
                        : ''
                    }
                    onChange={(e) => {
                      try {
                        const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : null;
                        setFormData({ ...formData, escalationHooks: parsed });
                      } catch {
                        // ignore typing errors until valid
                      }
                    }}
                    placeholder='{"notifyUrl": "https://..."}'
                    className="w-full bg-white border border-slate-200 font-mono text-[11px] p-2.5 rounded-lg text-slate-700 outline-none"
                  />
                </div>
              </details>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingId ? 'Update Policy' : 'Save SLA Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
