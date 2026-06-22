import { api } from './client'

export const adminApi = {
  listUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getReports: () => api.get('/admin/reports'),
  getAuditLogs: () => api.get('/admin/audit-logs'),
}
