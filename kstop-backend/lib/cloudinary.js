const { v2: cloudinary } = require("cloudinary");

function configureCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
    return true;
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return false;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
}

function ensureConfigured() {
  if (!configureCloudinary()) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_URL or the CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET environment variables.");
  }
}

function uploadBuffer(buffer, options = {}) {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    stream.end(buffer);
  });
}

async function deleteAsset(publicId) {
  ensureConfigured();
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
}

module.exports = { uploadBuffer, deleteAsset };
