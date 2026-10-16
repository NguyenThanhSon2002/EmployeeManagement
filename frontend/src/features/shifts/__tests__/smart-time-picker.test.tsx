import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartTimePicker } from '../components/SmartTimePicker';

describe('SmartTimePicker Component (Desktop Optimized)', () => {
  it('renders input with formatted 24h time and label', () => {
    render(
      <SmartTimePicker
        label="Bắt đầu"
        value="09:30"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Bắt đầu')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09:30')).toBeInTheDocument();
  });

  it('allows typing direct 24h time and triggers onChange', () => {
    const handleChange = vi.fn();
    render(
      <SmartTimePicker
        label="Bắt đầu"
        value="09:30"
        onChange={handleChange}
      />
    );

    const input = screen.getByDisplayValue('09:30');
    fireEvent.change(input, { target: { value: '14:45' } });
    fireEvent.blur(input);

    expect(handleChange).toHaveBeenCalledWith('14:45');
  });

  it('normalizes single digit hour on blur e.g. "8" to "08:00"', () => {
    const handleChange = vi.fn();
    render(
      <SmartTimePicker
        label="Bắt đầu"
        value="09:30"
        onChange={handleChange}
      />
    );

    const input = screen.getByDisplayValue('09:30');
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.blur(input);

    expect(handleChange).toHaveBeenCalledWith('08:00');
  });

  it('opens dropdown when clicking the input or chevron button', () => {
    render(
      <SmartTimePicker
        label="Bắt đầu"
        value="09:30"
        onChange={vi.fn()}
      />
    );

    const chevronBtn = screen.getByRole('button', { name: /Mở danh sách mốc giờ Bắt đầu/i });
    fireEvent.click(chevronBtn);

    // Dropdown contains presets and slots
    expect(screen.getByTestId('preset-08:00')).toBeInTheDocument();
    expect(screen.getByTestId('preset-14:00')).toBeInTheDocument();
    expect(screen.getByTestId('slot-08:00')).toBeInTheDocument();
  });

  it('updates time when clicking a quick preset', () => {
    const handleChange = vi.fn();
    render(
      <SmartTimePicker
        label="Bắt đầu"
        value="09:30"
        onChange={handleChange}
      />
    );

    const chevronBtn = screen.getByRole('button', { name: /Mở danh sách mốc giờ Bắt đầu/i });
    fireEvent.click(chevronBtn);

    const presetBtn = screen.getByTestId('preset-14:00');
    fireEvent.click(presetBtn);

    expect(handleChange).toHaveBeenCalledWith('14:00');
  });

  it('updates time when clicking a time slot from dropdown list and closes dropdown', () => {
    const handleChange = vi.fn();
    render(
      <SmartTimePicker
        label="Bắt đầu"
        value="09:30"
        onChange={handleChange}
      />
    );

    const input = screen.getByDisplayValue('09:30');
    fireEvent.click(input);

    // Pick 10:00 from the slot list
    const slot10 = screen.getByTestId('slot-10:00');
    fireEvent.click(slot10);

    expect(handleChange).toHaveBeenCalledWith('10:00');
    // Dropdown should be closed
    expect(screen.queryByTestId('slot-10:00')).not.toBeInTheDocument();
  });

  it('closes dropdown when pressing Escape key', () => {
    render(
      <SmartTimePicker
        label="Bắt đầu"
        value="09:30"
        onChange={vi.fn()}
      />
    );

    const input = screen.getByDisplayValue('09:30');
    fireEvent.click(input);
    expect(screen.getByTestId('slot-10:00')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('slot-10:00')).not.toBeInTheDocument();
  });
});
