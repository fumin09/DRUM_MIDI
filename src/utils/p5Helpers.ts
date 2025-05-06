// src/utils/p5Helpers.ts
import p5 from "p5";
import { drumSetting, frameSetting, beatType, drumColors } from "../constants/settings";

/** Ease-Out Quadratic 補間 */
export const easeOutQuad = (t: number, b: number, c: number, d: number): number => {
  t /= d;
  return -c * t * (t - 2) + b;
};

/** (col, row) → (x, y) 座標の計算 */
export const calcX = (colVal: number, canvasWidth: number): number => {
  const { columnCount, padding, size } = frameSetting;
  const startX = (canvasWidth - columnCount * size - (columnCount - 1) * padding) / 2;
  return startX + (colVal - 1) * (size + padding) + size / 2;
};

export const calcY = (rowVal: number): number => {
  const { rowCount, padding, size } = frameSetting;
  const startY = (drumSetting.height - rowCount * size - (rowCount - 1) * padding) / 2;
  return startY + (rowVal - 1) * (size + padding) + size / 2;
};

/** ドラムシェイプ描画関数 */
export const drawDrumShape = (p: p5, dt: beatType, scaleVal: number, alpha: number) => {
  const size = frameSetting.size - 5;
  const half = size / 2;
  switch (dt) {
    case beatType.Kick:
      p.fill(drumColors.kick); // Kick: 赤
      p.noStroke();
      p.square(0, 0, size);
      break;
    case beatType.Snare:
      p.noFill();
      p.stroke(drumColors.snare); // Snare: 緑
      p.strokeWeight(2);
      p.square(0, 0, size);
      break;
    case beatType.Cymbal:
      p.noFill();
      p.stroke(drumColors.cymbal); // Cymbal: 青
      p.strokeWeight(2);
      p.square(0, 0, size);
      p.line(-half, -half, half, half);
      p.line(half, -half, -half, half);
      break;
  }
};

/** シンプルな Ease-Out 補間 (入力0～1) */
export const easeOutQuadSimple = (x: number): number => {
  return 1 - (1 - x) * (1 - x);
};
