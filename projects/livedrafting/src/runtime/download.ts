import { getDraftAsImage } from "adacad-drafting-lib";
import { COLOR_PALETTE } from "./color-palette";
import { getCurrentDraft, getLastDisplayOptions, getViewportPixPerCell } from "./display";

function exportFilename(suffix: string, ext: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `livedrafting-${suffix}-${stamp}.${ext}`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function imageDataToPngBlob(image: ImageData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas for PNG export");
  }
  context.putImageData(image, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) {
        reject(new Error("Could not encode PNG"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

/** Encode ImageData as a 1-bit monochrome BMP (black and white pixels). */
function imageDataToMonochromeBmp(image: ImageData): Blob {
  const { width, height, data } = image;
  const row_size = Math.ceil(width / 8);
  const padded_row = Math.ceil(row_size / 4) * 4;
  const pixel_offset = 62;
  const file_size = pixel_offset + padded_row * height;
  const buffer = new Uint8Array(file_size);
  const view = new DataView(buffer.buffer);

  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, file_size, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, pixel_offset, true);

  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 1, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, file_size - pixel_offset, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 2, true);
  view.setUint32(50, 0, true);

  view.setUint32(54, 0x00000000, true);
  view.setUint32(58, 0x00ffffff, true);

  for (let y = 0; y < height; y++) {
    const bmp_row = height - 1 - y;
    const row_start = pixel_offset + bmp_row * padded_row;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const is_white = luminance >= 128;
      if (is_white) {
        buffer[row_start + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
  }

  return new Blob([buffer], { type: "image/bmp" });
}

export async function downloadCurrentView(): Promise<void> {
  const draft = getCurrentDraft();
  if (draft === null) {
    throw new Error("Nothing to download — run a sketch first");
  }

  const { use_color, floats } = getLastDisplayOptions();
  const pix_per_cell = getViewportPixPerCell(draft);

  const color_image = getDraftAsImage(
    draft,
    pix_per_cell,
    floats,
    use_color,
    COLOR_PALETTE
  );
  const bitmap_image = getDraftAsImage(draft, 1, false, false, COLOR_PALETTE);

  const png_blob = await imageDataToPngBlob(color_image);
  const bmp_blob = imageDataToMonochromeBmp(bitmap_image);

  triggerDownload(png_blob, exportFilename("color", "png"));
  triggerDownload(bmp_blob, exportFilename("bitmap", "bmp"));
}
