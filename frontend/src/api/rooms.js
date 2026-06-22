import { api } from './client'

export const roomsApi = {
  list: (page = 1, limit = 100) => api.get(`/rooms/?page=${page}&limit=${limit}`),
  get: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms/', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  remove: (id) => api.delete(`/rooms/${id}`),
}
