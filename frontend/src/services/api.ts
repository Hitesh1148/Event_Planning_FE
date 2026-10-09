const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('planwise_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('planwise_token', token);
  } else {
    localStorage.removeItem('planwise_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<any>('/auth/me'),
  forgotPassword: (email: string) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  // Groups
  getGroups: () => request<{ groups: any[] }>('/groups'),
  createGroup: (body: any) => request<{ group: any; message: string }>('/groups', { method: 'POST', body: JSON.stringify(body) }),
  getGroup: (groupId: string) => request<{ group: any }>(`/groups/${groupId}`),
  joinGroup: (inviteCode: string) => request<any>('/groups/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  inviteMember: (groupId: string, email: string) => request<any>(`/groups/${groupId}/invitations`, { method: 'POST', body: JSON.stringify({ email }) }),
  removeGroupMember: (groupId: string, userId: string) => request<any>(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),

  // Events
  getEvents: () => request<{ events: any[] }>('/events'),
  createEvent: (body: any) => request<{ event: any; message: string }>('/events', { method: 'POST', body: JSON.stringify(body) }),
  getEvent: (eventId: string) => request<{ event: any }>(`/events/${eventId}`),
  updateEvent: (eventId: string, body: any) => request<{ event: any }>(`/events/${eventId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  lockEvent: (eventId: string) => request<any>(`/events/${eventId}/lock`, { method: 'POST' }),
  overrideSelection: (eventId: string, proposalId: string, reason?: string) => request<any>(`/events/${eventId}/override-selection`, { method: 'POST', body: JSON.stringify({ proposalId, reason }) }),
  rsvpEvent: (eventId: string, rsvpStatus: string) => request<any>(`/events/${eventId}/rsvp`, { method: 'POST', body: JSON.stringify({ rsvpStatus }) }),

  // Proposals
  getProposals: (eventId: string) => request<{ proposals: any[] }>(`/events/${eventId}/proposals`),
  createProposal: (eventId: string, body: any) => request<any>(`/events/${eventId}/proposals`, { method: 'POST', body: JSON.stringify(body) }),
  deleteProposal: (proposalId: string) => request<any>(`/proposals/${proposalId}`, { method: 'DELETE' }),

  // Voting
  castVote: (proposalId: string, score: number, voteType: string = 'UP') => request<any>(`/proposals/${proposalId}/votes`, { method: 'POST', body: JSON.stringify({ score, voteType }) }),
  getVotingResults: (eventId: string) => request<any>(`/events/${eventId}/voting-results`),
  closeVoting: (eventId: string) => request<any>(`/events/${eventId}/close-voting`, { method: 'POST' }),
  reopenVoting: (eventId: string) => request<any>(`/events/${eventId}/reopen-voting`, { method: 'POST' }),

  // Availability
  getAvailability: (eventId: string) => request<any>(`/events/${eventId}/availability`),
  updateAvailability: (eventId: string, slots: any[]) => request<any>(`/events/${eventId}/availability`, { method: 'PUT', body: JSON.stringify({ slots }) }),

  // Budgets
  getBudgets: (eventId: string) => request<any>(`/events/${eventId}/budgets`),
  updateBudget: (eventId: string, body: any) => request<any>(`/events/${eventId}/budgets`, { method: 'PUT', body: JSON.stringify(body) }),

  // Recommendations
  runRecommendations: (eventId: string) => request<any>(`/events/${eventId}/recommendations/run`, { method: 'POST' }),
  getLatestRecommendations: (eventId: string) => request<{ latest: any }>(`/events/${eventId}/recommendations/latest`),
  simulateRecommendations: (eventId: string, body: any) => request<any>(`/events/${eventId}/recommendations/simulate`, { method: 'POST', body: JSON.stringify(body) }),

  // Tasks
  getTasks: (eventId: string) => request<{ tasks: any[] }>(`/events/${eventId}/tasks`),
  createTask: (eventId: string, body: any) => request<any>(`/events/${eventId}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (taskId: string, body: any) => request<any>(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTask: (taskId: string) => request<any>(`/tasks/${taskId}`, { method: 'DELETE' }),

  // Itinerary
  getItinerary: (eventId: string) => request<{ items: any[] }>(`/events/${eventId}/itinerary`),
  createItineraryItem: (eventId: string, body: any) => request<any>(`/events/${eventId}/itinerary`, { method: 'POST', body: JSON.stringify(body) }),
  deleteItineraryItem: (itemId: string) => request<any>(`/itinerary/${itemId}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: (eventId: string) => request<{ expenses: any[]; summary: any }>(`/events/${eventId}/expenses`),
  createExpense: (eventId: string, body: any) => request<any>(`/events/${eventId}/expenses`, { method: 'POST', body: JSON.stringify(body) }),
  deleteExpense: (expenseId: string) => request<any>(`/expenses/${expenseId}`, { method: 'DELETE' }),

  // Change Requests
  getChangeRequests: (eventId: string) => request<{ changeRequests: any[] }>(`/events/${eventId}/change-requests`),
  createChangeRequest: (eventId: string, body: any) => request<any>(`/events/${eventId}/change-requests`, { method: 'POST', body: JSON.stringify(body) }),
  approveChangeRequest: (requestId: string) => request<any>(`/change-requests/${requestId}/approve`, { method: 'POST' }),
  rejectChangeRequest: (requestId: string) => request<any>(`/change-requests/${requestId}/reject`, { method: 'POST' }),

  // Notifications
  getNotifications: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<any>('/notifications/mark-all-read', { method: 'POST' }),

  // Decision History
  getDecisionHistory: (eventId: string) => request<{ history: any[] }>(`/events/${eventId}/history`),

  // Venues
  getVenues: () => request<{ venues: any[]; mode: string; disclaimer: string }>('/venues'),
};
