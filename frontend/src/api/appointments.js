import { api } from './client'

export const doctorsApi = {
  list: () => api.get('/doctors'),
  slots: (doctorId, date) => api.get(`/doctors/${doctorId}/slots?date=${date}`),
}

export const appointmentsApi = {
  book: (data) => api.post('/appointments', data),
  mine: () => api.get('/appointments/mine'),
  update: (id, status) => api.put(`/appointments/${id}`, { status }),
}
