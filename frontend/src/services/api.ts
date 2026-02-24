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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
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
  })
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
  getUserReservations: (userId: string) => apiCall(`/reservations/user/${userId}`),
  getFacilityReservations: (facilityId: string, date: string) =>
    apiCall(`/reservations/facility/${facilityId}/date/${date}`)
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

export default {
  userAPI,
  sportTypeAPI,
  facilityAPI,
  reservationAPI,
  queueAPI,
  checkinAPI,
  cancellationAPI
};
