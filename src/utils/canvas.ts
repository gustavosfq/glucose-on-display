import { createCanvas } from "canvas";
import { GlucoseData } from "../glucoseClient";
import { nativeImage } from "electron";

export const createTextTrayIcon = ({
  value,
  color,
}: GlucoseData): Electron.NativeImage => {
  const canvas = createCanvas(64, 64);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 32, 32);
  ctx.font = "22px San Francisco";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value, 32, 32);

  return nativeImage.createFromBuffer(canvas.toBuffer());
}