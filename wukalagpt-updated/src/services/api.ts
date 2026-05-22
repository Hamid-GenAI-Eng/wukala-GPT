/**
 * API Service Layer for Wukala-GPT Backend
 *
 * Centralized HTTP client for communicating with the Azure-hosted backend.
 * All API calls should go through this service.
 */

// Base API URL - Update this with your actual Azure backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Request timeout in milliseconds (increased for large file uploads and Azure cold-starts)
const REQUEST_TIMEOUT = 120000;

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Get the auth token from localStorage
 */
function getAuthToken(): string | null {
  return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
}

/**
 * Build headers for API requests
 */
function buildHeaders(contentType?: string, includeAuth: boolean = true): HeadersInit {
  const headers: Record<string, string> = {};

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Handle API response and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status} at ${response.url}`;
    let data: unknown = undefined;

    try {
      const text = await response.text();
      try {
        data = JSON.parse(text);
        errorMessage = (data as Record<string, unknown>)?.message as string || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
    } catch {
      // Ignore text reading errors
    }

    throw new ApiError(errorMessage, response.status, data);
  }

  // Handle no-content responses
  if (response.status === 204 || response.status === 205) {
    return {} as T;
  }

  return response.json();
}

/**
 * Generic request function with timeout and params support
 */
async function request<T>(
  endpoint: string,
  options: RequestInit & { params?: Record<string, any> } = {},
  includeAuth: boolean = true
): Promise<T> {
  let queryString = '';
  if (options.params) {
    const params = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const s = params.toString();
    if (s) queryString = `?${s}`;
  }

  const url = `${API_BASE_URL}${endpoint}${queryString}`;
  const headers = buildHeaders(
    options.body instanceof FormData ? undefined : 'application/json',
    includeAuth
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
      signal: controller.signal,
      cache: 'no-store', // Prevent aggressive browser caching for GET requests
    });

    clearTimeout(timeoutId);
    return handleResponse<T>(response);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }

    throw new ApiError('Network error. Please check your connection.', 0);
  }
}

/**
 * API Methods
 */
export const api = {
  // ==================== AUTH ENDPOINTS ====================

  /**
   * Login user with email and password
   * Note: The backend returns { token, message }. The user profile
   * should be fetched separately via getProfile() after setting the token.
   */
  login: async (email: string, password: string) => {
    return request<{ token: string; message: string }>('/Auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
  },

  /**
   * Register a new client user
   */
  registerClient: async (data: {
    fullName: string;
    email: string;
    phoneNo: string;
    city: string;
    password: string;
  }) => {
    return request<{ user: User; message: string }>('/Auth/register-client', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
  },

  /**
   * Register a new lawyer user (with application for review)
   */
  registerLawyer: async (formData: FormData) => {
    return request<{ application: LawyerApplication; message: string }>('/Auth/register-lawyer', {
      method: 'POST',
      body: formData,
    }, false);
  },

  /**
   * Verify OTP code
   */
  verifyOtp: async (email: string, otpCode: string) => {
    return request<{ verified: boolean; user?: User; token?: string }>('/Auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode }),
    }, false);
  },

  /**
   * Resend OTP code
   */
  resendOtp: async (email: string) => {
    return request<{ message: string }>('/Auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false);
  },

  /**
   * Request password reset link
   */
  forgotPassword: async (email: string) => {
    return request<{ message: string }>('/Auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false);
  },

  /**
   * Reset password using token
   */
  resetPassword: async (data: { email: string; token: string; newPassword: string }) => {
    return request<{ message: string }>('/Auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
  },

  /**
   * Change password for logged-in user
   */
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    return request<{ message: string }>('/Auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Logout user (invalidate token)
   */
  logout: async () => {
    return request<{ message: string }>('/Auth/logout', {
      method: 'POST',
    }, true);
  },

  /**
   * Get current user profile (Me)
   */
  getProfile: async () => {
    const userData = await request<User>('/Auth/me', {
      method: 'GET',
    }, true);
    
    // Normalize role to lowercase for frontend consistency
    if (userData && typeof userData.role === 'string') {
      userData.role = userData.role.toLowerCase() as any;
    }
    
    return userData;
  },

  // ==================== LAWYER PROFILE ENDPOINTS ====================

  /**
   * Get current lawyer profile
   */
  getLawyerMe: async () => {
    return request<any>('/Lawyers/me', {
      method: 'GET',
    }, true);
  },

  /**
   * Update current lawyer profile
   */
  updateLawyerMe: async (data: any) => {
    return request<any>('/Lawyers/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Update lawyer profile photo
   */
  uploadLawyerPhoto: async (formData: FormData) => {
    return request<{ photoUrl: string }>('/Lawyers/me/photo', {
      method: 'POST',
      body: formData,
    }, true);
  },

  /**
   * Upload proof document/image
   */
  uploadProofDocument: async (formData: FormData) => {
    return request<{ url: string }>('/Lawyers/me/document', {
      method: 'POST',
      body: formData,
    }, true);
  },

  /**
   * Upload chat attachment (voice, document) - accessible to both Clients and Lawyers
   */
  uploadChatAttachment: async (formData: FormData) => {
    return request<{ url: string }>('/Messages/upload', {
      method: 'POST',
      body: formData,
    }, true);
  },

  /**
   * Get lawyer dashboard overview statistics and items
   */
  getLawyerDashboardOverview: async () => {
    return request<any>('/Dashboard/lawyer-overview', {
      method: 'GET',
    }, true);
  },

  // --- Experience ---
  addExperience: async (data: ExperienceRequest) => {
    return request<ExperienceResponse>('/Lawyers/me/experience', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  updateExperience: async (id: string, data: ExperienceRequest) => {
    return request<ExperienceResponse>(`/Lawyers/me/experience/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  },

  deleteExperience: async (id: string) => {
    return request<{ message: string }>(`/Lawyers/me/experience/${id}`, {
      method: 'DELETE',
    }, true);
  },

  // --- Education ---
  addEducation: async (data: EducationRequest) => {
    return request<EducationResponse>('/Lawyers/me/education', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  updateEducation: async (id: string, data: EducationRequest) => {
    return request<EducationResponse>(`/Lawyers/me/education/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  },

  deleteEducation: async (id: string) => {
    return request<{ message: string }>(`/Lawyers/me/education/${id}`, {
      method: 'DELETE',
    }, true);
  },

  // --- Specialities ---
  getSpecialities: async () => {
    return request<SpecialityResponse[]>('/Lawyers/specialities', {
      method: 'GET',
    }, true);
  },

  updateSpecialities: async (specialityIds: string[]) => {
    return request<{ message: string }>('/Lawyers/me/specialities', {
      method: 'PUT',
      body: JSON.stringify(specialityIds),
    }, true);
  },

  // --- Badges ---
  updateLawyerBadgesSelf: async (id: string, badges: string[]) => {
    return request<{ message: string }>(`/Lawyers/${id}/badges`, {
      method: 'PUT',
      body: JSON.stringify(badges),
    }, true);
  },

  /**
   * Get list of lawyer applications (Admin)
   */
  getLawyers: async (status?: number) => {
    const res = await request<any[]>('/Admin/lawyers', {
      method: 'GET',
      params: status !== undefined ? { status } : undefined,
    }, true);
    return res.map(app => ({
      ...app,
      fullName: app.fullName || `${app.firstName || ''} ${app.lastName || ''}`.trim() || 'Unnamed',
      degree: app.degree || app.degreeFileUrl || app.DegreeFileUrl || app.degreeDocument || app.DegreeDocument,
      introVideo: app.introVideo || app.introVideoUrl || app.IntroVideoUrl || app.video || app.Video,
      status: app.status ?? app.verificationStatus,
      submittedAt: app.submittedAt || app.createdAt || new Date().toISOString(),
    })) as LawyerApplication[];
  },

  /**
   * Verify a lawyer application (Admin)
   */
  verifyLawyer: async (id: string, status: number, reviewNotes: string) => {
    return request<{ message: string }>(`/Admin/lawyers/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ 
        Status: status, 
        ReviewNotes: reviewNotes 
      }),
    }, true);
  },

  /**
   * Delete a lawyer application entirely (Admin/Emergency)
   * Used for cleanup of ghost/orphaned records.
   */
  deleteLawyerApplication: async (id: string) => {
    return request<{ message: string }>(`/Admin/lawyers/${id}`, {
      method: 'DELETE',
    }, true);
  },

  /**
   * Suspend or unsuspend a user (Admin)
   */
  suspendUser: async (id: string, isSuspended: boolean, reason?: string) => {
    return request<{ message: string }>(`/Admin/users/${id}/suspend`, {
      method: 'PUT',
      body: JSON.stringify({ isSuspended, reason }),
    }, true);
  },

  /**
   * Update lawyer badges (Admin)
   */
  updateLawyerBadges: async (id: string, badges: string[]) => {
    return request<{ message: string }>(`/Admin/lawyers/${id}/badges`, {
      method: 'PUT',
      body: JSON.stringify(badges),
    }, true);
  },

  /**
   * Get platform statistics (Admin)
   */
  getAdminStats: async () => {
    const res = await request<any>('/Admin/stats', {
      method: 'GET',
    }, true);
    
    return {
      totalUsers: res.totalUsers ?? res.TotalUsers ?? ((res.totalActiveUsers || 0) + (res.totalSuspendedUsers || 0)),
      totalLawyers: res.totalLawyers ?? res.TotalLawyers ?? 0,
      totalClients: res.totalClients ?? res.TotalClients ?? 0,
      pendingVerifications: res.pendingVerifications ?? res.PendingVerifications ?? res.pendingLawyerApprovals ?? 0,
      approvedVerifications: res.approvedVerifications ?? res.ApprovedVerifications ?? 0,
      rejectedVerifications: res.rejectedVerifications ?? res.RejectedVerifications ?? 0,
      activeChats: res.activeChats ?? res.ActiveChats ?? 0,
      totalDocuments: res.totalDocuments ?? res.TotalDocuments ?? 0,
    } as AdminStats;
  },

  // ==================== DOCUMENT ENDPOINTS ====================

  /**
   * Get list of documents with optional filtering
   */
  getDocuments: async (type?: number, search?: string) => {
    return request<DocumentResponse[]>('/Documents', {
      method: 'GET',
      params: { type, search },
    }, true);
  },

  /**
   * Upload a new document
   */
  uploadDocument: async (file: File, optionalTitle?: string, legalCaseId?: string) => {
    const formData = new FormData();
    formData.append('File', file);
    if (optionalTitle) {
      formData.append('OptionalTitle', optionalTitle);
    }
    if (legalCaseId) {
      formData.append('LegalCaseId', legalCaseId);
    }
    return request<DocumentResponse>('/Documents', {
      method: 'POST',
      body: formData,
    }, true);
  },

  /**
   * Get a specific document by ID
   */
  getDocument: async (id: string) => {
    return request<DocumentResponse>(`/Documents/${id}`, {
      method: 'GET',
    }, true);
  },

  /**
   * Delete a document by ID
   */
  deleteDocument: async (id: string) => {
    return request<{ message: string }>(`/Documents/${id}`, {
      method: 'DELETE',
    }, true);
  },

  // ==================== SEARCH ENDPOINTS ====================

  /**
   * Search for lawyers with filters
   */
  searchLawyers: async (params: SearchParams) => {
    const res = await request<any>('/Search/lawyers', {
      method: 'GET',
      params,
    }, false);
    const items = Array.isArray(res) ? res : (res.items || res.Items || []);
    return items.map((item: any) => ({
      id: item.lawyerUserId || item.id,
      fullName: item.fullName || `${item.firstName} ${item.lastName}`.trim(),
      profileImage: item.profilePhotoUrl || item.profileImage,
      city: item.city,
      degreeTitle: item.degreeTitle || '',
      university: item.university || '',
      bio: item.bio || '',
      experienceYears: item.yearsOfExperience || item.experienceYears || 0,
      rating: item.rating,
      reviewCount: item.reviewCount || 0,
      hourlyRate: item.consultationFee || item.hourlyRate || 0,
      specialities: Array.isArray(item.specialities) 
        ? item.specialities.map((s: any) => typeof s === 'string' ? { id: s, name: s } : { id: s.id || s.name || '', name: s.name || '' })
        : [],
      isVerified: (item.badges & 4) === 4 || item.isVerified || false,
    }));
  },

  /**
   * Get featured lawyers
   */
  getFeaturedLawyers: async () => {
    const res = await request<any>('/Search/lawyers', {
      method: 'GET',
    }, false);
    const items = Array.isArray(res) ? res : (res.items || res.Items || []);
    return items.map((item: any) => ({
      id: item.lawyerUserId || item.id,
      fullName: item.fullName || `${item.firstName} ${item.lastName}`.trim(),
      profileImage: item.profilePhotoUrl || item.profileImage,
      city: item.city,
      degreeTitle: item.degreeTitle || '',
      university: item.university || '',
      bio: item.bio || '',
      experienceYears: item.yearsOfExperience || item.experienceYears || 0,
      rating: item.rating,
      reviewCount: item.reviewCount || 0,
      hourlyRate: item.consultationFee || item.hourlyRate || 0,
      specialities: Array.isArray(item.specialities) 
        ? item.specialities.map((s: any) => typeof s === 'string' ? { id: s, name: s } : { id: s.id || s.name || '', name: s.name || '' })
        : [],
      isVerified: (item.badges & 4) === 4 || item.isVerified || false,
    }));
  },

  /**
   * Get a detailed public profile for a lawyer
   */
  getPublicLawyer: async (id: string) => {
    const res = await request<any>(`/Search/lawyers/${id}`, {
      method: 'GET',
    }, false);
    if (!res) return null;
    return {
      id: res.lawyerUserId || res.id,
      fullName: res.fullName || `${res.firstName} ${res.lastName}`.trim(),
      profileImage: res.profilePhotoUrl || res.profileImage,
      city: res.city,
      degreeTitle: res.degreeTitle || '',
      university: res.university || '',
      bio: res.bio || '',
      experienceYears: res.yearsOfExperience || res.experienceYears || 0,
      rating: res.rating,
      reviewCount: res.reviewCount || 0,
      hourlyRate: res.consultationFee || res.hourlyRate || 0,
      specialities: Array.isArray(res.specialities)
        ? res.specialities.map((s: any) => ({ id: s.id || s.name || s, name: s.name || s }))
        : [],
      educations: Array.isArray(res.educations)
        ? res.educations.map((e: any) => ({
            id: e.id,
            degree: e.degreeName || e.degree,
            institution: e.instituteName || e.institution,
            fieldOfStudy: e.fieldOfStudy || '',
            startDate: e.startDate || '',
            endDate: e.endDate || '',
            grade: e.grades || e.grade || '',
            description: e.description || '',
          }))
        : [],
      experiences: Array.isArray(res.experiences)
        ? res.experiences.map((exp: any) => ({
            id: exp.id,
            title: exp.role || exp.title,
            company: exp.firmCompany || exp.company,
            location: exp.location || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            isCurrent: exp.isCurrent || false,
            description: exp.shortBio || exp.description || '',
          }))
        : [],
      isVerified: (res.badges & 4) === 4 || res.isVerified || false,
    } as PublicLawyerProfile;
  },

  // ==================== SAVED PROFILE ENDPOINTS ====================

  /**
   * Get all saved lawyer profiles for the current user
   */
  getSavedProfiles: async () => {
    return request<PublicLawyerProfile[]>('/SavedProfiles', {
      method: 'GET',
    }, true);
  },

  /**
   * Toggle a lawyer profile as saved
   */
  saveProfile: async (lawyerId: string) => {
    return request<{ message: string }>(`/SavedProfiles/${lawyerId}/toggle`, {
      method: 'POST',
    }, true);
  },

  // ==================== MESSAGING ENDPOINTS ====================

  /**
   * Get all active conversations for the current user
   */
  getConversations: async () => {
    const res = await request<any>('/Messages/conversations', {
      method: 'GET',
    }, true);
    const items = res?.items || res?.Items || [];
    return items.map((item: any) => ({
      id: item.id,
      targetUserId: item.otherParticipantId,
      targetUserName: item.otherParticipantName,
      targetUserAvatar: item.otherParticipantPhotoUrl,
      lastMessage: item.lastMessage?.content || 'Start a conversation',
      lastMessageTime: item.lastMessage?.sentAt || item.lastMessageAt || '',
      unreadCount: item.unreadCount || 0,
      isOnline: item.isOnline || false,
      isLawyer: true,
    }));
  },

  /**
   * Get message history for a specific conversation/user
   */
  getMessages: async (conversationId: string) => {
    const res = await request<any>(`/Messages/conversations/${conversationId}`, {
      method: 'GET',
    }, true);
    const items = res?.items || res?.Items || [];
    return items.map((item: any) => ({
      id: item.id,
      senderId: item.senderId,
      receiverId: item.receiverId,
      content: item.content,
      timestamp: item.sentAt || '',
      isRead: item.status === 2 || item.status === 'Read',
    }));
  },

  /**
   * Send a message through a standard POST request
   */
  sendMessage: async (targetUserId: string, content: string) => {
    const res = await request<any>('/Messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId: targetUserId, content }),
    }, true);
    return {
      id: res.id,
      senderId: res.senderId,
      receiverId: res.receiverId,
      content: res.content,
      timestamp: res.sentAt || '',
      isRead: res.status === 2 || res.status === 'Read',
    };
  },

  /**
   * Mark messages in a conversation as read
   */
  markAsRead: async (conversationId: string) => {
    return request<{ message: string }>(`/Messages/conversations/${conversationId}/read`, {
      method: 'PUT',
    }, true);
  },

  // ==================== DASHBOARD ENDPOINTS ====================

  // ==================== NOTIFICATION ENDPOINTS ====================

  /**
   * Get my notifications
   */
  getNotifications: async (tab: string = 'all') => {
    return request<any[]>('/Notifications', {
      method: 'GET',
      params: { tab },
    }, true);
  },

  /**
   * Mark a notification as read
   */
  markNotificationAsRead: async (id: string) => {
    return request<void>(`/Notifications/${id}/read`, {
      method: 'PUT',
    }, true);
  },

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead: async () => {
    return request<void>('/Notifications/read-all', {
      method: 'PUT',
    }, true);
  },

  /**
   * Dismiss a notification
   */
  dismissNotification: async (id: string) => {
    return request<void>(`/Notifications/${id}`, {
      method: 'DELETE',
    }, true);
  },

  // ==================== BILLING ENDPOINTS ====================

  /**
   * Get billing summary (Revenue, Outstanding, etc.)
   */
  getBillingSummary: async () => {
    return request<any>('/Billing/summary', {
      method: 'GET',
    }, true);
  },

  /**
   * Get invoices
   */
  getInvoices: async (status?: string, search?: string) => {
    return request<any[]>('/Billing/invoices', {
      method: 'GET',
      params: { status, search },
    }, true);
  },

  /**
   * Get a specific invoice
   */
  getInvoice: async (id: string) => {
    return request<any>(`/Billing/invoices/${id}`, {
      method: 'GET',
    }, true);
  },

  /**
   * Create a new invoice
   */
  createInvoice: async (data: any) => {
    return request<any>('/Billing/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Get recent payments
   */
  getRecentPayments: async () => {
    return request<any[]>('/Billing/recent-payments', {
      method: 'GET',
    }, true);
  },

  /**
   * Get retainers
   */
  getRetainers: async () => {
    return request<any[]>('/Billing/retainers', {
      method: 'GET',
    }, true);
  },

  /**
   * Get billing templates
   */
  getTemplates: async () => {
    return request<any[]>('/Billing/templates', {
      method: 'GET',
    }, true);
  },

  // ==================== AI CHAT ENDPOINTS ====================

  /**
   * Get user's AI Chat sessions
   */
  getAiChatSessions: async () => {
    return request<AiChatSession[]>('/AiChat/sessions', {
      method: 'GET',
    }, true);
  },

  /**
   * Create a new AI Chat session manually
   */
  createAiChatSession: async (title: string) => {
    return request<AiChatSession>('/AiChat/sessions', {
      method: 'POST',
      body: JSON.stringify(title),
    }, true);
  },

  /**
   * Get message history for a specific AI session
   */
  getAiChatMessages: async (sessionId: string) => {
    return request<AiChatMessage[]>(`/AiChat/sessions/${sessionId}/messages`, {
      method: 'GET',
    }, true);
  },

  /**
   * Send a message to AI (auto-creates session if sessionId is undefined)
   */
  sendAiChatMessage: async (requestData: AiChatRequest) => {
    return request<AiChatResponse>('/AiChat/message', {
      method: 'POST',
      body: JSON.stringify(requestData),
    }, true);
  },

  /**
   * Delete an AI Chat session
   */
  deleteAiChatSession: async (sessionId: string) => {
    return request<void>(`/AiChat/sessions/${sessionId}`, {
      method: 'DELETE',
    }, true);
  },

  // ==================== PRACTICE ANALYTICS ENDPOINTS ====================
  getPracticeAnalyticsOverview: async (period: string = '12m') => {
    return request<any>('/Analytics/overview', {
      method: 'GET',
      params: { period },
    }, true);
  },

  getPracticeAnalyticsWorkload: async () => {
    return request<any>('/Analytics/workload', {
      method: 'GET',
    }, true);
  },

  getPracticeAnalyticsClients: async () => {
    return request<any>('/Analytics/clients', {
      method: 'GET',
    }, true);
  },

  // ==================== TEAM MANAGEMENT ENDPOINTS ====================
  getTeamMembers: async () => {
    return request<any[]>('/Team/members', {
      method: 'GET',
    }, true);
  },

  inviteTeamMember: async (data: { email: string; role: number }) => {
    return request<any>('/Team/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  getTeamTasks: async () => {
    return request<any[]>('/Team/tasks', {
      method: 'GET',
    }, true);
  },

  createTeamTask: async (data: any) => {
    return request<any>('/Team/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  updateTeamTaskStatus: async (id: string, status: string) => {
    return request<any>(`/Team/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(status),
    }, true);
  },

  getTeamActivity: async () => {
    return request<any[]>('/Team/activity', {
      method: 'GET',
    }, true);
  },

  // ==================== CLIENT CRM ENDPOINTS ====================
  getClients: async (params?: any) => {
    return request<any>('/Clients', {
      method: 'GET',
      params,
    }, true);
  },

  createClient: async (data: any) => {
    return request<any>('/Clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  getClientDetail: async (id: string) => {
    return request<any>(`/Clients/${id}`, {
      method: 'GET',
    }, true);
  },

  updateClient: async (id: string, data: any) => {
    return request<any>(`/Clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  archiveClient: async (id: string) => {
    return request<any>(`/Clients/${id}`, {
      method: 'DELETE',
    }, true);
  },

  getClientStats: async () => {
    return request<any>('/Clients/stats', {
      method: 'GET',
    }, true);
  },

  runConflictCheck: async (data: any) => {
    return request<any>('/Clients/conflict-check', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  getClientInteractions: async (id: string, type?: string) => {
    return request<any[]>(`/Clients/${id}/interactions`, {
      method: 'GET',
      params: { type },
    }, true);
  },

  logClientInteraction: async (id: string, data: any) => {
    return request<any>(`/Clients/${id}/interactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  dismissClientRetention: async (id: string) => {
    return request<any>(`/Clients/${id}/dismiss-retention-alert`, {
      method: 'PATCH',
    }, true);
  },

  shareDocumentToPortal: async (id: string, docId: string, data: any) => {
    return request<any>(`/Clients/${id}/portal-access/documents/${docId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  revokeDocumentAccess: async (id: string, docId: string) => {
    return request<any>(`/Clients/${id}/portal-access/documents/${docId}`, {
      method: 'DELETE',
    }, true);
  },

  // ==================== CASE MANAGEMENT ENDPOINTS ====================
  getCases: async (params?: any) => {
    return request<any>('/Cases', {
      method: 'GET',
      params,
    }, true);
  },

  createCase: async (data: any) => {
    return request<any>('/Cases', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  getCase: async (id: string) => {
    return request<any>(`/Cases/${id}`, {
      method: 'GET',
    }, true);
  },

  updateCase: async (id: string, data: any) => {
    return request<any>(`/Cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  archiveCase: async (id: string) => {
    return request<any>(`/Cases/${id}`, {
      method: 'DELETE',
    }, true);
  },

  getCaseTimeline: async (id: string) => {
    return request<any[]>(`/Cases/${id}/timeline`, {
      method: 'GET',
    }, true);
  },

  addCaseTimelineEvent: async (id: string, data: any) => {
    return request<any>(`/Cases/${id}/timeline`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  updateCaseTimelineEvent: async (id: string, eventId: string, data: any) => {
    return request<any>(`/Cases/${id}/timeline/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  deleteCaseTimelineEvent: async (id: string, eventId: string) => {
    return request<any>(`/Cases/${id}/timeline/${eventId}`, {
      method: 'DELETE',
    }, true);
  },

  getCaseNotes: async (id: string) => {
    return request<any[]>(`/Cases/${id}/notes`, {
      method: 'GET',
    }, true);
  },

  addCaseNote: async (id: string, data: any) => {
    return request<any>(`/Cases/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  updateCaseNote: async (id: string, noteId: string, data: any) => {
    return request<any>(`/Cases/${id}/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  deleteCaseNote: async (id: string, noteId: string) => {
    return request<any>(`/Cases/${id}/notes/${noteId}`, {
      method: 'DELETE',
    }, true);
  },

  getCaseDeadlines: async (id: string) => {
    return request<any[]>(`/Cases/${id}/deadlines`, {
      method: 'GET',
    }, true);
  },

  createCaseDeadline: async (id: string, data: any) => {
    return request<any>(`/Cases/${id}/deadlines`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  updateCaseDeadline: async (id: string, dlId: string, data: any) => {
    return request<any>(`/Cases/${id}/deadlines/${dlId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  deleteCaseDeadline: async (id: string, dlId: string) => {
    return request<any>(`/Cases/${id}/deadlines/${dlId}`, {
      method: 'DELETE',
    }, true);
  },

  getCaseAssignments: async (id: string) => {
    return request<any[]>(`/Cases/${id}/assignments`, {
      method: 'GET',
    }, true);
  },

  assignTeamMember: async (id: string, data: any) => {
    return request<any>(`/Cases/${id}/assignments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  removeTeamMember: async (id: string, uid: string) => {
    return request<any>(`/Cases/${id}/assignments/${uid}`, {
      method: 'DELETE',
    }, true);
  },

  linkCase: async (id: string, data: any) => {
    return request<any>(`/Cases/${id}/link`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  // ==================== CALENDAR / HEARINGS ENDPOINTS ====================
  getCalendarFeed: async (params?: any) => {
    return request<any>('/Hearings', {
      method: 'GET',
      params,
    }, true);
  },

  createHearing: async (data: any) => {
    return request<any>('/Hearings', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  adjournHearing: async (id: string, data: any) => {
    return request<any>(`/Hearings/${id}/adjourn`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  completeHearing: async (id: string, data: any) => {
    return request<any>(`/Hearings/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  cancelHearing: async (id: string, data: any) => {
    return request<any>(`/Hearings/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    }, true);
  },

  checkHearingConflicts: async (params: any) => {
    return request<any>('/Hearings/conflicts', {
      method: 'GET',
      params,
    }, true);
  },

  exportHearings: async (params: any) => {
    return request<any>('/Hearings/export', {
      method: 'GET',
      params,
    }, true);
  },

  getHearingStats: async (params?: any) => {
    return request<any>('/Hearings/stats', {
      method: 'GET',
      params,
    }, true);
  },

  // ==================== CLIENT PROFILE ENDPOINTS ====================
  updateClientProfile: async (id: string, data: any) => {
    return request<any>(`/Clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },
};


// ==================== TYPE DEFINITIONS ====================

export interface AdminStats {
  totalUsers: number;
  totalLawyers: number;
  totalClients: number;
  pendingVerifications: number;
  approvedVerifications: number;
  rejectedVerifications: number;
  activeChats: number;
  totalDocuments: number;
}

export interface DocumentResponse {
  id: string;
  name: string;
  url: string;
  sizeFormatted: string;
  sizeInBytes: number;
  classification: string; // The backend returns the string name of the classification
  mimeType: string;
  uploadedAt: string;
  timeAgo: string;
}

export enum DocumentClassification {
  LegalDoc = 0,
  Contract = 1,
  Image = 2,
  Other = 3,
}

export interface ExperienceRequest {
  role: string;
  firmCompany: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  shortBio?: string;
  proofUrl?: string;
}

export interface ExperienceResponse extends ExperienceRequest {
  id: string;
}

export interface EducationRequest {
  instituteName: string;
  degreeName: string;
  grades: string;
  degreeImageUrl?: string;
}

export interface EducationResponse extends EducationRequest {
  id: string;
}

export interface SpecialityResponse {
  id: string;
  name: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'lawyer' | 'admin';
  phoneNo?: string;
  city?: string;
  profileImage?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LawyerApplication {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phoneNo: string;
  city: string;
  barCouncilNumber: string;
  degreeTitle: string;
  university: string;
  yearOfCompletion: number;
  chamberAddress: string;
  degree?: string;
  introVideo?: string;
  status: number | string; // Matches VerificationStatus enum
  submittedAt: string;
  isEmailVerified?: boolean; 
}

export interface SearchParams {
  query?: string;
  city?: string;
  specialityId?: string;
}

export interface PublicLawyerProfile {
  id: string;
  fullName: string;
  profileImage?: string;
  city: string;
  degreeTitle: string;
  university: string;
  bio?: string;
  experienceYears?: number;
  rating?: number;
  reviewCount?: number;
  hourlyRate?: number;
  specialities: SpecialityResponse[];
  educations?: EducationResponse[];
  experiences?: ExperienceResponse[];
  isVerified: boolean;
  isSaved?: boolean;
}

export interface Conversation {
  id: string;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isLawyer: boolean;
}

export interface AiChatSession {
  id: string;
  title: string;
  startedAt: string;
  lastMessageAt: string;
}

export interface AiChatMessage {
  id: string;
  sessionId: string;
  role: 'User' | 'Assistant' | 'System';
  content: string;
  createdAt: string;
}

export interface AiChatRequest {
  message: string;
  isDeepResearch: boolean;
  sessionId?: string;
}

export interface AiChatResponse {
  response: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export default api;
