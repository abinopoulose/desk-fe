import React, { useEffect, useRef, useState } from 'react';
import {
  Type,
  AlignLeft,
  ListFilter,
  CheckSquare,
  Hash,
  Calendar,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Check,
  X,
} from 'lucide-react';
import type { FormSchema, FieldType } from '../../types/formSchema';
import { DynamicFormRenderer } from '../forms/DynamicFormRenderer';
import { useSchemaBuilder } from '../../hooks/useSchemaBuilder';

export interface SchemaBuilderProps {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
}

interface FieldTypeInfo {
  type: FieldType;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FIELD_TYPES: FieldTypeInfo[] = [
  {
    type: 'text',
    label: 'Short Text',
    shortLabel: 'Text',
    description: 'Single-line text for names, IDs, or short answers',
    icon: Type,
  },
  {
    type: 'textarea',
    label: 'Paragraph / Long Text',
    shortLabel: 'Paragraph',
    description: 'Multi-line text for explanations and detailed descriptions',
    icon: AlignLeft,
  },
  {
    type: 'select',
    label: 'Dropdown Choices',
    shortLabel: 'Dropdown',
    description: 'Employee selects one item from a list of predefined choices',
    icon: ListFilter,
  },
  {
    type: 'checkbox',
    label: 'Yes / No Checkbox',
    shortLabel: 'Checkbox',
    description: 'Confirmation or consent checkbox',
    icon: CheckSquare,
  },
  {
    type: 'number',
    label: 'Number',
    shortLabel: 'Number',
    description: 'Numeric inputs for counts, quantities, or amounts',
    icon: Hash,
  },
  {
    type: 'date',
    label: 'Date Picker',
    shortLabel: 'Date',
    description: 'Date selection for deadlines or events',
    icon: Calendar,
  },
];

export const SchemaBuilder: React.FC<SchemaBuilderProps> = ({ schema, onChange }) => {
  const {
    schema: builderSchema,
    fields,
    selectedField,
    selectedIndex,
    selectField,
    addField,
    removeField,
    reorderField,
    updateField,
    isPreview,
    togglePreview,
    dragHandlers,
  } = useSchemaBuilder(schema);

  const [newOptionInput, setNewOptionInput] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (selectedField?.conditionalOn?.field) {
      setIsAdvancedOpen(true);
    }
  }, [selectedField]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChange(builderSchema);
  }, [builderSchema, onChange]);

  const activeField = selectedField;
  const editingIndex = selectedIndex;

  const handleAddOption = (index: number) => {
    if (!newOptionInput.trim() || !activeField) return;
    const currentOptions = activeField.options || [];
    updateField(index, { options: [...currentOptions, newOptionInput.trim()] });
    setNewOptionInput('');
  };

  const handleRemoveOption = (index: number, optionIdxToRemove: number) => {
    if (!activeField?.options) return;
    const nextOptions = activeField.options.filter((_, i) => i !== optionIdxToRemove);
    updateField(index, { options: nextOptions });
  };

  const handleOptionChange = (index: number, optionIdx: number, val: string) => {
    if (!activeField?.options) return;
    const nextOptions = [...activeField.options];
    nextOptions[optionIdx] = val;
    updateField(index, { options: nextOptions });
  };

  const getTypeMeta = (type: FieldType) => {
    return FIELD_TYPES.find((t) => t.type === type) || FIELD_TYPES[0];
  };

  // Other fields available for conditional display logic
  const candidateConditionalFields = fields.filter((_, idx) => idx !== editingIndex);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: Questions & Form Field Editor */}
      <div className={`lg:col-span-7 space-y-6 ${isPreview ? 'hidden lg:block' : 'block'}`}>
        
        {/* Quick Add Toolbar */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Add Questions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click a question type below to add it to your ticket form
              </p>
            </div>

            <button
              type="button"
              onClick={togglePreview}
              className="lg:hidden px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5 self-start cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Show Live Preview</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FIELD_TYPES.map((ft) => {
              const Icon = ft.icon;
              return (
                <button
                  key={ft.type}
                  type="button"
                  onClick={() => addField(ft.type)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-medium transition-all shadow-2xs text-left cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{ft.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Existing Questions List */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Questions in this Form ({fields.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400">Click a question to edit</span>
          </div>

          {fields.length === 0 ? (
            <div className="bg-slate-50/60 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No questions added yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Use the quick buttons above to add your first question for employees to answer.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {fields.map((field, index) => {
                const meta = getTypeMeta(field.type);
                const Icon = meta.icon;
                const isSelected = editingIndex === index;

                return (
                  <div
                    key={field.name || index}
                    draggable
                    onDragStart={() => dragHandlers.onDragStart(index)}
                    onDragOver={dragHandlers.onDragOver}
                    onDrop={() => dragHandlers.onDrop(index)}
                    onClick={() => selectField(index)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-100 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Drag / Index Number */}
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {field.label || 'Untitled Question'}
                          </span>

                          {field.required && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Required *
                            </span>
                          )}

                          {field.conditionalOn && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              Conditional
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md">
                            <Icon className="w-3 h-3 text-slate-600" />
                            <span>{meta.shortLabel}</span>
                            {field.type === 'select' && field.options && (
                              <span className="text-slate-400">({field.options.length} choices)</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Controls & Delete Button */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderField(index, index - 1);
                        }}
                        disabled={index === 0}
                        title="Move Up"
                        className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-slate-600 text-xs transition-colors cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderField(index, index + 1);
                        }}
                        disabled={index === fields.length - 1}
                        title="Move Down"
                        className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-slate-600 text-xs transition-colors cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(index);
                        }}
                        title="Delete Question"
                        className="w-7 h-7 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center text-xs transition-colors ml-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Field Editor (Simplified for Non-Technical Users) */}
        {activeField && editingIndex !== null && (
          <div className="bg-white border-2 border-indigo-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  #{editingIndex + 1}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Question Settings
                  </h4>
                  <p className="text-xs text-slate-500">
                    Customize the question prompt, answer type, and options
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => selectField(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

            {/* Question Prompt / Label */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Question Prompt <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={activeField.label}
                onChange={(e) => updateField(editingIndex, { label: e.target.value })}
                placeholder="e.g. Please describe the issue in detail"
                className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                The exact prompt or question that the employee will see.
              </p>
            </div>

            {/* Question Type Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Answer Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FIELD_TYPES.map((ft) => {
                  const Icon = ft.icon;
                  const isCurrent = activeField.type === ft.type;
                  return (
                    <button
                      key={ft.type}
                      type="button"
                      onClick={() => updateField(editingIndex, { type: ft.type })}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <span className="truncate">{ft.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If Dropdown (Select): Friendly Options Manager */}
            {activeField.type === 'select' && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Dropdown Choices
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Employees will pick one choice
                  </span>
                </div>

                {/* Option List */}
                <div className="space-y-2">
                  {(activeField.options || []).map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-5 text-right font-medium">
                        {optIdx + 1}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(editingIndex, optIdx, e.target.value)}
                        className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(editingIndex, optIdx)}
                        title="Remove Option"
                        className="w-7 h-7 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Option Input */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <input
                    type="text"
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption(editingIndex);
                      }
                    }}
                    placeholder="Type a new choice name..."
                    className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddOption(editingIndex)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Choice</span>
                  </button>
                </div>
              </div>
            )}

            {/* Required Question Switch */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Required Question
                </span>
                <span className="text-xs text-slate-500">
                  Employees cannot submit the ticket without answering this question.
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id={`required_${editingIndex}`}
                  checked={!!activeField.required}
                  onChange={(e) => updateField(editingIndex, { required: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Advanced Settings: Conditional Visibility */}
            {(() => {
              const dependentFieldObj = fields.find((f) => f.name === activeField.conditionalOn?.field);
              return (
                <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="w-full px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Advanced Settings: Conditional Visibility
                      </span>
                      {activeField.conditionalOn?.field && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Rule Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-[11px] font-medium text-slate-400">
                        {isAdvancedOpen ? 'Hide' : 'Configure'}
                      </span>
                      {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  {isAdvancedOpen && (
                    <div className="p-4 bg-slate-50/40 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          Show this question only when a specific answer is given to another question.
                        </p>

                        {activeField.conditionalOn && (
                          <button
                            type="button"
                            onClick={() => updateField(editingIndex, { conditionalOn: undefined })}
                            className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                          >
                            Clear Condition
                          </button>
                        )}
                      </div>

                      {candidateConditionalFields.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Add more questions to set up conditional rules based on previous responses.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Show when this question:
                            </label>
                            <div className="relative">
                              <select
                                aria-label="Show when this question"
                                value={activeField.conditionalOn?.field || ''}
                                onChange={(e) => {
                                  const depName = e.target.value;
                                  if (!depName) {
                                    updateField(editingIndex, { conditionalOn: undefined });
                                  } else {
                                    const targetField = fields.find((f) => f.name === depName);
                                    let initialVal: any = '';
                                    if (targetField?.type === 'checkbox') {
                                      initialVal = true;
                                    } else if (targetField?.type === 'select' && targetField.options?.length) {
                                      initialVal = targetField.options[0];
                                    }
                                    updateField(editingIndex, {
                                      conditionalOn: { field: depName, value: initialVal },
                                    });
                                  }
                                }}
                                className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 pr-8 text-xs text-slate-800 outline-none appearance-none cursor-pointer"
                              >
                                <option value="">-- Always Show (No Condition) --</option>
                                {candidateConditionalFields.map((f, i) => (
                                  <option key={f.name || i} value={f.name}>
                                    {f.label || `Question #${i + 1}`} ({getTypeMeta(f.type).shortLabel})
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>

                          {activeField.conditionalOn?.field && (
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Has this specific answer:
                              </label>

                              {/* 1. If dependent field is a boolean checkbox */}
                              {dependentFieldObj?.type === 'checkbox' ? (
                                <div className="relative">
                                  <select
                                    aria-label="Has this specific answer"
                                    value={String(activeField.conditionalOn.value === true || String(activeField.conditionalOn.value).toLowerCase() === 'true')}
                                    onChange={(e) => {
                                      updateField(editingIndex, {
                                        conditionalOn: {
                                          field: activeField.conditionalOn!.field,
                                          value: e.target.value === 'true',
                                        },
                                      });
                                    }}
                                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 pr-8 text-xs text-slate-800 outline-none appearance-none cursor-pointer"
                                  >
                                    <option value="true">Checked (Yes / True)</option>
                                    <option value="false">Unchecked (No / False)</option>
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                              ) : dependentFieldObj?.type === 'select' ? (
                                /* 2. If dependent field is a dropdown choices select */
                                <div className="relative">
                                  <select
                                    aria-label="Has this specific answer"
                                    value={String(activeField.conditionalOn.value ?? '')}
                                    onChange={(e) => {
                                      updateField(editingIndex, {
                                        conditionalOn: {
                                          field: activeField.conditionalOn!.field,
                                          value: e.target.value,
                                        },
                                      });
                                    }}
                                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 pr-8 text-xs text-slate-800 outline-none appearance-none cursor-pointer"
                                  >
                                    <option value="">-- Select Choice Option --</option>
                                    {(dependentFieldObj.options || []).map((opt, i) => (
                                      <option key={i} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                              ) : (
                                /* 3. Text, number, date or other types */
                                <input
                                  type="text"
                                  aria-label="Has this specific answer"
                                  placeholder="e.g. Yes, Hardware, Urgent"
                                  value={activeField.conditionalOn?.value !== undefined ? String(activeField.conditionalOn.value) : ''}
                                  onChange={(e) => {
                                    if (activeField.conditionalOn?.field) {
                                      updateField(editingIndex, {
                                        conditionalOn: {
                                          field: activeField.conditionalOn.field,
                                          value: e.target.value,
                                        },
                                      });
                                    }
                                  }}
                                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        )}

      </div>

      {/* RIGHT COLUMN: Live Employee Form Preview */}
      <div className={`lg:col-span-5 ${!isPreview ? 'hidden lg:block' : 'block'}`}>
        <div className="sticky top-6 z-10 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          
          <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Employee Preview
                </h3>
                <p className="text-[11px] text-slate-500">
                  How employees will see this form
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={togglePreview}
              className="lg:hidden px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 cursor-pointer"
            >
              Back to Editor
            </button>
          </div>

          <div className="p-6">
            {builderSchema.fields.length > 0 ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Interactive preview: test your questions and validation rules below.</span>
                </div>

                <div className="pt-2">
                  <DynamicFormRenderer
                    schema={builderSchema}
                    onSubmit={(data) => console.log('Preview form test submitted:', data)}
                  />
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">Preview is empty</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Add questions on the left to see a live preview of what employees will fill out.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
