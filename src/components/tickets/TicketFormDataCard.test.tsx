import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TicketFormDataCard, cleanFallbackKey } from './TicketFormDataCard';
import type { FormSchema } from '../../types/formSchema';

describe('TicketFormDataCard Component', () => {
  const schema: FormSchema = {
    fields: [
      {
        name: 'date_selection_mvbyx4zs_0ygg',
        label: 'Date Selection',
        type: 'date',
      },
      {
        name: 'confirmation_che_mvbyxcqt_90b6',
        label: 'Confirmation Checkbox',
        type: 'checkbox',
      },
      {
        name: 'detailed_explana_mvbyxna7_1ya7',
        label: 'Detailed Explanation',
        type: 'textarea',
      },
      {
        name: 'short_text_quest_mvbywuy2_iuw8',
        label: 'Short Text Question',
        type: 'text',
      },
    ],
  };

  const sampleFormData = {
    date_selection_mvbyx4zs_0ygg: '2001-01-10',
    confirmation_che_mvbyxcqt_90b6: true,
    detailed_explana_mvbyxna7_1ya7: 'need ec2',
    short_text_quest_mvbywuy2_iuw8: '1000',
  };

  afterEach(() => {
    cleanup();
  });

  it('renders human-readable field labels from formSchema', () => {
    render(<TicketFormDataCard formData={sampleFormData} formSchema={schema} />);

    // Verify human-readable labels are rendered instead of raw keys with hashes
    expect(screen.getByText('Date Selection')).toBeDefined();
    expect(screen.getByText('Confirmation Checkbox')).toBeDefined();
    expect(screen.getByText('Detailed Explanation')).toBeDefined();
    expect(screen.getByText('Short Text Question')).toBeDefined();

    // Verify values
    expect(screen.getByText('2001-01-10')).toBeDefined();
    expect(screen.getByText('Yes')).toBeDefined();
    expect(screen.getByText('need ec2')).toBeDefined();
    expect(screen.getByText('1000')).toBeDefined();

    // Verify raw keys with random hashes are NOT displayed
    expect(screen.queryByText(/mvbyx4zs/i)).toBeNull();
    expect(screen.queryByText(/mvbyxcqt/i)).toBeNull();
  });

  it('cleanFallbackKey cleans technical keys by stripping hash suffixes when no schema is provided', () => {
    expect(cleanFallbackKey('date_selection_mvbyx4zs_0ygg')).toBe('Date Selection');
    expect(cleanFallbackKey('confirmation_che_mvbyxcqt_90b6')).toBe('Confirmation Che');
    expect(cleanFallbackKey('server_name')).toBe('Server Name');
  });

  it('renders clean fallback labels when formSchema is not provided', () => {
    render(<TicketFormDataCard formData={sampleFormData} />);

    expect(screen.getByText('Date Selection')).toBeDefined();
    expect(screen.queryByText(/mvbyx4zs/i)).toBeNull();
  });
});
