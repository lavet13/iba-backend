export const mimeTypesImages: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpg',
  png: 'image/png',
  webp: 'image/webp',
};

export function getMimeTypeImage(filename: string) {
  const extension = filename.split('.').pop() ?? '';

  return mimeTypesImages[extension] || 'application/octet-stream';
}
