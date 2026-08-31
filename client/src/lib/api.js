// client/src/lib/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor to inject JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kcet_od_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / unauth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials and force reload if session expired, except during login checks
      if (!window.location.pathname.includes('/login') && localStorage.getItem('kcet_od_token')) {
        localStorage.removeItem('kcet_od_token');
        window.location.href = '/?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// --- API SERVICES IMPLEMENTATION ---

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  requestStaffPasswordResetOtp: async (email) => {
    const res = await api.post('/auth/staff/password-reset/request', { email });
    return res.data;
  },
  verifyStaffPasswordResetOtp: async (email, otp) => {
    const res = await api.post('/auth/staff/password-reset/verify', { email, otp });
    return res.data;
  },
  completeStaffPasswordReset: async (email, newPassword) => {
    const res = await api.post('/auth/staff/password-reset/complete', { email, newPassword });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

export const studentService = {
  getDashboard: async () => {
    const res = await api.get('/student/dashboard');
    return res.data;
  },
  getRequests: async () => {
    const res = await api.get('/student/requests');
    return res.data;
  },
  getRequestDetail: async (id) => {
    const res = await api.get(`/student/request/${id}`);
    return res.data;
  },
  submitRequest: async (formData) => {
    const res = await api.post('/student/request', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },
  downloadPdf: async (id) => {
    const res = await api.get(`/student/request/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `OD-LETTER-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  }
};

export const staffService = {
  getQueue: async () => {
    const res = await api.get('/staff/queue');
    return res.data;
  },
  approveRequest: async (id, remarks) => {
    const res = await api.post(`/staff/approve/${id}`, { remarks });
    return res.data;
  },
  bulkApprove: async (requestIds, remarks) => {
    const res = await api.post(`/staff/bulk-approve`, { requestIds, remarks });
    return res.data;
  },
  rejectRequest: async (id, remarks) => {
    const res = await api.post(`/staff/reject/${id}`, { remarks });
    return res.data;
  },
  searchStudents: async (query) => {
    const res = await api.get(`/staff/search-students?q=${encodeURIComponent(query)}`);
    return res.data;
  },
  applyBulkOd: async (formData) => {
    const res = await api.post('/staff/apply-bulk-od', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getHistory: async () => {
    const res = await api.get('/staff/history');
    return res.data;
  },
  getApprovedOds: async () => {
    const res = await api.get('/staff/approved-ods');
    return res.data;
  }
};

export const notificationService = {
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.put('/notifications/read');
    return res.data;
  }
};

export const adminService = {
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  createUser: async (userData) => {
    const res = await api.post('/admin/users', userData);
    return res.data;
  },
  updateUser: async (id, userData) => {
    const res = await api.put(`/admin/users/${id}`, userData);
    return res.data;
  },
  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },
  getRequests: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await api.get(`/admin/requests?${params}`);
    return res.data;
  },
  getReport: async () => {
    const res = await api.get('/admin/report');
    return res.data;
  },
  downloadExport: async () => {
    const res = await api.get('/admin/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'OD-SYSTEM-REPORT.csv');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  }
};

export const publicService = {
  verifyOD: async (odCode) => {
    // Note the public endpoint doesn't require a token
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const res = await axios.get(`${baseUrl}/public/verify/${odCode}`);
    return res.data;
  }
};

export default api;
