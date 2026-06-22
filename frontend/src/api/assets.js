import { api } from './client'

export const assetsApi = {
  list: (page = 1, limit = 20) => api.get(`/assets/?page=${page}&limit=${limit}`),
  get: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets/', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  remove: (id) => api.delete(`/assets/${id}`),
}
