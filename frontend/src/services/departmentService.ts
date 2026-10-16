import { api } from './apiClient';

export interface Department {
  id: number;
  department_code: string;
  department_name: string;
  parent_id?: number | null;
  manager_id?: number | null;
  is_active: boolean;
}

export const departmentService = {
  async getAllDepartments(): Promise<Department[]> {
    return api.get<Department[]>('/departments');
  },

  async getDepartmentById(id: number): Promise<Department> {
    return api.get<Department>(`/departments/${id}`);
  },
};
