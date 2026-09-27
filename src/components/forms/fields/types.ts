import { FormField } from '../../../types/formSchema';

export interface FieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}
