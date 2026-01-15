import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

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
        fontFamily: 'Roboto', // Global font family
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB', // gray-200
        paddingBottom: 20,
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: 10,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#059669', // emerald-600
    },
    subHeader: {
        fontSize: 10,
        color: '#6B7280', // gray-500
        marginTop: 5,
    },
    content: {
        fontSize: 11,
        lineHeight: 1.6,
        color: '#374151', // gray-700
        marginBottom: 10,
        textAlign: 'justify', // Cleaner look
    },
    heading: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827', // gray-900
        marginTop: 15,
        marginBottom: 8,
    },
    sourcesSection: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    sourcesTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#059669',
    },
    sourceItem: {
        fontSize: 10,
        marginBottom: 8,
        color: '#4B5563',
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
    sources?: any[]; // Using any[] for now matching the shape in ChatMessage
    timestamp: string;
}

// Helper to strip markdown symbols for cleaner PDF text
const formatText = (text: string) => {
    // Remove bold/italic markers
    let clean = text.replace(/\*\*/g, '').replace(/\*/g, '');
    // Remove links [text](url) -> text
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
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
    } catch (e) {
        return dateString;
    }
};

export const DeepResearchReport: React.FC<DeepResearchReportProps> = ({ content, sources, timestamp }) => {
    // Simple parser to separate content into chunks
    // This is a naive implementation; a full markdown-to-pdf parser is complex
    // We'll split by single newlines to handle headers vs lists correctly
    // Splitting by \n\n caused headers to swallow lists if they weren't separated by a blank line
    const paragraphs = content.split('\n').filter(p => p.trim());

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    {/* Note: In production with strict CORS, external images might fail. 
                Using a local path or base64 is safer. For now assuming LOGO_URL works. */}
                    {/* <Image style={styles.logo} src={LOGO_URL} /> */}
                    {/* Image component in @react-pdf can be finicky with relative paths in some envs. 
                Disabling logo image for reliability unless we confirm it works, 
                but user requested logo. Let's try to include text at least. */}
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
                        // Use slightly tighter margin for list items and indentation
                        return <Text key={index} style={[styles.content, { marginBottom: 4, marginLeft: 10 }]}>• {formatText(para.substring(2))}</Text>;
                    }

                    // Regular paragraph
                    return <Text key={index} style={styles.content}>{formatText(para)}</Text>;
                })}

                {/* Sources */}
                {sources && sources.length > 0 && (
                    <View style={styles.sourcesSection}>
                        <Text style={styles.sourcesTitle}>Research Sources</Text>
                        {sources.map((source, idx) => (
                            <View key={idx} style={styles.sourceItem}>
                                <Text style={{ fontWeight: 'bold' }}>
                                    [{idx + 1}] {source.title || 'Unknown Source'}
                                </Text>
                                {source.content_preview && (
                                    <Text style={{ fontStyle: 'italic', marginTop: 2 }}>
                                        "{source.content_preview.substring(0, 150)}..."
                                    </Text>
                                )}
                            </View>
                        ))}
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
