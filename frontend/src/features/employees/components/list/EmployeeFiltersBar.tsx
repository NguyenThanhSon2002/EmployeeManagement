import React from 'react';
import type { Branch } from '@/types/domain.types';
import { Search, X } from 'lucide-react';
import { BranchSelect } from '@/components/common/BranchSelect';

interface EmployeeFiltersBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number | ((p: number) => number)) => void;
  branchesList: Branch[];
  selectedBranchId: number;
  setSelectedBranchId: (id: number) => void;
  isDirector: boolean;
  userBranchId: number;
  totalResults: number;
}

export const EmployeeFiltersBar: React.FC<EmployeeFiltersBarProps> = ({
  searchTerm,
  setSearchTerm,
  setCurrentPage,
  branchesList,
  selectedBranchId,
  setSelectedBranchId,
  isDirector,
  userBranchId,
  totalResults,
}) => {
  return (
    <div
      className="card"
      style={{
        padding: '12px 18px',
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', width: 290 }}>
          <Search
            size={15}
            color="var(--color-text-muted)"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="input-base"
            placeholder="Tìm theo họ tên, mã NV, email, SĐT..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              paddingLeft: 34,
              paddingRight: searchTerm ? 28 : 10,
              height: 36,
              fontSize: '12.5px',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Branch Filter */}
        <BranchSelect
          branches={branchesList}
          selectedBranchId={!isDirector ? userBranchId : selectedBranchId}
          disabled={!isDirector}
          disabledTooltip="Bạn chỉ có quyền xem nhân sự thuộc chi nhánh làm việc của mình"
          allowAll={isDirector}
          allLabel="Tất cả chi nhánh"
          allSubLabel="Xem nhân sự toàn bộ cơ sở"
          onChange={(id) => {
            if (!isDirector) return;
            setSelectedBranchId(id);
            setCurrentPage(1);
          }}
          minWidth={220}
        />
      </div>

      <div
        style={{
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          backgroundColor: '#F8FAFC',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        Hiển thị <strong style={{ color: 'var(--color-primary)' }}>{totalResults}</strong> kết quả
      </div>
    </div>
  );
};
