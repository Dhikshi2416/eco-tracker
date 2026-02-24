import axios from 'axios';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  // This will help diagnose missing env config in development.
  // In production builds, console warnings are generally ignored.
  // eslint-disable-next-line no-console
  console.warn(
    '[Cloudinary] Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET',
  );
}

export async function uploadActionPhotoToCloudinary(file, folder = 'eco-tracker/action-photos') {
  if (!file) return null;

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured. Please set VITE_CLOUDINARY_* env vars.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  if (folder) formData.append('folder', folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const res = await axios.post(endpoint, formData);

  return res.data?.secure_url || null;
}

