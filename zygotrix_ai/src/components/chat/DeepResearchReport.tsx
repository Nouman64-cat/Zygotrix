import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Link } from '@react-pdf/renderer';
import type { ResearchSource } from '../../types/research.types';

// Register Roboto font to ensure consistent rendering across all PDF viewers
// This fixes the issue where standard fonts (Helvetica) render pseudo-bold on some systems
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontStyle: 'italic' }
    ]
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Roboto',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#059669',
    },
    subHeader: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 5,
    },
    content: {
        fontSize: 11,
        lineHeight: 1.6,
        color: '#374151',
        marginBottom: 10,
        textAlign: 'justify',
    },
    heading: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 15,
        marginBottom: 8,
    },
    // Citation styles
    inTextCitation: {
        fontSize: 11,
        color: '#059669',
    },
    referencesSection: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 2,
        borderTopColor: '#059669',
    },
    referencesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#111827',
    },
    referenceItem: {
        fontSize: 10,
        marginBottom: 10,
        color: '#374151',
        paddingLeft: 20,
        textIndent: -20,
        lineHeight: 1.5,
    },
    referenceAuthor: {
        fontWeight: 'bold',
    },
    referenceTitle: {
        fontStyle: 'italic',
    },
    referenceLink: {
        color: '#059669',
        textDecoration: 'underline',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 9,
        color: '#9CA3AF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 10,
    },
});

interface DeepResearchReportProps {
    content: string;
    sources?: ResearchSource[];
    timestamp: string;
}

/**
 * Format author name for Harvard citation
 * Converts "John Smith" to "Smith, J."
 * Handles multiple authors separated by commas or "and"
 */
const formatAuthorHarvard = (author: string | undefined): string => {
    if (!author) return 'Unknown Author';

    // Handle multiple authors
    const authors = author.split(/,\s*(?:and\s*)?|(?:\s+and\s+)/i);

    const formattedAuthors = authors.map((a) => {
        const trimmed = a.trim();
        if (!trimmed) return '';

        const parts = trimmed.split(/\s+/);
        if (parts.length === 1) return parts[0];

        // Last name, First initial(s)
        const lastName = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(p => p.charAt(0).toUpperCase() + '.').join('');

        return `${lastName}, ${initials}`;
    }).filter(Boolean);

    if (formattedAuthors.length === 0) return 'Unknown Author';
    if (formattedAuthors.length === 1) return formattedAuthors[0];
    if (formattedAuthors.length === 2) return formattedAuthors.join(' and ');

    // More than 2 authors: use et al.
    return `${formattedAuthors[0]} et al.`;
};

/**
 * Format year for citation
 */
const formatYear = (year: string | number | undefined): string => {
    if (!year) return 'n.d.'; // No date
    return String(year);
};

/**
 * Generate Harvard-style in-text citation
 * Format: (Author, Year)
 */
const generateInTextCitation = (source: ResearchSource): string => {
    const author = source.author || (source.metadata?.author as string | undefined);
    const year = source.publication_year ||
        (source.metadata?.publication_year as string | number | undefined) ||
        (source.metadata?.year as string | number | undefined);

    if (author) {
        const authorName = formatAuthorHarvard(author).split(',')[0]; // Just last name for in-text
        return `(${authorName}, ${formatYear(year)})`;
    }

    // Fallback to title-based citation if no author
    if (source.title) {
        const shortTitle = source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title;
        return `(${shortTitle}, ${formatYear(year)})`;
    }

    return '(Unknown Source)';
};

/**
 * Generate Harvard-style reference entry
 * 
 * Book: Author, A.A. (Year) Title of book. Edition. Place of publication: Publisher.
 * Journal: Author, A.A. (Year) 'Title of article', Journal Name, Volume(Issue), pp. xx-xx.
 * Website: Author, A.A. (Year) Title of page. Available at: URL (Accessed: Date).
 */
const generateHarvardReference = (source: ResearchSource): string => {
    const author = source.author || (source.metadata?.author as string | undefined);
    const year = source.publication_year ||
        (source.metadata?.publication_year as string | number | undefined) ||
        (source.metadata?.year as string | number | undefined);
    const title = source.title || (source.metadata?.title as string | undefined) || 'Untitled Source';
    const publisher = source.publisher || (source.metadata?.publisher as string | undefined);
    const journal = source.journal || (source.metadata?.journal as string | undefined);
    const placeOfPublication = source.place_of_publication || (source.metadata?.place_of_publication as string | undefined);
    const edition = source.edition || (source.metadata?.edition as string | undefined);
    const pageNumbers = source.page_numbers || (source.metadata?.page_numbers as string | undefined);
    const doi = source.doi || (source.metadata?.doi as string | undefined);
    const sourceType = source.source_type || (source.metadata?.source_type as string | undefined) || 'other';

    const formattedAuthor = formatAuthorHarvard(author);
    const formattedYear = formatYear(year);

    let reference = `${formattedAuthor} (${formattedYear}) `;

    switch (sourceType) {
        case 'book':
            // Author (Year) Title. Edition. Place: Publisher.
            reference += `${title}.`;
            if (edition) reference += ` ${edition}.`;
            if (placeOfPublication && publisher) {
                reference += ` ${placeOfPublication}: ${publisher}.`;
            } else if (publisher) {
                reference += ` ${publisher}.`;
            }
            break;

        case 'journal':
        case 'paper':
            // Author (Year) 'Title', Journal, Volume(Issue), pp. xx-xx.
            reference += `'${title}'`;
            if (journal) reference += `, ${journal}`;
            if (pageNumbers) reference += `, pp. ${pageNumbers}`;
            reference += '.';
            break;

        case 'website':
            // Author (Year) Title. Available at: URL (Accessed: Date).
            reference += `${title}.`;
            break;

        default:
            // Generic format
            reference += `${title}.`;
            if (publisher) reference += ` ${publisher}.`;
    }

    // Add DOI if available
    if (doi) {
        reference += ` doi: ${doi}`;
    }

    return reference;
};

// Helper to strip markdown symbols for cleaner PDF text
const formatText = (text: string) => {
    // Remove bold/italic markers
    let clean = text.replace(/\*\*/g, '').replace(/\*/g, '');
    // Remove links [text](url) -> text
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // Remove source citations [Source 1], [Source 1, 2]
    clean = clean.replace(/\[Source\s+[\d,\s]+\]/g, '');
    return clean;
};

// Helper to format date nicely
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
};

export const DeepResearchReport: React.FC<DeepResearchReportProps> = ({ content, sources, timestamp }) => {
    // Simple parser to separate content into chunks
    const paragraphs = content.split('\n').filter(p => {
        const trimmed = p.trim();
        if (!trimmed) return false;

        // Remove the Deep Research stats footer
        if (trimmed.includes("Deep Research completed in") && trimmed.includes("sources")) return false;

        // Remove horizontal rules often used before the footer
        if (/^[-*_]{3,}$/.test(trimmed)) return false;

        return true;
    });

    // Sort sources alphabetically by author for references section (Harvard style)
    const sortedSources = sources ? [...sources].sort((a, b) => {
        const authorA = (a.author || (a.metadata?.author as string | undefined) || 'Unknown').toLowerCase();
        const authorB = (b.author || (b.metadata?.author as string | undefined) || 'Unknown').toLowerCase();
        return authorA.localeCompare(authorB);
    }) : [];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Zygotrix AI</Text>
                        <Text style={styles.subHeader}>Deep Research Report • Generated on {formatDate(timestamp)}</Text>
                    </View>
                </View>

                {/* Content */}
                {paragraphs.map((para, index) => {
                    // Check if it's a heading
                    if (para.startsWith('#')) {
                        const headingText = para.replace(/^#+\s/, '');
                        return <Text key={index} style={styles.heading}>{formatText(headingText)}</Text>;
                    }
                    // Check if it's a list item
                    if (para.startsWith('- ') || para.startsWith('• ')) {
                        return <Text key={index} style={[styles.content, { marginBottom: 4, marginLeft: 10 }]}>• {formatText(para.substring(2))}</Text>;
                    }

                    // Regular paragraph
                    return <Text key={index} style={styles.content}>{formatText(para)}</Text>;
                })}

                {/* References Section - Harvard Style */}
                {sortedSources.length > 0 && (
                    <View style={styles.referencesSection}>
                        <Text style={styles.referencesTitle}>References</Text>
                        {sortedSources.map((source, idx) => {
                            const sourceUrl = source.url || (source.metadata?.url as string | undefined);
                            return (
                                <View key={idx} style={{ marginBottom: 8 }}>
                                    <Text style={styles.referenceItem}>
                                        {generateHarvardReference(source)}
                                    </Text>
                                    {sourceUrl && (
                                        <Link src={sourceUrl} style={[styles.referenceItem, styles.referenceLink]}>
                                            {sourceUrl}
                                        </Link>
                                    )}
                                </View>
                            );
                        })}

                        {/* Note about citation format */}
                        <Text style={{ fontSize: 8, color: '#9CA3AF', marginTop: 15, fontStyle: 'italic' }}>
                            References formatted in Harvard citation style. Sources derived from official research papers and academic texts.
                        </Text>
                    </View>
                )}

                {/* Footer */}
                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Zygotrix AI Research • Page ${pageNumber} of ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
};

// Export utility functions for use in other components
export { generateInTextCitation, generateHarvardReference, formatAuthorHarvard };
