import type {
    ApiError,
    AuthTokens,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    User,
    LocationUpdate,
    CurrentLocation,
    LocationResponse,
    LocationHistory,
    LocationStats,
    DiscoverResponse,
    ConnectionRequest,
    SendConnectionRequest,
    Connection,
    ConnectionStats,
    School,
    City,
    Subject,
    UserSubject,
    CreateUserSubject,
    Goal,
    UserGoal,
    CreateUserGoal,
    PaginatedResponse,
    Conversation,
    Message,
    SendMessageRequest,
    MarkReadRequest,
    MarkReadResponse,
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    private getAuthHeader(): HeadersInit {
        const token = this.getAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    private getAccessToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('access_token');
    }

    private setTokens(tokens: AuthTokens) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
    }

    private clearTokens() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        // Dispatch event to notify auth context
        window.dispatchEvent(new Event('auth-token-cleared'));
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...this.getAuthHeader(),
            ...options.headers,
        };

        try {
            const response = await fetch(url, { ...options, headers });

            if (!response.ok) {
                if (response.status === 401) {
                    // Try to refresh token
                    console.log('Token expired, attempting to refresh...');
                    const refreshed = await this.refreshToken();
                    if (refreshed) {
                        console.log('Token refreshed successfully, retrying request...');
                        // Retry the request with new token
                        const retryHeaders = {
                            ...headers,
                            ...this.getAuthHeader(),
                        };
                        const retryResponse = await fetch(url, {
                            ...options,
                            headers: retryHeaders,
                        });

                        if (!retryResponse.ok) {
                            // If retry also fails with 401, tokens are invalid
                            if (retryResponse.status === 401) {
                                console.error('Retry failed with 401, clearing tokens');
                                this.clearTokens();
                                throw new Error('Authentication failed. Please login again.');
                            }
                            // Handle other errors
                            const error: ApiError = await retryResponse.json().catch(() => ({
                                detail: retryResponse.statusText,
                            }));
                            throw new Error(error.detail || error.message || 'An error occurred');
                        }

                        // Handle successful retry
                        if (retryResponse.status === 204) {
                            return {} as T;
                        }
                        return retryResponse.json();
                    }
                    // If refresh failed, clear tokens and throw
                    console.error('Token refresh failed, clearing tokens');
                    this.clearTokens();
                    throw new Error('Authentication failed. Please login again.');
                }

                const error: ApiError = await response.json().catch(() => ({
                    detail: response.statusText,
                }));
                throw new Error(error.detail || error.message || 'An error occurred');
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return {} as T;
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Network error occurred');
        }
    }

    // Authentication
    async register(data: RegisterRequest): Promise<RegisterResponse> {
        const response = await this.request<RegisterResponse>('/api/auth/register/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.setTokens({ access: response.tokens.access, refresh: response.tokens.refresh });
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        return response;
    }

    async login(data: LoginRequest): Promise<LoginResponse> {
        const response = await this.request<LoginResponse>('/api/auth/login/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.setTokens({ access: response.tokens.access, refresh: response.tokens.refresh });
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        return response;
    }

    async logout(): Promise<void> {
        try {
            await this.request('/api/auth/logout/', { method: 'POST' });
        } finally {
            this.clearTokens();
        }
    }

    async refreshToken(): Promise<boolean> {
        const refreshToken =
            typeof window !== 'undefined'
                ? localStorage.getItem('refresh_token')
                : null;
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${this.baseUrl}/api/auth/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (!response.ok) return false;

            const data = await response.json();
            // Save both access and refresh tokens
            if (typeof window !== 'undefined') {
                localStorage.setItem('access_token', data.access);
                if (data.refresh) {
                    localStorage.setItem('refresh_token', data.refresh);
                }
            }
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }

    async getProfile(): Promise<User> {
        return this.request<User>('/api/auth/profile/');
    }

    async updateProfile(data: Partial<User>): Promise<User> {
        return this.request<User>('/api/auth/profile/', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async changePassword(
        oldPassword: string,
        newPassword: string
    ): Promise<void> {
        return this.request('/api/auth/change-password/', {
            method: 'POST',
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword,
            }),
        });
    }

    // Location
    async updateLocation(data: LocationUpdate): Promise<LocationResponse> {
        return this.request<LocationResponse>('/api/users/location/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getCurrentLocation(): Promise<CurrentLocation> {
        return this.request<CurrentLocation>('/api/users/location/current/');
    }

    async getLocationHistory(params?: {
        limit?: number;
        from_date?: string;
        to_date?: string;
        page?: number;
    }): Promise<PaginatedResponse<LocationHistory>> {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.from_date) queryParams.append('from_date', params.from_date);
        if (params?.to_date) queryParams.append('to_date', params.to_date);
        if (params?.page) queryParams.append('page', params.page.toString());
        const query = queryParams.toString();
        return this.request<PaginatedResponse<LocationHistory>>(
            `/api/users/location/history/${query ? `?${query}` : ''}`
        );
    }

    async getLocationStats(days?: number): Promise<LocationStats> {
        const query = days ? `?days=${days}` : '';
        return this.request<LocationStats>(`/api/users/location/stats/${query}`);
    }

    // Discover
    async getNearbyLearners(radius?: number, page?: number): Promise<DiscoverResponse> {
        const queryParams = new URLSearchParams();
        if (radius) queryParams.append('radius', radius.toString());
        if (page) queryParams.append('page', page.toString());
        const query = queryParams.toString();
        return this.request<DiscoverResponse>(
            `/api/discover/nearby-learners/${query ? `?${query}` : ''}`
        );
    }

    // Connection Requests
    async sendConnectionRequest(
        data: SendConnectionRequest
    ): Promise<ConnectionRequest> {
        return this.request<ConnectionRequest>('/api/matching/requests/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getConnectionRequests(params?: {
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<ConnectionRequest>> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
        const query = queryParams.toString();
        return this.request<PaginatedResponse<ConnectionRequest>>(
            `/api/matching/requests/${query ? `?${query}` : ''}`
        );
    }

    async getSentRequests(params?: {
        state?: string;
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<ConnectionRequest>> {
        const queryParams = new URLSearchParams();
        if (params?.state) queryParams.append('state', params.state);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
        const query = queryParams.toString();
        return this.request<PaginatedResponse<ConnectionRequest>>(
            `/api/matching/requests/sent/${query ? `?${query}` : ''}`
        );
    }

    async getReceivedRequests(params?: {
        state?: string;
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<ConnectionRequest>> {
        const queryParams = new URLSearchParams();
        if (params?.state) queryParams.append('state', params.state);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
        const query = queryParams.toString();
        return this.request<PaginatedResponse<ConnectionRequest>>(
            `/api/matching/requests/received/${query ? `?${query}` : ''}`
        );
    }

    async acceptRequest(id: number): Promise<ConnectionRequest> {
        return this.request<ConnectionRequest>(
            `/api/matching/requests/${id}/accept/`,
            { method: 'POST' }
        );
    }

    async rejectRequest(id: number): Promise<ConnectionRequest> {
        return this.request<ConnectionRequest>(
            `/api/matching/requests/${id}/reject/`,
            { method: 'POST' }
        );
    }

    async cancelRequest(id: number): Promise<void> {
        return this.request(`/api/matching/requests/${id}/`, { method: 'DELETE' });
    }

    // Connections
    async getConnections(params?: {
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<Connection>> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
        const query = queryParams.toString();
        return this.request<PaginatedResponse<Connection>>(
            `/api/matching/connections/${query ? `?${query}` : ''}`
        );
    }

    async getConnectionStats(): Promise<ConnectionStats> {
        return this.request<ConnectionStats>(
            '/api/matching/connections/statistics/'
        );
    }

    // Schools
    async getSchools(params?: {
        search?: string;
        city?: string;
    }): Promise<PaginatedResponse<School>> {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.city) queryParams.append('city', params.city);
        const query = queryParams.toString();
        return this.request<PaginatedResponse<School>>(
            `/api/schools/${query ? `?${query}` : ''}`
        );
    }

    async getSchool(id: number): Promise<School> {
        return this.request<School>(`/api/schools/${id}/`);
    }

    // Cities
    async getCities(search?: string): Promise<PaginatedResponse<City>> {
        const query = search ? `?search=${search}` : '';
        return this.request<PaginatedResponse<City>>(`/api/cities/${query}`);
    }

    // Subjects
    async getSubjects(params?: {
        search?: string;
        level?: string;
    }): Promise<PaginatedResponse<Subject>> {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.level) queryParams.append('level', params.level);
        const query = queryParams.toString();
        return this.request<PaginatedResponse<Subject>>(
            `/api/subjects/${query ? `?${query}` : ''}`
        );
    }

    async getUserSubjects(): Promise<UserSubject[]> {
        const response = await this.request<PaginatedResponse<UserSubject>>('/api/user-subjects/');
        return response.results;
    }

    async addUserSubject(data: CreateUserSubject): Promise<UserSubject> {
        return this.request<UserSubject>('/api/user-subjects/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteUserSubject(id: number): Promise<void> {
        return this.request(`/api/user-subjects/${id}/`, { method: 'DELETE' });
    }

    // Goals
    async getGoals(params?: {
        search?: string;
        type?: string;
    }): Promise<PaginatedResponse<Goal>> {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.type) queryParams.append('type', params.type);
        const query = queryParams.toString();
        return this.request<PaginatedResponse<Goal>>(
            `/api/goals/${query ? `?${query}` : ''}`
        );
    }

    async getUserGoals(): Promise<UserGoal[]> {
        const response = await this.request<PaginatedResponse<UserGoal>>('/api/user-goals/');
        return response.results;
    }

    async addUserGoal(data: CreateUserGoal): Promise<UserGoal> {
        return this.request<UserGoal>('/api/user-goals/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteUserGoal(id: number): Promise<void> {
        return this.request(`/api/user-goals/${id}/`, { method: 'DELETE' });
    }

    // ==================== Chat Methods ====================

    /**
     * Get all conversations for current user
     */
    async getConversations(): Promise<Conversation[]> {
        const response = await this.request<PaginatedResponse<Conversation>>('/api/chat/conversations/');
        return response.results || [];
    }

    /**
     * Get conversation details by ID
     */
    async getConversation(id: number): Promise<Conversation> {
        return this.request<Conversation>(`/api/chat/conversations/${id}/`);
    }

    /**
     * Get message history for a conversation
     */
    async getMessages(
        conversationId: number,
        page: number = 1,
        pageSize: number = 50
    ): Promise<PaginatedResponse<Message>> {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
        });
        return this.request<PaginatedResponse<Message>>(
            `/api/chat/conversations/${conversationId}/messages/?${params}`
        );
    }

    /**
     * Send a message (HTTP fallback, prefer WebSocket)
     */
    async sendMessage(data: SendMessageRequest): Promise<Message> {
        return this.request<Message>('/api/chat/messages/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(
        conversationId: number,
        messageIds?: number[]
    ): Promise<MarkReadResponse> {
        const body: MarkReadRequest = messageIds ? { message_ids: messageIds } : {};
        return this.request<MarkReadResponse>(
            `/api/chat/conversations/${conversationId}/mark_read/`,
            {
                method: 'POST',
                body: JSON.stringify(body),
            }
        );
    }

    /**
     * Get WebSocket URL for a conversation
     */
    getWebSocketUrl(conversationId: number): string {
        const token = this.getAccessToken();
        const wsBaseUrl = this.baseUrl.replace('http', 'ws');
        return `${wsBaseUrl}/ws/chat/${conversationId}/?token=${token}`;
    }

    // Utility
    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }

    getCurrentUser(): User | null {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
}

export const apiClient = new ApiClient();

