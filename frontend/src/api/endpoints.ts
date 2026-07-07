import apiClient from '../api/client';

// Auth
export const authApi = {
  login: (email: string, password: string) => apiClient.post('/auth/login', { email, password }),
  register: (data: object) => apiClient.post('/auth/register', data),
};

// Inventory
export const inventoryApi = {
  getAll: () => apiClient.get('/inventory'),
  create: (data: object) => apiClient.post('/inventory', data),
};

// Inspections
export const inspectionApi = {
  getAll: () => apiClient.get('/inspections'),
  create: (data: object) => apiClient.post('/inspections', data),
  updateStatus: (id: string, status: string, catatan?: string) =>
    apiClient.put(`/inspections/${id}/status`, { status, catatan }),
  updateMaterialStatus: (itemId: string, statusMaterial: string) =>
    apiClient.put(`/inspections/items/${itemId}/status`, { statusMaterial }),
};

// Users
export const userApi = {
  getAll: () => apiClient.get('/users'),
  create: (data: object) => apiClient.post('/users', data),
};

// Suppliers
export const supplierApi = {
  getAll: () => apiClient.get('/suppliers'),
  create: (data: object) => apiClient.post('/suppliers', data),
};
