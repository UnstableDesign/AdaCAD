import { COLOR_PALETTE } from "./runtime/color-palette";

const grid = document.getElementById("color-palette-grid");

function isLightColor(hex: string): boolean {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

if (grid) {
  for (const material of COLOR_PALETTE) {
    const item = document.createElement("div");
    item.className = "color-palette-item";

    const swatch = document.createElement("div");
    swatch.className = "color-palette-swatch";
    swatch.style.backgroundColor = material.color;
    swatch.style.color = isLightColor(material.color) ? "#1a1a2e" : "#f8f9fa";
    swatch.textContent = String(material.id);

    const meta = document.createElement("div");
    meta.className = "color-palette-meta";
    meta.innerHTML = `<span class="color-palette-index">${material.id}</span> <span class="color-palette-name">${material.name}</span><code class="color-palette-hex">${material.color}</code>`;

    item.append(swatch, meta);
    grid.append(item);
  }
}
