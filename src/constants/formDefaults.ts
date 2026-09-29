export const FORM_DEFAULTS = {
  STATUS_COLORS: [
    { label: 'Gray', value: 'gray' },
    { label: 'Blue', value: 'blue' },
    { label: 'Green', value: 'green' },
    { label: 'Yellow', value: 'yellow' },
    { label: 'Red', value: 'red' },
    { label: 'Purple', value: 'purple' },
  ],
  PRIORITY_LEVELS: [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ],
  FIELD_TYPES: [
    { label: 'Text', value: 'text' },
    { label: 'Textarea', value: 'textarea' },
    { label: 'Number', value: 'number' },
    { label: 'Select', value: 'select' },
    { label: 'Checkbox', value: 'checkbox' },
    { label: 'Date', value: 'date' },
  ],
  TIME_UNITS: [
    { label: 'Minutes', value: 'minutes' },
    { label: 'Hours', value: 'hours' },
    { label: 'Days', value: 'days' },
  ]
} as const;
