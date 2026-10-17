import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Type,
  AlignLeft,
  ListFilter,
  CheckSquare,
  Hash,
  Calendar,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Eye,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Check,
  X,
  GripVertical,
} from 'lucide-react';
import type { FormSchema, FieldType } from '../../types/formSchema';
import { DynamicFormRenderer } from '../forms/DynamicFormRenderer';
import { useSchemaBuilder, normalizeFormSchema } from '../../hooks/useSchemaBuilder';

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
    shortLabel: 'Short Text',
    description: 'Single-line text for short answers, names, or IDs',
    icon: Type,
  },
  {
    type: 'textarea',
    label: 'Paragraph / Long Text',
    shortLabel: 'Paragraph',
    description: 'Multi-line text for detailed descriptions',
    icon: AlignLeft,
  },
  {
    type: 'select',
    label: 'Dropdown Choices',
    shortLabel: 'Dropdown Choices',
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
    shortLabel: 'Date Picker',
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
    duplicateField,
    removeField,
    reorderField,
    updateField,
    isPreview,
    togglePreview,
    dragHandlers,
    loadSchema,
  } = useSchemaBuilder(schema);

  const safeFields = useMemo(() => (Array.isArray(fields) ? fields : []), [fields]);

  const [newOptionInput, setNewOptionInput] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const isFirstRender = useRef(true);
  const lastLoadedSchemaRef = useRef<string>(JSON.stringify(normalizeFormSchema(schema)));
  const lastEmittedSchemaRef = useRef<string>(JSON.stringify(normalizeFormSchema(schema)));

  useEffect(() => {
    if (!schema) return;
    const serialized = JSON.stringify(normalizeFormSchema(schema));
    if (serialized !== lastLoadedSchemaRef.current && serialized !== lastEmittedSchemaRef.current) {
      lastLoadedSchemaRef.current = serialized;
      lastEmittedSchemaRef.current = serialized;
      loadSchema(schema);
    }
  }, [schema, loadSchema]);

  useEffect(() => {
    if (selectedField?.conditionalOn?.field || selectedField?.fullWidth) {
      setIsAdvancedOpen(true);
    }
  }, [selectedField]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const serialized = JSON.stringify(normalizeFormSchema(builderSchema));
    if (serialized !== lastEmittedSchemaRef.current) {
      lastEmittedSchemaRef.current = serialized;
      lastLoadedSchemaRef.current = serialized;
      onChange(builderSchema);
    }
  }, [builderSchema, onChange]);

  const editingIndex = selectedIndex;

  const handleAddOption = (fieldIdx: number, customText?: string) => {
    const field = safeFields[fieldIdx];
    if (!field) return;
    const currentOptions = field.options || [];
    const textToAdd = (customText !== undefined ? customText : newOptionInput).trim();
    if (!textToAdd) {
      const nextNum = currentOptions.length + 1;
      updateField(fieldIdx, { options: [...currentOptions, `Option ${nextNum}`] });
      return;
    }
    updateField(fieldIdx, { options: [...currentOptions, textToAdd] });
    setNewOptionInput('');
  };

  const handleRemoveOption = (fieldIdx: number, optionIdxToRemove: number) => {
    const field = safeFields[fieldIdx];
    if (!field?.options) return;
    const nextOptions = field.options.filter((_, i) => i !== optionIdxToRemove);
    updateField(fieldIdx, { options: nextOptions });
  };

  const handleOptionChange = (fieldIdx: number, optionIdx: number, val: string) => {
    const field = safeFields[fieldIdx];
    if (!field?.options) return;
    const nextOptions = [...field.options];
    nextOptions[optionIdx] = val;
    updateField(fieldIdx, { options: nextOptions });
  };

  const getTypeMeta = (type: FieldType) => {
    return FIELD_TYPES.find((t) => t.type === type) || FIELD_TYPES[0];
  };

  // Candidate fields available for conditional display logic
  const candidateConditionalFields = safeFields.filter((_, idx) => idx !== editingIndex);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: Google Forms Style Question Canvas */}
      <div className={`lg:col-span-7 space-y-5 ${isPreview ? 'hidden lg:block' : 'block'}`}>
        
        {/* Top Header / Counter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Questions in this Form ({safeFields.length})
              </h3>
              <p className="text-xs text-slate-500">
                Click any question to edit in place, or use the quick buttons below
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={togglePreview}
              className="lg:hidden px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Show Live Preview</span>
            </button>
            <button
              type="button"
              onClick={() => addField('text')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Empty State when no questions exist */}
        {safeFields.length === 0 ? (
          <div className="bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">No questions added yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Select a question type below to create your first question for this form.
              </p>
            </div>

            {/* Empty State Quick Add Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md mx-auto pt-2">
              {FIELD_TYPES.map((ft) => {
                const Icon = ft.icon;
                return (
                  <button
                    key={ft.type}
                    type="button"
                    onClick={() => addField(ft.type)}
                    className="flex items-center gap-2 p-2.5 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-medium transition-all shadow-2xs text-left cursor-pointer group"
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
        ) : (
          /* Stacked Google Forms Style Question Cards */
          <div className="space-y-4">
            {safeFields.map((field, index) => {
              const meta = getTypeMeta(field.type);
              const Icon = meta.icon;
              const isSelected = editingIndex === index;

              if (isSelected) {
                // ==========================================
                // ACTIVE QUESTION CARD (INLINE GOOGLE FORMS EDITOR)
                // ==========================================
                const dependentFieldObj = safeFields.find((f) => f.name === field.conditionalOn?.field);
                const isFieldFullWidth =
                  field.fullWidth !== undefined
                    ? field.fullWidth
                    : field.type === 'textarea' || field.type === 'checkbox';

                return (
                  <div
                    key={field.name || index}
                    className="bg-white border-2 border-indigo-500 border-l-[6px] border-l-indigo-600 rounded-2xl p-6 shadow-sm ring-2 ring-indigo-50 transition-all space-y-4"
                  >
                    {/* Top Active Bar: Drag handle, Question indicator, Type dropdown */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Question Settings
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Editing question #{index + 1}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Google Forms Style Answer Type Dropdown */}
                        <div className="relative">
                          <select
                            aria-label="Answer Type"
                            value={field.type}
                            onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                            className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold py-2 pl-8 pr-7 rounded-xl cursor-pointer outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                          >
                            {FIELD_TYPES.map((ft) => (
                              <option key={ft.type} value={ft.type}>
                                {ft.label}
                              </option>
                            ))}
                          </select>
                          <Icon className="w-3.5 h-3.5 text-indigo-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <button
                          type="button"
                          onClick={() => selectField(null)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>

                    {/* Question Prompt Input */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        Question Prompt <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="e.g. Please describe the issue in detail"
                        className="w-full text-base font-semibold text-slate-900 border-b-2 border-slate-200 focus:border-indigo-600 py-2 bg-transparent outline-none transition-colors placeholder:text-slate-400 placeholder:font-normal"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        The exact question or prompt the employee will see when submitting.
                      </p>
                    </div>

                    {/* Inline Answer Area Based on Question Type */}
                    <div className="pt-1">
                      {field.type === 'text' && (
                        <div className="py-2.5">
                          <div className="w-full sm:w-2/3 border-b-2 border-dotted border-slate-300 py-1.5 text-xs text-slate-400 select-none flex items-center justify-between">
                            <span>Short answer text</span>
                            <span className="text-[10px] text-slate-400 italic">Single-line text</span>
                          </div>
                        </div>
                      )}

                      {field.type === 'textarea' && (
                        <div className="py-2">
                          <div className="w-full border border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-3 text-xs text-slate-400 select-none">
                            <span className="font-medium text-slate-500">Paragraph / Long Text</span>
                            <p className="text-[11px] text-slate-400 mt-0.5 italic">
                              Multi-line text box for employee explanations and detailed descriptions.
                            </p>
                          </div>
                        </div>
                      )}

                      {field.type === 'select' && (
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                              Dropdown Choices
                            </label>
                            <span className="text-[11px] text-slate-500">
                              Employees will pick one choice
                            </span>
                          </div>

                          {/* Existing Choices */}
                          <div className="space-y-2">
                            {(field.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 group">
                                <span className="w-5 h-5 rounded-full border border-slate-300 text-slate-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {optIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleOptionChange(index, optIdx, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddOption(index, `Option ${(field.options || []).length + 1}`);
                                    }
                                  }}
                                  className="flex-1 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none transition-colors"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(index, optIdx)}
                                  title="Remove Option"
                                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Add Choice Input & Quick Button */}
                          <div className="pt-2 border-t border-slate-200/70 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                value={newOptionInput}
                                onChange={(e) => setNewOptionInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddOption(index);
                                  }
                                }}
                                placeholder="Type a new choice name..."
                                className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none placeholder-slate-400"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddOption(index)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Choice</span>
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddOption(index, `Option ${(field.options || []).length + 1}`)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1.5 rounded-lg hover:bg-indigo-50/70 transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Quick Add Next</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {field.type === 'checkbox' && (
                        <div className="py-2">
                          <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>Employee checks this box to confirm or consent before submitting.</span>
                          </div>
                        </div>
                      )}

                      {field.type === 'number' && (
                        <div className="py-2">
                          <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <Hash className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>Numeric answer (counts, quantities, or amounts).</span>
                          </div>
                        </div>
                      )}

                      {field.type === 'date' && (
                        <div className="py-2">
                          <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>Date picker (day, month, year) for deadlines or events.</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Bar: Reorder, Duplicate, Delete, Required Toggle, Advanced Settings */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      {/* Left: Reorder Chevrons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => reorderField(index, index - 1)}
                          disabled={index === 0}
                          title="Move Up"
                          className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => reorderField(index, index + 1)}
                          disabled={index === safeFields.length - 1}
                          title="Move Down"
                          className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] text-slate-400 font-medium ml-1">
                          Question {index + 1} of {safeFields.length}
                        </span>
                      </div>

                      {/* Right: Duplicate, Delete, Required, Advanced */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => duplicateField(index)}
                          title="Duplicate Question"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Duplicate</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          title="Delete Question"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>

                        <div className="h-5 w-px bg-slate-200 mx-1" />

                        {/* Required Toggle */}
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`required_${index}`}
                            className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
                          >
                            Required Question
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              id={`required_${index}`}
                              checked={!!field.required}
                              onChange={(e) => updateField(index, { required: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        <div className="h-5 w-px bg-slate-200 mx-1" />

                        {/* Advanced Settings Accordion Toggle */}
                        <button
                          type="button"
                          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            isAdvancedOpen || field.conditionalOn?.field || field.fullWidth
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Advanced Settings</span>
                          {field.conditionalOn?.field && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
                              Rule Active
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Advanced Settings Panel (Conditional Rules & Full Width) */}
                    {isAdvancedOpen && (
                      <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/60 rounded-xl p-4 space-y-4">
                        {/* 1. Full Width Toggle */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/70">
                          <div>
                            <span className="block text-xs font-bold text-slate-800">
                              Take up full screen width
                            </span>
                            <span className="block text-[11px] text-slate-500 mt-0.5">
                              Expand this question across the full width of the form (100%) instead of half width
                            </span>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                            <input
                              type="checkbox"
                              aria-label="Take up full screen width"
                              checked={isFieldFullWidth}
                              onChange={(e) => updateField(index, { fullWidth: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        {/* 2. Conditional Visibility Setting */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="block text-xs font-bold text-slate-800">
                                Conditional Visibility
                              </span>
                              <span className="block text-[11px] text-slate-500 mt-0.5">
                                Show this question only when a specific answer is given to another question
                              </span>
                            </div>

                            {field.conditionalOn && (
                              <button
                                type="button"
                                onClick={() => updateField(index, { conditionalOn: undefined })}
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
                                    value={field.conditionalOn?.field || ''}
                                    onChange={(e) => {
                                      const depName = e.target.value;
                                      if (!depName) {
                                        updateField(index, { conditionalOn: undefined });
                                      } else {
                                        const targetField = safeFields.find((f) => f.name === depName);
                                        let initialVal: any = '';
                                        if (targetField?.type === 'checkbox') {
                                          initialVal = true;
                                        } else if (targetField?.type === 'select' && targetField.options?.length) {
                                          initialVal = targetField.options[0];
                                        }
                                        updateField(index, {
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

                              {field.conditionalOn?.field && (
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Has this specific answer:
                                  </label>

                                  {/* Boolean Checkbox dependency */}
                                  {dependentFieldObj?.type === 'checkbox' ? (
                                    <div className="relative">
                                      <select
                                        aria-label="Has this specific answer"
                                        value={String(field.conditionalOn.value === true || String(field.conditionalOn.value).toLowerCase() === 'true')}
                                        onChange={(e) => {
                                          updateField(index, {
                                            conditionalOn: {
                                              field: field.conditionalOn!.field,
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
                                    /* Dropdown Select dependency */
                                    <div className="relative">
                                      <select
                                        aria-label="Has this specific answer"
                                        value={String(field.conditionalOn.value ?? '')}
                                        onChange={(e) => {
                                          updateField(index, {
                                            conditionalOn: {
                                              field: field.conditionalOn!.field,
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
                                    /* Text, number, date dependency */
                                    <input
                                      type="text"
                                      aria-label="Has this specific answer"
                                      placeholder="e.g. Yes, Hardware, Urgent"
                                      value={field.conditionalOn?.value !== undefined ? String(field.conditionalOn.value) : ''}
                                      onChange={(e) => {
                                        if (field.conditionalOn?.field) {
                                          updateField(index, {
                                            conditionalOn: {
                                              field: field.conditionalOn.field,
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
                      </div>
                    )}

                  </div>
                );
              }

              // ==========================================
              // INACTIVE QUESTION CARD (READABLE PREVIEW MODE)
              // ==========================================
              return (
                <div
                  key={field.name || index}
                  draggable
                  onDragStart={() => dragHandlers.onDragStart(index)}
                  onDragOver={dragHandlers.onDragOver}
                  onDrop={() => dragHandlers.onDrop(index)}
                  onClick={() => selectField(index)}
                  className="group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs rounded-2xl p-5 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
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

                          {field.fullWidth && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                              Full Width
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Icon className="w-3 h-3 text-slate-600" />
                        <span>{meta.shortLabel}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateField(index);
                        }}
                        title="Duplicate Question"
                        className="w-7 h-7 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center text-xs transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(index);
                        }}
                        title="Delete Question"
                        className="w-7 h-7 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center text-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Clean Answer Preview on Inactive Card */}
                  <div className="pl-9 pr-2">
                    {field.type === 'text' && (
                      <div className="border-b border-dotted border-slate-200 py-1 text-xs text-slate-400 select-none">
                        Short answer text
                      </div>
                    )}
                    {field.type === 'textarea' && (
                      <div className="border border-dashed border-slate-200 bg-slate-50/40 rounded-lg p-2 text-xs text-slate-400 select-none">
                        Paragraph / Long answer text
                      </div>
                    )}
                    {field.type === 'select' && (
                      <div className="flex flex-wrap gap-1.5">
                        {(field.options || []).map((opt, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                    {field.type === 'checkbox' && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>Checkbox confirmation</span>
                      </div>
                    )}
                    {field.type === 'number' && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <span>Numeric value</span>
                      </div>
                    )}
                    {field.type === 'date' && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Date picker</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating / Sticky Quick Add Toolbar at Bottom of Form (When questions exist) */}
        {safeFields.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Add Another Question</span>
              </span>
              <span className="text-[11px] text-slate-400">Click to append</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {FIELD_TYPES.map((ft) => {
                const Icon = ft.icon;
                return (
                  <button
                    key={ft.type}
                    type="button"
                    onClick={() => addField(ft.type)}
                    className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-medium transition-all shadow-2xs cursor-pointer group text-center"
                  >
                    <Icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1 transition-colors" />
                    <span className="truncate w-full text-[11px] font-semibold">{ft.label}</span>
                  </button>
                );
              })}
            </div>
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
            {safeFields.length > 0 ? (
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
