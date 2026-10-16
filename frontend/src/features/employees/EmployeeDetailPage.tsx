import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Employee, Department } from '@/types/domain.types';
import { MOCK_EMPLOYEES } from '@/mocks/employees.mock';
import { MOCK_DEPARTMENTS } from '@/mocks/departments.mock';
import { MOCK_POSITIONS } from '@/mocks/positions.mock';
import { useScheduleStore } from '@/features/schedule/store/useScheduleStore';
import { employeeService } from './api/employeeService';
import { departmentService } from '@/shared/department/departmentService';
import { isMockEnabled } from '@/config/env.config';
import { formatDateVi } from '@/utils/date.utils';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Palmtree,
  Mail,
  Phone,
  Briefcase,
  Building,
} from 'lucide-react';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SCHEDULE' | 'ATTENDANCE' | 'LEAVE'>('PROFILE');

  const { assignments, approvedLeaves } = useScheduleStore();

  const [employee, setEmployee] = useState<Employee>(() => {
    return MOCK_EMPLOYEES.find((e) => e.id === Number(id)) || MOCK_EMPLOYEES[0];
  });
  const [departmentsList, setDepartmentsList] = useState<Department[]>(MOCK_DEPARTMENTS);

  useEffect(() => {
    if (isMockEnabled() || !id) return;

    let isMounted = true;
    const fetchEmployee = async () => {
      try {
        const [empData, deptData] = await Promise.all([
          employeeService.getEmployeeById(Number(id)).catch(() => null),
          departmentService.getAllDepartments().catch(() => null),
        ]);

        if (!isMounted) return;

        if (deptData && Array.isArray(deptData) && deptData.length > 0) {
          const mappedDepts: Department[] = deptData.map((d: any) => ({
            id: d.id,
            departmentCode: d.department_code || d.departmentCode,
            departmentName: d.department_name || d.departmentName,
            managerId: d.manager_id || d.managerId || null,
          }));
          setDepartmentsList(mappedDepts);
        }

        if (empData) {
          setEmployee({
            id: empData.id,
            employeeCode: empData.employee_code || (empData as any).employeeCode,
            fullName: empData.full_name || (empData as any).fullName,
            email: empData.email,
            phoneNumber: empData.phone_number || (empData as any).phoneNumber || '',
            nationalId: empData.national_id || (empData as any).nationalId || '',
            dateOfBirth: empData.date_of_birth || (empData as any).dateOfBirth || '',
            gender: empData.gender || 'OTHER',
            address: empData.address || '',
            departmentId: empData.department_id || (empData as any).departmentId || 1,
            positionId: empData.position_id || (empData as any).positionId || 1,
            managerId: empData.manager_id || (empData as any).managerId || null,
            employmentStatus: empData.employment_status || (empData as any).employmentStatus || 'OFFICIAL',
            employmentType: empData.employment_type || (empData as any).employmentType || 'FULL_TIME',
            hireDate: empData.hire_date || (empData as any).hireDate || '2026-01-01',
            isActive: empData.is_active !== undefined ? empData.is_active : true,
            version: empData.version || 1,
          });
        }
      } catch (err) {
        console.warn('Could not fetch employee by id from API:', err);
      }
    };

    fetchEmployee();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const dept = departmentsList.find((d) => d.id === employee.departmentId);
  const position = MOCK_POSITIONS.find((p) => p.id === employee.positionId);

  // Shifts of this employee
  const employeeShifts = Object.values(assignments).filter(
    (a) => a.employeeId === employee.id && a.status !== 'CANCELLED'
  );

  // Leaves of this employee
  const employeeLeaves = approvedLeaves.filter((l) => l.employeeId === employee.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Back button */}
      <div>
        <button
          type="button"
          className="btn btn-default"
          onClick={() => navigate('/employees')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32 }}
        >
          <ArrowLeft size={16} /> Quay láº¡i danh sÃ¡ch
        </button>
      </div>

      {/* Profile Header Banner */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img
            src={
              employee.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
            }
            alt={employee.fullName}
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-full)',
              objectFit: 'cover',
              border: '3px solid var(--color-border)',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 'var(--font-h2)', fontWeight: 700 }}>{employee.fullName}</h1>
              <span className="badge badge-info">{employee.employeeCode}</span>
              {employee.isActive ? (
                <span className="badge badge-success">
                  <span className="badge-dot" /> Äang lÃ m viá»‡c
                </span>
              ) : (
                <span className="badge badge-error">
                  <span className="badge-dot" /> ÄÃ£ nghá»‰ viá»‡c
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 'var(--font-caption)', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Building size={14} color="var(--color-primary)" /> {dept?.departmentName}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Briefcase size={14} color="var(--color-primary)" /> {position?.positionName}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={14} /> {employee.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={14} /> {employee.phoneNumber}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Tabs Bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--color-border-subtle)',
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('PROFILE')}
          style={{
            padding: '10px 16px',
            fontSize: 'var(--font-body-md)',
            fontWeight: activeTab === 'PROFILE' ? 600 : 500,
            color: activeTab === 'PROFILE' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'PROFILE' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: -2,
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <User size={16} /> LÃ½ Lá»‹ch & Há»£p Äá»“ng
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SCHEDULE')}
          style={{
            padding: '10px 16px',
            fontSize: 'var(--font-body-md)',
            fontWeight: activeTab === 'SCHEDULE' ? 600 : 500,
            color: activeTab === 'SCHEDULE' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'SCHEDULE' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: -2,
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Calendar size={16} /> Lá»‹ch Ca ({employeeShifts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ATTENDANCE')}
          style={{
            padding: '10px 16px',
            fontSize: 'var(--font-body-md)',
            fontWeight: activeTab === 'ATTENDANCE' ? 600 : 500,
            color: activeTab === 'ATTENDANCE' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'ATTENDANCE' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: -2,
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Clock size={16} /> Báº£ng Cháº¥m CÃ´ng
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LEAVE')}
          style={{
            padding: '10px 16px',
            fontSize: 'var(--font-body-md)',
            fontWeight: activeTab === 'LEAVE' ? 600 : 500,
            color: activeTab === 'LEAVE' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'LEAVE' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: -2,
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Palmtree size={16} /> Nghá»‰ PhÃ©p ({employeeLeaves.length})
        </button>
      </div>

      {/* Tab 1: Profile & Organization */}
      {activeTab === 'PROFILE' && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600, marginBottom: 16 }}>
            ThÃ´ng Tin Há»£p Äá»“ng & NhÃ¢n Sá»±
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>MÃ£ nhÃ¢n viÃªn</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{employee.employeeCode}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Há» vÃ  tÃªn</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{employee.fullName}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>PhÃ²ng ban trá»±c thuá»™c</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{dept?.departmentName}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Chá»©c danh chuyÃªn mÃ´n</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{position?.positionName}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Loáº¡i hÃ¬nh há»£p Ä‘á»“ng</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>Há»£p Ä‘á»“ng lao Ä‘á»™ng khÃ´ng xÃ¡c Ä‘á»‹nh thá»i háº¡n</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>NgÃ y kÃ½ há»£p Ä‘á»“ng / VÃ o lÃ m</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{formatDateVi(employee.hireDate)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Shift Schedule */}
      {activeTab === 'SCHEDULE' && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600, marginBottom: 14 }}>
            Danh SÃ¡ch Ca LÃ m Viá»‡c ÄÆ°á»£c PhÃ¢n CÃ´ng ({employeeShifts.length} ca)
          </h3>
          {employeeShifts.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              NhÃ¢n viÃªn nÃ y hiá»‡n chÆ°a Ä‘Æ°á»£c xáº¿p ca trong ká»³ phÃ¢n ca hiá»‡n táº¡i.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {employeeShifts.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: a.snapshotColorCode ? `${a.snapshotColorCode}15` : '#f5f5f5',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{a.snapshotShiftName}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    NgÃ y: <strong>{formatDateVi(a.workDate)}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Khung giá»: {a.snapshotStartTime} - {a.snapshotEndTime}
                    {a.snapshotCrossMidnight && ' (+1 ngÃ y)'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Attendance History */}
      {activeTab === 'ATTENDANCE' && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600, marginBottom: 14 }}>
            Báº£ng Cháº¥m CÃ´ng Gáº§n Nháº¥t
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: '#fafafa',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>HÃ´m nay (Ca SÃ¡ng)</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>VÃ o ca: 07:55:12 â€¢ ChÆ°a ra ca</div>
              </div>
              <span className="badge badge-success"><span className="badge-dot" /> CÃ³ máº·t</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Leave Quotas & History */}
      {activeTab === 'LEAVE' && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>Quá»¹ PhÃ©p & ÄÆ¡n Nghá»‰ PhÃ©p</h3>
            <div style={{ padding: '6px 12px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 'var(--radius-md)', color: '#389e0d', fontWeight: 600, fontSize: 13 }}>
              Quá»¹ phÃ©p nÄƒm: 8.5 / 12.0 ngÃ y cÃ²n láº¡i
            </div>
          </div>

          {employeeLeaves.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              NhÃ¢n viÃªn chÆ°a cÃ³ Ä‘Æ¡n nghá»‰ phÃ©p nÃ o trong ká»³ nÃ y.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {employeeLeaves.map((l) => (
                <div
                  key={l.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--shift-leave-border)',
                    backgroundColor: 'var(--shift-leave-bg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--shift-leave-text)' }}>{l.leaveTypeName}</div>
                    <div style={{ fontSize: 12, marginTop: 2 }}>
                      NgÃ y nghá»‰: {formatDateVi(l.startDate)} â€¢ LÃ½ do: {l.reason}
                    </div>
                  </div>
                  <span className="badge badge-success"><span className="badge-dot" /> ÄÃ£ duyá»‡t</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
