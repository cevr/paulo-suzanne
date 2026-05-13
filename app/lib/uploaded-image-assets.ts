export const ADMIN_IMAGE_UPLOAD_ACCEPT =
  'image/avif,image/gif,image/jpeg,image/png,image/webp';

export const ADMIN_IMAGE_UPLOAD_CONTENT_TYPE = 'image/webp';
export const ADMIN_IMAGE_UPLOAD_OUTPUT_EXTENSION = '.webp';
export const ADMIN_IMAGE_UPLOAD_PREFIX = 'images/uploads';
export const ADMIN_IMAGE_UPLOAD_THUMBNAIL_MARKER = '.thumb';

const ACCEPTED_IMAGE_TYPES = new Set(
  ADMIN_IMAGE_UPLOAD_ACCEPT.split(',').map((type) => type.trim()),
);

export function isAcceptedAdminImageType(type: string): boolean {
  return ACCEPTED_IMAGE_TYPES.has(type);
}

export function thumbnailKeyForImage(key: string): string {
  const slashIndex = key.lastIndexOf('/');
  const dotIndex = key.lastIndexOf('.');
  if (dotIndex <= slashIndex) return `${key}${ADMIN_IMAGE_UPLOAD_THUMBNAIL_MARKER}`;
  return `${key.slice(0, dotIndex)}${ADMIN_IMAGE_UPLOAD_THUMBNAIL_MARKER}${key.slice(dotIndex)}`;
}
