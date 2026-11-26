const MAX_BYTES = 2500000;

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that picture.'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new Error('That picture could not be opened.'));
    image.onload = () => resolve(image);
    image.src = src;
  });

const encode = (image, maxSize, quality) => {
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', quality);
};

/** Compress a photo in the browser so it fits comfortably in a JSON request. */
export async function compressPhoto(file) {
  if (!file) throw new Error('Choose a picture of the truck.');
  if (!file.type.startsWith('image/')) throw new Error('Choose a JPG, PNG or WebP picture.');

  const source = await readFile(file);
  const image = await loadImage(source);

  let dataUrl = encode(image, 1280, 0.72);
  if (dataUrl.length > MAX_BYTES) dataUrl = encode(image, 1024, 0.6);
  if (dataUrl.length > MAX_BYTES) dataUrl = encode(image, 900, 0.5);
  if (dataUrl.length > MAX_BYTES) throw new Error('That picture is too large. Try a smaller photo.');

  return dataUrl;
}

export const truckPhoto = (truck) =>
  Array.isArray(truck?.photos) && truck.photos.length ? truck.photos[0] : null;
