export type EditorAsset = {
  readonly key: string;
  readonly label: string;
};

const IMAGE_UPLOAD_INTENT_PREFIX = 'upload-image:';

export function imageUploadIntent(fieldName: string): string {
  return `${IMAGE_UPLOAD_INTENT_PREFIX}${fieldName}`;
}

export function imageUploadFieldFromIntent(intent: string): string | null {
  if (!intent.startsWith(IMAGE_UPLOAD_INTENT_PREFIX)) return null;
  const fieldName = intent.slice(IMAGE_UPLOAD_INTENT_PREFIX.length);
  return fieldName.length > 0 ? fieldName : null;
}
