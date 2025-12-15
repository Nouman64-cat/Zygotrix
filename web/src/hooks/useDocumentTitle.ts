import { useEffect } from "react";

/**
 * Custom hook to set the document title dynamically.
 * Sets the format: "Page Name | Zygotrix"
 * @param title - The page-specific title
 */
const useDocumentTitle = (title: string) => {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = `${title} | Zygotrix`;

        return () => {
            document.title = previousTitle;
        };
    }, [title]);
};

export default useDocumentTitle;
