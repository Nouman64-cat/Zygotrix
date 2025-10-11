export const CLOUDINARY_CONFIG = {
  cloudName: "dnrn6rcem",
  apiKey: "764158524686265",
  // Note: Never expose API secret in frontend code
  uploadPreset: "zygotrix-uploads", // Create this in your Cloudinary dashboard
  profileUploadPreset: "zygotrix-profiles", // Create this for profile pictures
  questionUploadPreset: "zygotrix-questions", // Create this for community question images
  maxFileSize: 10 * 1024 * 1024, // 10MB limit
  allowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
};

export const CLOUDINARY_URLS = {
  upload: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
  transform: (publicId: string, transformations: string = "") =>
    `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformations}/${publicId}`,
};

// Common transformations
export const CLOUDINARY_TRANSFORMATIONS = {
  profilePicture: "w_200,h_200,c_fill,g_face,f_auto,q_auto",
  profilePictureSmall: "w_100,h_100,c_fill,g_face,f_auto,q_auto",
  questionImage: "w_800,h_600,c_limit,f_auto,q_auto",
  questionImageThumbnail: "w_400,h_300,c_fill,f_auto,q_auto",
};
