/**
 * API Configuration and Base Service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3089/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  count?: number;
}

/**
 * Base API call function with error handling
 */
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Try to get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });

    let data: any;
    try {
      data = await response.json();
    } catch (e) {
      // If response is not JSON, create a simple error object
      data = {
        success: false,
        message: `HTTP error! status: ${response.status}`,
        error: `HTTP ${response.status}`
      };
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error('API Error:', error);
    return {
      success: false,
      message: 'API Error',
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * User API Service
 */
export const userAPI = {
  getAll: () => apiCall('/users'),
  getById: (id: string) => apiCall(`/users/${id}`),
  getByUsername: (username: string) => apiCall(`/users/profile/${username}`),
  login: (username: string, password: string) => apiCall('/users/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  create: (data: any) => apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => apiCall(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => apiCall(`/users/${id}`, {
    method: 'DELETE'
  }),
  ban: (id: string, reason: string, bannedUntil: Date) => apiCall(`/users/${id}/ban`, {
    method: 'POST',
    body: JSON.stringify({ reason, bannedUntil })
  }),
  unban: (id: string) => apiCall(`/users/${id}/unban`, {
    method: 'POST'
  }),
  getStats: () => apiCall('/users/stats')
};

/**
 * Sport Type API Service
 */
export const sportTypeAPI = {
  getAll: () => apiCall('/sport-types'),
  getById: (id: string) => apiCall(`/sport-types/${id}`),
  create: (data: any) => apiCall('/sport-types', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => apiCall(`/sport-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => apiCall(`/sport-types/${id}`, {
    method: 'DELETE'
  })
};

/**
 * Facility API Service
 */
export const facilityAPI = {
  getAll: () => apiCall('/facilities'),
  getById: (id: string) => apiCall(`/facilities/${id}`),
  getBySportType: (sportTypeId: string) => apiCall(`/facilities/by-sport/${sportTypeId}`),
  create: (data: any) => apiCall('/facilities', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => apiCall(`/facilities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => apiCall(`/facilities/${id}`, {
    method: 'DELETE'
  })
};

/**
 * Reservation API Service
 */
export const reservationAPI = {
  getAll: () => apiCall('/reservations'),
  getById: (id: string) => apiCall(`/reservations/${id}`),
  create: (data: any) => apiCall('/reservations', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => apiCall(`/reservations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  cancel: (id: string, reason: string) => apiCall(`/reservations/${id}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  }),
  delete: (id: string) => apiCall(`/reservations/${id}`, {
    method: 'DELETE'
  }),
  getUserReservations: (userId: string) => apiCall(`/reservations/user/${userId}`),
  getFacilityReservations: (facilityId: string, date: string) =>
    apiCall(`/reservations/facility/${facilityId}/date/${date}`),
  getAvailableSlots: (facilityId: string, date: string) =>
    apiCall(`/reservations/available-slots/${facilityId}?date=${date}`),
  getAvailable: (query?: string) =>
    apiCall(`/reservations/available/bookings${query ? '?' + query : ''}`)
};

/**
 * Queue API Service
 */
export const queueAPI = {
  getAll: () => apiCall('/queues'),
  getByReservation: (reservationId: string) =>
    apiCall(`/queues/reservation/${reservationId}`),
  join: (data: any) => apiCall('/queues/join', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  confirm: (id: string) => apiCall(`/queues/${id}/confirm`, {
    method: 'PUT'
  }),
  cancel: (id: string) => apiCall(`/queues/${id}/cancel`, {
    method: 'PUT'
  }),
  remove: (id: string) => apiCall(`/queues/${id}`, {
    method: 'DELETE'
  }),
  getUserPosition: (userId: string, reservationId: string) =>
    apiCall(`/queues/user/${userId}/reservation/${reservationId}`)
};

/**
 * CheckIn API Service
 */
export const checkinAPI = {
  getAll: () => apiCall('/checkins'),
  getById: (id: string) => apiCall(`/checkins/${id}`),
  checkin: (data: any) => apiCall('/checkins/checkin', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  checkout: (id: string) => apiCall(`/checkins/${id}/checkout`, {
    method: 'PUT'
  }),
  getTodayByFacility: (facilityId: string) =>
    apiCall(`/checkins/facility/${facilityId}/today`),
  getByReservation: (reservationId: string) =>
    apiCall(`/checkins/reservation/${reservationId}`)
};

/**
 * Cancellation API Service
 */
export const cancellationAPI = {
  getAll: () => apiCall('/cancellations'),
  getById: (id: string) => apiCall(`/cancellations/${id}`),
  request: (data: any) => apiCall('/cancellations', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  approve: (id: string, approvedBy: string, notes?: string) =>
    apiCall(`/cancellations/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approvedBy, notes })
    }),
  reject: (id: string, approvedBy: string, notes?: string) =>
    apiCall(`/cancellations/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ approvedBy, notes })
    }),
  getPending: () => apiCall('/cancellations/status/pending'),
  getUserCancellations: (userId: string) =>
    apiCall(`/cancellations/user/${userId}`)
};

/**
 * Statistics API Service
 */
export const statisticsAPI = {
  getBookings: (startDate: string, endDate: string) =>
    apiCall(`/statistics/bookings?startDate=${startDate}&endDate=${endDate}`),
  getFacilities: (startDate?: string, endDate?: string) => {
    let query = '';
    if (startDate && endDate) {
      query = `?startDate=${startDate}&endDate=${endDate}`;
    }
    return apiCall(`/statistics/facilities${query}`);
  },
  getUsers: (startDate?: string, endDate?: string) => {
    let query = '';
    if (startDate && endDate) {
      query = `?startDate=${startDate}&endDate=${endDate}`;
    }
    return apiCall(`/statistics/users${query}`);
  }
};

export default {
  userAPI,
  sportTypeAPI,
  facilityAPI,
  reservationAPI,
  queueAPI,
  checkinAPI,
  cancellationAPI
};
