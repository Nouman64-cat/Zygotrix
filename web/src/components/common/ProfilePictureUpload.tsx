import React, { useState } from "react";
import { FiCamera, FiUser } from "react-icons/fi";
import ImageUpload from "./ImageUpload";
import { cloudinaryService } from "../../services/cloudinaryService";

interface ProfilePictureUploadProps {
  userId: string;
  currentImageUrl?: string;
  onUploadSuccess: (imageUrl: string, thumbnailUrl: string) => void;
  onUploadError?: (error: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  userId,
  currentImageUrl,
  onUploadSuccess,
  onUploadError,
  size = "md",
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await cloudinaryService.uploadProfilePicture(file, userId);
      onUploadSuccess(result.url, result.thumbnailUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      onUploadError?.(message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden group`}
      >
        {/* Profile Picture Display */}
        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <FiUser className="w-1/2 h-1/2 text-blue-400" />
          )}
        </div>

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ImageUpload
              onUpload={handleUpload}
              placeholder=""
              className="absolute inset-0"
              maxSize={5} // 5MB for profile pictures
              disabled={isUploading}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <FiCamera className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Upload hint */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <p className="text-xs text-gray-500 text-center">
          Click to upload photo
        </p>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
