import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SlaConfigSection } from './SlaConfigSection';
import type { CreateSlaConfigRequest } from '../../types/sla';

describe('SlaConfigSection Component', () => {
  const mockStagedConfigs: CreateSlaConfigRequest[] = [
    {
      priority: 1,
      resolutionMinutes: 240, // 4 hours
      workingDays: [1, 2, 3, 4, 5],
      workingHoursStart: '09:00:00',
      workingHoursEnd: '17:00:00',
      escalationHooks: null,
    },
    {
      priority: 2,
      resolutionMinutes: 480, // 8 hours
      workingDays: [1, 2, 3, 4, 5],
      workingHoursStart: '09:00:00',
      workingHoursEnd: '17:00:00',
      escalationHooks: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders configured SLA policies with friendly priority badges and readable resolution times', () => {
    render(
      <SlaConfigSection
        stagedConfigs={mockStagedConfigs}
        onStagedConfigsChange={vi.fn()}
      />
    );

    expect(screen.getByText('Critical (P1)')).toBeDefined();
    expect(screen.getByText('High (P2)')).toBeDefined();
    expect(screen.getByText('4 hours')).toBeDefined();
    expect(screen.getByText('8 hours')).toBeDefined();
    expect(screen.getAllByText('Mon – Fri (Standard Workweek)')).toHaveLength(2);
  });

  it('renders empty state when no policies exist and allows applying 4 standard defaults', () => {
    const handleStagedChange = vi.fn();
    render(
      <SlaConfigSection
        stagedConfigs={[]}
        onStagedConfigsChange={handleStagedChange}
      />
    );

    expect(screen.getByText('No SLA policies defined yet')).toBeDefined();
    const applyBtn = screen.getByText(/Apply 4 Standard SLA Defaults/i);
    expect(applyBtn).toBeDefined();

    fireEvent.click(applyBtn);
    expect(handleStagedChange).toHaveBeenCalledTimes(1);
    const passedConfigs = handleStagedChange.mock.calls[0][0];
    expect(passedConfigs).toHaveLength(4);
    expect(passedConfigs[0].priority).toBe(1); // Critical
    expect(passedConfigs[0].resolutionMinutes).toBe(240); // 4h
  });

  it('opens simplified add SLA form with clean priority pills, resolution select, and schedule select', () => {
    render(
      <SlaConfigSection
        stagedConfigs={mockStagedConfigs}
        onStagedConfigsChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Add SLA Policy'));

    // Modal title and button both exist
    expect(screen.getAllByText('Add SLA Policy').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Priority Level/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Target Resolution Time/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Working Schedule/i).length).toBeGreaterThanOrEqual(1);
  });

  it('allows changing priority and resolution time in the simplified form', () => {
    render(
      <SlaConfigSection
        stagedConfigs={mockStagedConfigs}
        onStagedConfigsChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Add SLA Policy'));

    // Click Low priority pill
    const lowPill = screen.getByText('Low (P4)');
    fireEvent.click(lowPill);

    // Change resolution target dropdown
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);
    fireEvent.change(selects[0], { target: { value: '480' } });
    expect(selects[0]).toBeDefined();
  });

  it('allows deleting an SLA policy in staged create mode', () => {
    const handleStagedChange = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <SlaConfigSection
        stagedConfigs={mockStagedConfigs}
        onStagedConfigsChange={handleStagedChange}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(handleStagedChange).toHaveBeenCalledTimes(1);
    const updated = handleStagedChange.mock.calls[0][0];
    expect(updated).toHaveLength(1);
    expect(updated[0].priority).toBe(2);
  });

  it('allows setting custom hours when editing an SLA policy', () => {
    const handleStagedChange = vi.fn();

    render(
      <SlaConfigSection
        stagedConfigs={mockStagedConfigs}
        onStagedConfigsChange={handleStagedChange}
      />
    );

    // Click Edit on P1 (which currently has 240 minutes = 4 hours)
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Edit SLA Policy')).toBeDefined();

    // Selects: first combobox is resolution time
    const resolutionSelect = screen.getAllByRole('combobox')[0];
    expect(resolutionSelect).toBeDefined();

    // Switch to Custom Hours
    fireEvent.change(resolutionSelect, { target: { value: 'custom' } });

    // The custom hours number input should now be visible
    const numberInput = screen.getByRole('spinbutton');
    expect(numberInput).toBeDefined();
    expect((numberInput as HTMLInputElement).value).toBe('4');

    // Change custom hours to 6 hours
    fireEvent.change(numberInput, { target: { value: '6' } });
    expect((numberInput as HTMLInputElement).value).toBe('6');

    // Submit the form
    fireEvent.click(screen.getByText('Update Policy'));

    expect(handleStagedChange).toHaveBeenCalledTimes(1);
    const updated = handleStagedChange.mock.calls[0][0];
    const editedP1 = updated.find((c: CreateSlaConfigRequest) => c.priority === 1);
    expect(editedP1).toBeDefined();
    expect(editedP1.resolutionMinutes).toBe(360); // 6 hours * 60
  });

  it('automatically opens in custom hours mode when editing an SLA policy with non-preset minutes', () => {
    const customConfig: CreateSlaConfigRequest[] = [
      {
        priority: 1,
        resolutionMinutes: 300, // 5 hours (not in presets)
        workingDays: [1, 2, 3, 4, 5],
        workingHoursStart: '09:00:00',
        workingHoursEnd: '17:00:00',
        escalationHooks: null,
      },
    ];

    render(
      <SlaConfigSection
        stagedConfigs={customConfig}
        onStagedConfigsChange={vi.fn()}
      />
    );

    const editBtn = screen.getByText('Edit');
    fireEvent.click(editBtn);

    const numberInput = screen.getByRole('spinbutton');
    expect(numberInput).toBeDefined();
    expect((numberInput as HTMLInputElement).value).toBe('5');
  });
});
