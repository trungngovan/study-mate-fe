// API Response Types
export interface User {
    id: number;
    email: string;
    phone?: string;
    full_name: string;
    school?: number;
    school_name?: string;
    major?: string;
    year?: number;
    bio?: string;
    avatar_url?: string;
    learning_radius_km?: number;
    privacy_level?: 'open' | 'friends_of_friends' | 'private';
    status?: 'active' | 'banned' | 'deleted';
    last_active_at?: string;
    created_at?: string;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    password_confirm: string;
    full_name: string;
    phone?: string;
    school?: number;
    major?: string;
    year?: number;
    bio?: string;
    avatar_url?: string;
    learning_radius_km?: number;
    privacy_level?: 'open' | 'friends_of_friends' | 'private';
}

export interface LoginResponse {
    message: string;
    user: User;
    tokens: {
        access: string;
        refresh: string;
    };
}

export interface RegisterResponse {
    message: string;
    user: User;
    tokens: {
        access: string;
        refresh: string;
    };
}

// Location Types
export interface LocationUpdate {
    latitude: number;
    longitude: number;
    accuracy?: number;
    last_updated?: string;
}

export interface CurrentLocation {
    latitude: number;
    longitude: number;
    last_updated: string;
}

export interface LocationResponse {
    updated: boolean;
    saved_to_history: boolean;
    distance_moved?: number;
    time_since_last?: number;
    message: string;
    latitude: number;
    longitude: number;
    timestamp: string;
}

export interface LocationHistory {
    id: number;
    user?: number;
    user_email?: string;
    user_name?: string;
    latitude: number;
    longitude: number;
    recorded_at: string;
    accuracy?: number;
    created_at?: string;
}

export interface LocationStats {
    total_records: number;
    days_analyzed: number;
    first_recorded: string | null;
    last_recorded: string | null;
    current_location: {
        latitude: number;
        longitude: number;
    } | null;
}

// Discover Types
export interface NearbyLearner {
    id: number;
    email: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    school_name?: string;
    major?: string;
    year?: number;
    distance_km: number;
    latitude: number;
    longitude: number;
}

export interface DiscoverResponse {
    count: number;
    next: string | null;
    previous: string | null;
    radius_km: number;
    results: NearbyLearner[];
}

// Connection Types
export interface ConnectionRequest {
    id: number;
    sender?: {
        id: number;
        email: string;
        full_name: string;
        avatar_url?: string;
        school?: number;
        school_name?: string;
        major?: string;
        year?: number;
        bio?: string;
    };
    receiver?: {
        id: number;
        email: string;
        full_name: string;
        avatar_url?: string;
        school?: number;
        school_name?: string;
        major?: string;
        year?: number;
        bio?: string;
    };
    // Simple fields for list endpoints
    sender_name?: string;
    sender_avatar?: string;
    receiver_name?: string;
    receiver_avatar?: string;
    state: 'pending' | 'accepted' | 'rejected' | 'blocked';
    message?: string;
    created_at: string;
    updated_at?: string;
    accepted_at?: string;
    rejected_at?: string;
    can_accept?: boolean;
    can_reject?: boolean;
    can_message?: boolean;
}

export interface SendConnectionRequest {
    receiver_id: number;
    message?: string;
}

export interface Connection {
    id: number;
    user?: {
        id: number;
        email: string;
        full_name: string;
        avatar_url?: string;
        school?: number;
        school_name?: string;
        major?: string;
        year?: number;
        bio?: string;
    };
    connection_state: 'accepted';
    accepted_at: string;
    can_message: boolean;
}

export interface ConnectionStats {
    sent_pending: number;
    received_pending: number;
    accepted_connections: number;
    total_requests: number;
}

// School Types
export interface School {
    id: number;
    name: string;
    short_name?: string;
    address?: string;
    city: number;
    latitude?: number;
    longitude?: number;
    website?: string;
    email?: string;
    phone?: string;
    student_count?: number;
}

// City Types
export interface City {
    id: number;
    name: string;
    latitude?: number;
    longitude?: number;
    school_count?: number;
}

// Subject Types
export interface Subject {
    id: number;
    code: string;
    name_vi: string;
    name_en: string;
    level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    user_count?: number;
    learners_count?: number;
    teachers_count?: number;
}

export interface UserSubject {
    id: number;
    subject: number;
    subject_code?: string;
    subject_name_vi?: string;
    subject_name_en?: string;
    subject_level?: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    intent: 'learn' | 'teach' | 'both';
    note?: string;
}

export interface CreateUserSubject {
    subject: number;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    intent: 'learn' | 'teach' | 'both';
    note?: string;
}

// Goal Types
export interface Goal {
    id: number;
    code: string;
    name: string;
    type?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'milestone';
    user_count?: number;
    avg_target_value?: number;
}

export interface UserGoal {
    id: number;
    goal: number;
    goal_code?: string;
    goal_name?: string;
    goal_type?: string;
    target_value?: number;
    target_date?: string;
}

export interface CreateUserGoal {
    goal: number;
    target_value: number;
    target_date: string;
}

// Pagination
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Chat Types
export interface ConversationParticipant {
    id: number;
    email: string;
    full_name: string;
    avatar_url?: string;
}

export interface MessagePreview {
    content: string;
    sender_id: number;
    created_at: string;
}

export interface Conversation {
    id: number;
    connection?: number;
    participants?: ConversationParticipant[];
    other_participant: ConversationParticipant;
    last_message_preview?: MessagePreview | null;
    last_message?: Message;
    last_message_at: string | null;
    unread_count: number;
    created_at?: string;
}

export interface Message {
    id: number;
    conversation: number;
    sender?: ConversationParticipant;
    sender_id: number;
    sender_name?: string;
    sender_avatar?: string;
    content: string;
    is_read: boolean;
    read_at?: string;
    created_at: string;
    updated_at?: string;
}

export interface SendMessageRequest {
    conversation: number;
    content: string;
}

export interface MarkReadRequest {
    message_ids?: number[];
}

export interface MarkReadResponse {
    message: string;
    marked_count: number;
}

// WebSocket Message Types
export interface WSMessage {
    type: 'chat_message' | 'typing_indicator' | 'message_read' | 'messages_read' | 'connection_established' | 'error';
    content?: string;
    is_typing?: boolean;
    message_ids?: number[];
    message_id?: number;
    sender_id?: number;
    sender_name?: string;
    sender_avatar?: string;
    user_id?: number;
    user_name?: string;
    created_at?: string;
    read_at?: string;
    message?: string;
}

// API Error
export interface ApiError {
    detail?: string;
    message?: string;
    [key: string]: any;
}
