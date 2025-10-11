import React, { useState, useRef, useEffect } from "react";
import { FiUpload, FiX, FiLoader } from "react-icons/fi";

interface ImageUploadProps {
  onUpload: (file: File) => Promise<{ url: string } | void>;
  currentImageUrl?: string;
  placeholder?: string;
  className?: string;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  currentImageUrl,
  placeholder = "Click to upload image",
  className = "",
  maxSize = 10,
  acceptedFormats = ["jpg", "jpeg", "png", "gif", "webp"],
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageUrl || null
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log("ImageUpload render - currentImageUrl:", currentImageUrl);
  console.log("ImageUpload render - previewUrl state:", previewUrl);

  // Update preview when currentImageUrl prop changes
  useEffect(() => {
    console.log(
      "ImageUpload useEffect - currentImageUrl changed to:",
      currentImageUrl
    );
    if (currentImageUrl) {
      setPreviewUrl(currentImageUrl);
    }
  }, [currentImageUrl]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    const isValidFormat = acceptedFormats.some((format) => {
      // Check if format is a MIME type (contains '/')
      if (format.includes("/")) {
        return file.type === format;
      } else {
        // Check if format is a file extension
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        return fileExtension === format;
      }
    });

    if (!isValidFormat) {
      setError(
        `Please select a valid image file (${acceptedFormats.join(", ")})`
      );
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const result = await onUpload(file);
      console.log("Upload result in ImageUpload:", result);
      // If upload returns a URL, use it for preview
      if (result?.url) {
        console.log("Setting preview URL to:", result.url);
        setPreviewUrl(result.url);
      }
    } catch (err) {
      console.error("Upload error in ImageUpload:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      // Keep the local preview so the user can still see the image they selected
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        onClick={handleClick}
        className={`
          relative w-full min-h-32 border-2 border-dashed rounded-xl cursor-pointer
          transition-all duration-200 overflow-hidden
          ${
            disabled
              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
              : "border-blue-300 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50"
          }
          ${error ? "border-red-300 bg-red-50" : ""}
        `}
      >
        {previewUrl ? (
          <div className="relative w-full max-h-80 min-h-32 overflow-hidden rounded-lg">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto max-h-80 object-contain rounded-lg"
              onLoad={() =>
                console.log("Image loaded successfully:", previewUrl)
              }
              onError={(e) => {
                console.error("Image failed to load:", previewUrl);
                console.error("Image error event:", e);
              }}
            />
            {!isUploading && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <div className="flex gap-2">
                  <button
                    onClick={handleClick}
                    className="bg-white text-blue-600 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                    disabled={disabled || isUploading}
                    type="button"
                  >
                    <FiUpload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRemove}
                    className="bg-white text-red-600 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                    disabled={disabled || isUploading}
                    type="button"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-3 rounded-lg">
                  <FiLoader className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            {isUploading ? (
              <>
                <FiLoader className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <p className="text-sm text-blue-600 font-medium">
                  Uploading...
                </p>
              </>
            ) : (
              <>
                <FiUpload className="w-8 h-8 text-blue-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  {placeholder}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {acceptedFormats.join(", ").toUpperCase()} up to {maxSize}MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats
          .map((format) => {
            // If format is a MIME type, use it as-is; otherwise add a dot for file extension
            return format.includes("/") ? format : `.${format}`;
          })
          .join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
};

export default ImageUpload;
