import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register Roboto font to ensure consistent rendering across all PDF viewers
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf",
      fontStyle: "italic",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Roboto",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7C3AED", // Purple for Scholar Mode
  },
  subHeader: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 5,
  },
  badge: {
    fontSize: 8,
    color: "#FFFFFF",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  content: {
    fontSize: 11,
    lineHeight: 1.6,
    color: "#374151",
    marginBottom: 10,
    textAlign: "justify",
  },
  heading: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 15,
    marginBottom: 8,
  },
  // Sources section styles - color coded by type
  sourcesSection: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111827",
  },
  sourceItem: {
    fontSize: 10,
    marginBottom: 6,
    color: "#374151",
    lineHeight: 1.4,
  },
  sourceNumber: {
    fontWeight: "bold",
    color: "#7C3AED",
  },
  sourceType: {
    fontSize: 8,
    color: "#6B7280",
    fontStyle: "italic",
  },
  sourcePreview: {
    fontSize: 9,
    color: "#6B7280",
    fontStyle: "italic",
    marginLeft: 20,
    marginTop: 2,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#9CA3AF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  statsBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
    marginBottom: 15,
  },
  statsText: {
    fontSize: 9,
    color: "#6B7280",
  },
});

// Scholar source interface (standalone to avoid type conflicts)
interface ScholarSource {
  title?: string;
  url?: string;
  content_preview?: string;
  source_type?: string;
  relevance_score?: number;
  rerank_score?: number;
  metadata?: Record<string, unknown>;
}

interface ScholarReportProps {
  content: string;
  sources?: ScholarSource[];
  timestamp: string;
  stats?: {
    deep_research_sources?: number;
    web_search_sources?: number;
    time_ms?: number;
  };
}

// Helper to strip markdown symbols and simplify citations for cleaner PDF text
const formatText = (text: string) => {
  // Remove bold/italic markers
  let clean = text.replace(/\*\*/g, "").replace(/\*/g, "");
  // Remove links [text](url) -> text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Handle various source citation formats
  clean = clean.replace(
    /\[(Sources?\s*[\d,\s]+(?:,?\s*Sources?\s*\d+)*)\]/gi,
    (_match, content) => {
      const numbers = content
        .replace(/Sources?\s*/gi, "")
        .replace(/\s+/g, " ")
        .trim();
      return `[${numbers}]`;
    },
  );

  return clean;
};

// Helper to format date nicely
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

export const ScholarReport: React.FC<ScholarReportProps> = ({
  content,
  sources,
  timestamp,
  stats,
}) => {
  // Simple parser to separate content into chunks
  const paragraphs = content.split("\n").filter((p) => {
    const trimmed = p.trim();
    if (!trimmed) return false;

    // Remove the Scholar Mode stats footer
    if (
      trimmed.includes("Scholar Mode completed in") &&
      trimmed.includes("sources")
    )
      return false;

    // Remove horizontal rules often used before the footer
    if (/^[-*_]{3,}$/.test(trimmed)) return false;

    return true;
  });

  // Filter out sources without meaningful content
  const validSources =
    sources?.filter((s) => s.title || s.content_preview) || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Zygotrix AI - Scholar Mode</Text>
            <Text style={styles.subHeader}>
              Comprehensive Research Report • Generated on{" "}
              {formatDate(timestamp)}
            </Text>
          </View>
        </View>

        {/* Stats Box */}
        {stats && (
          <View style={styles.statsBox}>
            <Text style={styles.statsText}>
              📚 Knowledge Base Sources: {stats.deep_research_sources || 0} | 🌐
              Web Sources: {stats.web_search_sources || 0} | ⏱️ Processing Time:{" "}
              {stats.time_ms || 0}ms
            </Text>
          </View>
        )}

        {/* Content */}
        {paragraphs.map((para, index) => {
          // Check if it's a heading
          if (para.startsWith("#")) {
            const headingText = para.replace(/^#+\s/, "");
            return (
              <Text key={index} style={styles.heading}>
                {formatText(headingText)}
              </Text>
            );
          }
          // Check if it's a list item
          if (para.startsWith("- ") || para.startsWith("• ")) {
            return (
              <Text
                key={index}
                style={[styles.content, { marginBottom: 4, marginLeft: 10 }]}
              >
                • {formatText(para.substring(2))}
              </Text>
            );
          }

          // Regular paragraph
          return (
            <Text key={index} style={styles.content}>
              {formatText(para)}
            </Text>
          );
        })}

        {/* Sources Section - With Source Type */}
        {validSources.length > 0 && (
          <View style={styles.sourcesSection}>
            <Text style={styles.sourcesTitle}>Sources</Text>

            {validSources.map((source, idx) => {
              const title =
                source.title ||
                (source.metadata?.title as string | undefined) ||
                "Untitled Source";
              const preview = source.content_preview || "";
              const sourceType =
                source.source_type === "deep_research"
                  ? "📚 Knowledge Base"
                  : source.source_type === "web_search"
                    ? "🌐 Web"
                    : "📄 Source";
              // Truncate preview to ~120 chars for readability
              const shortPreview =
                preview.length > 120
                  ? preview.substring(0, 120).trim() + "..."
                  : preview;

              return (
                <View key={idx} style={{ marginBottom: 10 }}>
                  <Text style={styles.sourceItem}>
                    <Text style={styles.sourceNumber}>[{idx + 1}]</Text> {title}
                    <Text style={styles.sourceType}> • {sourceType}</Text>
                  </Text>
                  {shortPreview && (
                    <Text style={styles.sourcePreview}>"{shortPreview}"</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({
            pageNumber,
            totalPages,
          }: {
            pageNumber: number;
            totalPages: number;
          }) =>
            `Zygotrix AI Scholar Mode • Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};
