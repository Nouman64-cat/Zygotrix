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
}

export interface TeamMember {
  bio: TeamMemberBio;
  name: string;
  photo: TeamMemberPhoto;
  role: string;
  slug: string;
  socialProfiles: SocialProfile[];
}

export interface TeamMemberResponse {
  data: {
    teamMember: TeamMember;
  };
}
