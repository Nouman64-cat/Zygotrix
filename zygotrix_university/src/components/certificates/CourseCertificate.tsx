import React, { useRef, useState } from "react";

interface CourseCertificateProps {
  userName: string;
  courseName: string;
  completedAt: Date;
  onDownload?: () => void;
}

const CourseCertificate: React.FC<CourseCertificateProps> = ({
  userName,
  courseName,
  completedAt,
  onDownload,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(completedAt));

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    if (!certificateRef.current) return;

    try {
      setIsGenerating(true);

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      const filename = `${userName.replace(/\s+/g, "_")}_${courseName
        .replace(/\s+/g, "_")
        .substring(0, 30)}_Certificate.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        "PDF generation libraries not installed. Please install html2canvas and jspdf:\n\nnpm install html2canvas jspdf"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-4">
      {/* Certificate Preview - Professional Design */}
      <div
        ref={certificateRef}
        className="w-full max-w-[1000px] rounded-xl overflow-hidden relative"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          aspectRatio: "1.414/1",
        }}
        id="certificate"
      >
        {/* Decorative Border */}
        <div
          className="absolute inset-4"
          style={{
            border: "3px solid #3b82f6",
            borderRadius: "8px",
          }}
        />
        <div
          className="absolute inset-6"
          style={{
            border: "1px solid #93c5fd",
            borderRadius: "6px",
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full p-16">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-4 mb-4">
              <img
                src="/zygotrix-logo.png"
                alt="Zygotrix Logo"
                className="w-16 h-16"
                style={{ objectFit: "contain" }}
              />
              <h1
                className="text-3xl font-bold tracking-wide"
                style={{ color: "#1e40af" }}
              >
                ZYGOTRIX
              </h1>
            </div>
            <div
              className="text-xs uppercase tracking-[0.4em] font-semibold"
              style={{ color: "#6b7280" }}
            >
              University
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center mb-8">
            <h2
              className="text-2xl tracking-[0.3em] uppercase font-bold mb-2"
              style={{ color: "#111827" }}
            >
              Certificate of Completion
            </h2>
            <div
              className="w-32 h-1 mx-auto"
              style={{
                background: "linear-gradient(to right, #3b82f6, #22c55e)",
              }}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center text-center px-8">
            <p
              className="text-sm mb-6 uppercase tracking-wider"
              style={{ color: "#6b7280" }}
            >
              This certifies that
            </p>

            <h3
              className="text-4xl font-bold mb-8 px-8"
              style={{
                color: "#1e40af",
              }}
            >
              {userName}
            </h3>

            <p
              className="text-sm mb-6 uppercase tracking-wider"
              style={{ color: "#6b7280" }}
            >
              has successfully completed
            </p>

            <h4
              className="text-2xl font-semibold mb-4 px-4 leading-relaxed"
              style={{ color: "#374151" }}
            >
              {courseName}
            </h4>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end mt-auto pt-8">
            <div className="flex-1">
              <div
                className="w-48 mb-2"
                style={{ borderTop: "2px solid #d1d5db" }}
              />
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "#6b7280" }}
              >
                Date of Completion
              </p>
              <p className="text-sm font-semibold" style={{ color: "#111827" }}>
                {formattedDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="px-6 py-3 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        style={{
          background: "linear-gradient(to right, #2563eb, #16a34a)",
        }}
      >
        {isGenerating ? "Generating PDF..." : "Download Certificate"}
      </button>
    </div>
  );
};

export default CourseCertificate;
