import {
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
  RingGeometry,
  Sprite,
  SpriteMaterial,
} from "three";
import { CELL_SIZE, VIEW_SCALE } from "./simVars";

type ScoredSeedDebugInfo = {
  centerI: number;
  centerJ: number;
  radius: number;
  processed: boolean;
  floatId: number;
  score: number;
};

const makeLabel = (text: string): Sprite => {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new Sprite(new SpriteMaterial({ color: new Color("#f8f0c8") }));
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8f0c8";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 8, canvas.height / 2);
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new SpriteMaterial({ map: texture, transparent: true });
  const sprite = new Sprite(material);
  sprite.scale.set(CELL_SIZE * 5, CELL_SIZE * 1.6, 1);
  return sprite;
};

export const createSeedDebugGeometry = (seedDebug: ScoredSeedDebugInfo[]): Group => {
  const group = new Group();

  for (const entry of seedDebug) {
    const cx = (entry.centerJ + 0.5) * CELL_SIZE;
    const cy = (entry.centerI + 0.5) * CELL_SIZE;
    const outerRadius = entry.radius * CELL_SIZE;

    const ring = new Mesh(
      new RingGeometry(Math.max(0.02, outerRadius - CELL_SIZE * 0.12), outerRadius, 48),
      new MeshLambertMaterial({
        color: entry.processed ? new Color("#00d2ff") : new Color("#ff5f5f"),
        transparent: true,
        opacity: entry.processed ? 0.18 : 0.1,
        side: 2,
      }),
    );
    ring.position.set(cx, cy, -0.09);
    group.add(ring);

    const center = new Mesh(
      new PlaneGeometry(CELL_SIZE * 0.35, CELL_SIZE * 0.35),
      new MeshLambertMaterial({
        color: entry.processed ? new Color("#00d2ff") : new Color("#ff5f5f"),
      }),
    );
    center.position.set(cx, cy, -0.095);
    group.add(center);

    const label = makeLabel(`id:${entry.floatId} s:${entry.score} r:${entry.radius}`);
    label.position.set(cx + CELL_SIZE * 0.6, cy - CELL_SIZE * 0.2, -0.12);
    label.material.opacity = entry.processed ? 0.95 : 0.55;
    group.add(label);
  }

  group.scale.set(VIEW_SCALE, -VIEW_SCALE, VIEW_SCALE);
  group.visible = false;
  return group;
};
