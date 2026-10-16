import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import type { Employee } from '@/types/domain.types';

describe('DeleteConfirmModal', () => {
  const mockEmployee: Employee = {
    id: 99,
    employeeCode: 'EMP-099',
    fullName: 'Hoàng Văn Test',
    email: 'test.hoang@company.com',
    phoneNumber: '0909999999',
    departmentId: 1,
    positionId: 2,
    managerId: null,
    employmentStatus: 'OFFICIAL',
    hireDate: '2024-01-01',
    isActive: true,
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <DeleteConfirmModal
        isOpen={false}
        employee={mockEmployee}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders employee info and confirmation text when isOpen is true', () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        employee={mockEmployee}
        departmentName="Phòng Công Nghệ Thông Tin"
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('Xác nhận xóa hồ sơ nhân viên')).toBeInTheDocument();
    expect(screen.getByText('Hoàng Văn Test')).toBeInTheDocument();
    expect(screen.getByText('EMP-099')).toBeInTheDocument();
    expect(screen.getByText('Phòng Công Nghệ Thông Tin')).toBeInTheDocument();
    expect(screen.getByText('test.hoang@company.com')).toBeInTheDocument();
  });

  it('calls onClose when clicking Hủy bỏ', () => {
    const handleClose = vi.fn();
    render(
      <DeleteConfirmModal
        isOpen={true}
        employee={mockEmployee}
        isDeleting={false}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hủy bỏ' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when clicking Xác nhận xóa', () => {
    const handleConfirm = vi.fn();
    render(
      <DeleteConfirmModal
        isOpen={true}
        employee={mockEmployee}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Xác nhận xóa/i }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when isDeleting is true', () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        employee={mockEmployee}
        isDeleting={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Hủy bỏ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Đang xóa/i })).toBeDisabled();
  });
});
