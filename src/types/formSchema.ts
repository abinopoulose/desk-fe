export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';

export interface ConditionalRule {
  field: string;
  value: unknown;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // Required for select type
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  conditionalOn?: ConditionalRule;
  fullWidth?: boolean;
}

export interface FormSchema {
  fields: FormField[];
}
