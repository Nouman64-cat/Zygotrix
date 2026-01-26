export const API_BASE_URL =
    process.env.NEXT_PUBLIC_ZYGOTRIX_API || "https://api.zygotrix.com";

export const API_ROUTES = {
    protein: {
        generate: "/api/protein/generate",
        queueStatus: "/api/protein/queue-status",
        job: (jobId: string) => `/api/protein/job/${jobId}`,
        jobHistory: "/api/protein/job-history",
        extractAminoAcids: "/api/protein/extract-amino-acids",
        generateProtein: "/api/protein/generate-protein",
    },
    newsletter: {
        subscribe: "/api/newsletter/subscribe",
        unsubscribe: (email: string) =>
            "/api/newsletter/unsubscribe/" + encodeURIComponent(email),
    },
    contact: {
        submit: "/api/contact/submit",
        submissions: "/api/contact/submissions",
        markAsRead: (submissionId: string) =>
            "/api/contact/submissions/" + encodeURIComponent(submissionId) + "/read",
        deleteSubmission: (submissionId: string) =>
            "/api/contact/submissions/" + encodeURIComponent(submissionId),
    },
} as const;
