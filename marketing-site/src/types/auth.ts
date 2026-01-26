export type UserPreferences = {
    theme?: "light" | "dark" | "auto";
    language?: string;
    dateFormat?: string;
    timeFormat?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    analysisComplete?: boolean;
    projectUpdates?: boolean;
    systemAlerts?: boolean;
    weeklyDigest?: boolean;
    profileVisibility?: string;
    dataSharing?: boolean;
    analyticsTracking?: boolean;
    autoSave?: boolean;
    compressionLevel?: string;
    maxFileSize?: string;
    defaultDataFormat?: string;
    allowInvitations?: boolean;
    showOnlineStatus?: boolean;
    shareByDefault?: boolean;
};

export type UserProfile = {
    id: string;
    email: string;
    full_name?: string | null;
    profile_picture_url?: string | null;
    profile_picture_thumbnail_url?: string | null;
    phone?: string | null;
    organization?: string | null;
    department?: string | null;
    title?: string | null;
    bio?: string | null;
    location?: string | null;
    timezone?: string | null;
    research_interests?: string[] | null;
    experience_level?: string | null;
    use_case?: string | null;
    organism_focus?: string[] | null;
    onboarding_completed?: boolean | null;
    preferences?: UserPreferences | null;
    created_at: string;
    // Admin-related fields
    user_role?: string | null;
    is_active?: boolean | null;
    deactivated_at?: string | null;
    deactivated_by?: string | null;
    // Activity tracking fields
    last_accessed_at?: string | null;
    last_ip_address?: string | null;
    last_location?: string | null;
    last_browser?: string | null;
};

export type UpdateProfilePayload = {
    full_name?: string;
    profile_picture_url?: string;
    profile_picture_thumbnail_url?: string;
    phone?: string;
    organization?: string;
    department?: string;
    title?: string;
    bio?: string;
    location?: string;
    timezone?: string;
    preferences?: UserPreferences;
};

export type AuthResponse = {
    access_token: string;
    token_type: string;
    user: UserProfile;
};

export type SignUpPayload = {
    email: string;
    password: string;
    full_name?: string;
};

export type SignInPayload = {
    email: string;
    password: string;
};
