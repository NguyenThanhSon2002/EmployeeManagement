import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShiftTemplateFormModal } from '../components/ShiftTemplateFormModal';
import { ShiftTemplateCard } from '../components/ShiftTemplateCard';
import type { ShiftTemplate } from '@/types/domain.types';

const mockTemplate: ShiftTemplate = {
  id: 1,
  shiftCode: 'CA_SANG',
  shiftName: 'Ca Sáng (06:00 - 14:00)',
  startTime: '06:00:00',
  endTime: '14:00:00',
  breakMinutes: 30,
  isCrossMidnight: false,
  colorCode: '#E6F7FF',
  textColor: '#0958D9',
  minStaffing: 3,
  maxStaffing: 10,
  applicableDays: '1,2,3,4,5,6,7',
  isActive: true,
};

describe('ShiftTemplateCard Component (UI/UX Pro Max)', () => {
  it('renders cleaned up hours without seconds and displays staffing quota', () => {
    render(
      <ShiftTemplateCard
        template={mockTemplate}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Formatted time without trailing seconds
    expect(screen.getByText('06:00 - 14:00')).toBeInTheDocument();
    expect(screen.getByText('CA_SANG')).toBeInTheDocument();
    expect(screen.getByText('Ca Sáng (06:00 - 14:00)')).toBeInTheDocument();
    expect(screen.getByText(/3 - 10/)).toBeInTheDocument();
    expect(screen.getByText(/Nghỉ 30p/i)).toBeInTheDocument();
  });

  it('calls onEdit when clicking "Chỉnh sửa"', () => {
    const handleEdit = vi.fn();
    render(
      <ShiftTemplateCard
        template={mockTemplate}
        onEdit={handleEdit}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Chỉnh sửa/i }));
    expect(handleEdit).toHaveBeenCalledWith(mockTemplate);
  });
});

describe('ShiftTemplateFormModal Component (Simple KISS + Sticky Footer)', () => {
  it('renders simple edit modal with populated fields and smart hours calculation', () => {
    render(
      <ShiftTemplateFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialData={mockTemplate}
      />
    );

    expect(screen.getByText('Chỉnh Sửa Mẫu Ca Làm Việc')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CA_SANG')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ca Sáng (06:00 - 14:00)')).toBeInTheDocument();
    // 06:00 - 14:00 is 8h, minus 30m break = 7.5h
    expect(screen.getByText(/7.5h công thực tế/i)).toBeInTheDocument();
    // Sticky footer prominent button
    expect(screen.getByRole('button', { name: /Lưu thay đổi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hủy bỏ/i })).toBeInTheDocument();
  });

  it('detects overnight shift when end time is earlier than start time', () => {
    const overnightTemplate: ShiftTemplate = {
      ...mockTemplate,
      id: 4,
      shiftCode: 'CA_DEM',
      shiftName: 'Ca Đêm (22:00 - 06:00)',
      startTime: '22:00',
      endTime: '06:00',
      isCrossMidnight: true,
    };

    render(
      <ShiftTemplateFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialData={overnightTemplate}
      />
    );

    expect(screen.getByText(/Ca qua đêm \(\+1\)/i)).toBeInTheDocument();
  });

  it('validates staffing quota when max is less than min', () => {
    const handleSave = vi.fn();
    render(
      <ShiftTemplateFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        initialData={mockTemplate}
      />
    );

    const minInput = screen.getByDisplayValue('3');
    const maxInput = screen.getByDisplayValue('10');

    fireEvent.change(minInput, { target: { value: '8' } });
    fireEvent.change(maxInput, { target: { value: '2' } });

    fireEvent.click(screen.getByRole('button', { name: /Lưu thay đổi/i }));

    expect(
      screen.getByText('Định biên tối đa không được nhỏ hơn định biên tối thiểu.')
    ).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('submits form successfully when clicking "Lưu thay đổi"', () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();
    render(
      <ShiftTemplateFormModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        initialData={mockTemplate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Lưu thay đổi/i }));

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
