import { describe, it, expect } from 'vitest';
import { generateSlugCode } from '../code-generator.utils';

describe('code-generator.utils', () => {
  it('should generate uppercase slug with underscore replacing spaces and symbols', () => {
    const result = generateSlugCode('Chi nhánh Cầu Giấy');
    expect(result).toBe('CHI_NHANH_CAU_GIAY');
  });

  it('should handle Vietnamese characters with accents correctly', () => {
    const result = generateSlugCode('Đà Nẵng & Hồ Chí Minh');
    expect(result).toBe('DA_NANG_HO_CHI_MINH');
  });

  it('should prefix slug if prefix is provided', () => {
    const result = generateSlugCode('Nhân sự', 'HR_');
    expect(result).toBe('HR_NHAN_SU');
  });

  it('should not duplicate prefix if slug already starts with prefix', () => {
    const result = generateSlugCode('HR_MANAGER', 'HR_');
    expect(result).toBe('HR_MANAGER');
  });

  it('should return fallback timestamp when input is empty string', () => {
    const result = generateSlugCode('', 'PREFIX_');
    expect(result.startsWith('PREFIX_')).toBe(true);
    expect(result.length).toBeGreaterThan('PREFIX_'.length);
  });

  it('should return fallback timestamp when input consists only of non-alphanumeric symbols', () => {
    const result = generateSlugCode('@#$%^&*', 'HR_');
    expect(result.startsWith('HR_')).toBe(true);
    expect(result.length).toBeGreaterThan('HR_'.length);
  });
});
