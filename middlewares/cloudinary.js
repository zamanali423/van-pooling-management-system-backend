const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (filePath, folder = "uploads") =>
  cloudinary.uploader.upload(filePath, { folder, resource_type: "auto" });

const uploadBufferToCloudinary = (buffer, filename, folder = "uploads") =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename.replace(/\.[^/.]+$/, ""),
        resource_type: "auto",
      },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    uploadStream.end(buffer);
  });

const deleteFromCloudinary = async (publicId) =>
  cloudinary.uploader.destroy(publicId);

const getOptimizedUrl = (publicId, options = {}) =>
  cloudinary.url(publicId, {
    fetch_format: "auto",
    quality: "auto",
    ...options,
  });

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl,
};
