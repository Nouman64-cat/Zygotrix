import {
  CLOUDINARY_CONFIG,
  CLOUDINARY_URLS,
  CLOUDINARY_TRANSFORMATIONS,
} from "../config/cloudinary";

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width: number;
  height: number;
}

interface UploadOptions {
  folder?: string;
  tags?: string[];
  context?: Record<string, string>;
}

class CloudinaryService {
  private validateFile(file: File): void {
    // Check file size
    if (file.size > CLOUDINARY_CONFIG.maxFileSize) {
      throw new Error(
        `File size must be less than ${
          CLOUDINARY_CONFIG.maxFileSize / (1024 * 1024)
        }MB`
      );
    }

    // Check file format
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (
      !fileExtension ||
      !CLOUDINARY_CONFIG.allowedFormats.includes(fileExtension)
    ) {
      throw new Error(
        `File format must be one of: ${CLOUDINARY_CONFIG.allowedFormats.join(
          ", "
        )}`
      );
    }
  }

  private async uploadToCloudinary(
    file: File,
    uploadPreset: string,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResponse> {
    this.validateFile(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    if (options.folder) {
      formData.append("folder", options.folder);
    }

    if (options.tags && options.tags.length > 0) {
      formData.append("tags", options.tags.join(","));
    }

    if (options.context) {
      formData.append(
        "context",
        Object.entries(options.context)
          .map(([key, value]) => `${key}=${value}`)
          .join("|")
      );
    }

    const response = await fetch(CLOUDINARY_URLS.upload, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Cloudinary upload error:", errorData);
      throw new Error(errorData.error?.message || "Upload failed");
    }

    return response.json();
  }

  async uploadProfilePicture(
    file: File,
    userId: string
  ): Promise<{
    publicId: string;
    url: string;
    thumbnailUrl: string;
  }> {
    const result = await this.uploadToCloudinary(
      file,
      CLOUDINARY_CONFIG.profileUploadPreset,
      {
        folder: "profiles",
        tags: ["profile", "user"],
        context: { user_id: userId },
      }
    );

    // Add file extension to public_id for thumbnail URL
    const publicIdWithExtension = `${result.public_id}.${result.format}`;

    return {
      publicId: result.public_id,
      url: result.secure_url, // Use the original secure URL from Cloudinary
      thumbnailUrl: CLOUDINARY_URLS.transform(
        publicIdWithExtension,
        CLOUDINARY_TRANSFORMATIONS.profilePictureSmall
      ),
    };
  }

  async uploadQuestionImage(
    file: File,
    questionId: string,
    userId: string
  ): Promise<{
    publicId: string;
    url: string;
    thumbnailUrl: string;
  }> {
    const result = await this.uploadToCloudinary(
      file,
      CLOUDINARY_CONFIG.questionUploadPreset,
      {
        folder: "questions",
        tags: ["question", "community"],
        context: {
          question_id: questionId,
          user_id: userId,
        },
      }
    );

    // Add file extension to public_id for thumbnail URL
    const publicIdWithExtension = `${result.public_id}.${result.format}`;

    return {
      publicId: result.public_id,
      url: result.secure_url, // Use the original secure URL from Cloudinary
      thumbnailUrl: CLOUDINARY_URLS.transform(
        publicIdWithExtension,
        CLOUDINARY_TRANSFORMATIONS.questionImageThumbnail
      ),
    };
  }

  async deleteImage(publicId: string): Promise<void> {
    // Note: Deletion requires server-side implementation with API secret
    // This is a placeholder for the frontend
    console.warn(
      "Image deletion must be implemented on the server side for:",
      publicId
    );
  }

  getOptimizedUrl(publicId: string, transformation: string): string {
    return CLOUDINARY_URLS.transform(publicId, transformation);
  }
}

export const cloudinaryService = new CloudinaryService();
export type { CloudinaryUploadResponse };
