import { api } from './client'

export const patientsApi = {
  list: (page = 1, limit = 20, search = '', status = '') =>
    api.get(`/patients/?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${status}`),
  get: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients/', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  remove: (id) => api.delete(`/patients/${id}`),
}
