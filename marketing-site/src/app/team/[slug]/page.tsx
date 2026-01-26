import type { Metadata } from "next";
import TeamMemberClient from "../../../components/team/TeamMemberClient";
import { fetchTeamMember, fetchTeamMembers } from "../../../services/teamMember";

// Define the type for route params
type Props = {
    params: Promise<{ slug: string }>;
};

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // Await params since it's a promise in newer Next.js versions
    const resolvedParams = await params;

    try {
        const response = await fetchTeamMember(resolvedParams.slug);
        const member = response.data.teamMember;

        if (!member) {
            return {
                title: "Team Member Not Found",
            };
        }

        return {
            title: `${member.name} - ${member.role} | Zygotrix Team`,
            description: member.bio.markdown.substring(0, 160) || `Learn more about ${member.name}, ${member.role} at Zygotrix.`,
            openGraph: {
                title: `${member.name} - ${member.role}`,
                description: member.bio.markdown.substring(0, 160),
                images: member.photo?.url ? [member.photo.url] : [],
            },
        };
    } catch (error) {
        return {
            title: "Team Member",
        };
    }
}

// Generate static parameters for all team members at build time
export async function generateStaticParams() {
    try {
        const members = await fetchTeamMembers();
        return members.map((member) => ({
            slug: member.slug,
        }));
    } catch (error) {
        console.error("Failed to generate static params for team members:", error);
        return [];
    }
}

export default async function TeamMemberPage({ params }: Props) {
    const resolvedParams = await params;
    return <TeamMemberClient slug={resolvedParams.slug} />;
}
