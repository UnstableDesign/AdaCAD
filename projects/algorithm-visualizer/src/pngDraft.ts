import { createCell, type Drawdown } from "adacad-drafting-lib";

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read PNG file."));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to decode PNG image."));
    image.src = src;
  });

export const pngFileToDrawdown = async (
  file: File,
  blackThreshold = 128,
): Promise<Drawdown> => {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable while parsing PNG.");
  }

  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, image.width, image.height).data;

  const drawdown: Drawdown = [];
  for (let y = 0; y < image.height; y += 1) {
    const row = [];
    for (let x = 0; x < image.width; x += 1) {
      const idx = (y * image.width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      // Transparent pixels default to false (white) for safer imports.
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const isBlack = a > 0 && luminance < blackThreshold;
      row.push(createCell(isBlack));
    }
    drawdown.push(row);
  }

  return drawdown;
};
