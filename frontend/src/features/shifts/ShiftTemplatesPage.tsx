import React, { useState } from 'react';
import { useScheduleStore } from '@/features/schedule/store/useScheduleStore';
import { useUIStore } from '@/shared/store/useUIStore';
import type { ShiftTemplate } from '@/types/domain.types';
import { ShiftTemplateCard } from './components/ShiftTemplateCard';
import { ShiftTemplateFormModal } from './components/ShiftTemplateFormModal';
import { Plus, ShieldAlert } from 'lucide-react';

export const ShiftTemplatesPage: React.FC = () => {
  const { shiftTemplates, addShiftTemplate, updateShiftTemplate, deleteShiftTemplate } =
    useScheduleStore();
  const { addToast } = useUIStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (template: ShiftTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    const res = deleteShiftTemplate(id);
    if (res.success) {
      addToast({
        type: 'success',
        title: 'Đã xóa mẫu ca',
        message: 'Mẫu ca làm việc đã được xóa khỏi danh mục chuẩn.',
      });
    } else {
      addToast({
        type: 'error',
        title: 'Không thể xóa mẫu ca',
        message: res.error || 'Mẫu ca đang được phân công trong lịch tuần.',
      });
    }
  };

  const handleSave = (data: Omit<ShiftTemplate, 'id'>, editId?: number) => {
    if (editId) {
      updateShiftTemplate(editId, data);
      addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: `Mẫu ca ${data.shiftName} đã được cập nhật. Lịch tuần cũ vẫn được bảo vệ nguyên vẹn theo cơ chế snapshot.`,
      });
    } else {
      addShiftTemplate(data);
      addToast({
        type: 'success',
        title: 'Thêm mẫu ca thành công',
        message: `Mẫu ca mới ${data.shiftName} đã sẵn sàng để phân công trên Bảng Lịch Tuần.`,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Danh Mục Mẫu Ca Làm Việc (SCR-10)
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 2, fontSize: '13.5px' }}>
            Quản lý chuẩn hóa khung giờ ca làm việc, định biên nhân sự tối thiểu/tối đa và mã màu WCAG AA.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCreateNew}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} /> Thêm Mẫu Ca Mới
        </button>
      </div>

      {/* Snapshotting Notice Banner */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)',
          border: '1px solid #BFDBFE',
          color: '#1D4ED8',
          fontSize: '13px',
        }}
      >
        <ShieldAlert size={22} style={{ flexShrink: 0, color: 'var(--color-primary)' }} />
        <div>
          <strong style={{ fontWeight: 700 }}>Cơ chế bảo vệ Snapshotting:</strong> Khi điều chỉnh giờ hoặc định biên của mẫu ca, các phân công ca đã tạo trong lịch tuần quá khứ và hiện tại không bị ảnh hưởng hồi tố nhờ cơ chế lưu bản chụp (snapshot).
        </div>
      </div>

      {/* Templates Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {shiftTemplates.map((template) => (
          <ShiftTemplateCard
            key={template.id}
            template={template}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Form Modal */}
      <ShiftTemplateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingTemplate}
      />
    </div>
  );
};
