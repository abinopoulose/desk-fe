import type { FormField } from '../../../types/formSchema';

export interface FieldProps {
  field: FormField;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
  error?: string;
}
