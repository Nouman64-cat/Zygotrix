export interface SocialProfile {
    username: string;
    url: string;
    platform: string;
}

export interface TeamMemberBio {
    markdown: string;
}

export interface TeamMemberPhoto {
    url: string;
    fileName?: string | null;
}

export interface TeamMember {
    bio: TeamMemberBio;
    name: string;
    photo: TeamMemberPhoto;
    role: string;
    slug: string;
    founder?: boolean | null;
    introduction?: string | null;
    active?: boolean | null;
    socialProfiles: SocialProfile[];
}

export interface TeamMemberResponse {
    data: {
        teamMember: TeamMember;
    };
    errors?: Array<{ message: string }>;
}

export interface TeamMemberSummary {
    name: string;
    photo: TeamMemberPhoto | null;
    role: string;
    slug: string;
    introduction: string | null;
    founder?: boolean | null;
    active?: boolean | null;
    socialProfiles: SocialProfile[];
}

export interface TeamMembersResponse {
    data: {
        teamMembers: TeamMemberSummary[];
    };
    errors?: Array<{ message: string }>;
}
