// src/constants/settings.ts
import * as Tone from "tone";

export const musicSetting = {
  beatCount: 12,       // 拍数
  bpm: 120,            // ビジュアル用 BPM
  drumMidiFileName: "drum.mid", // public フォルダに配置する MIDI ファイル名
  drumKickMidiID: 36,        
  drumSnareMidiID: 38,       
  drumCymbalMidiID: 42,      
};

export const frameSetting = {
  columnCount: musicSetting.beatCount,
  rowCount: 2,
  padding: 3,
  size: 50,
  color: "#222222", // 枠線の色
};

export const canvasSetting = {
  height: 400,
  backgroundColor: "#FFFFFF",  // 背景色（白）
};

/** ドラムの種類 */
export enum beatType {
  Cymbal,  // 四角＋×印 
  Snare,   // 枠だけの四角
  Kick,    // 塗りつぶし四角
}

/** ドラムシェイプの色設定 */
export const drumColors = {
  kick: "#FF0000",   // Kick：赤
  snare: "#00FF00",  // Snare：緑
  cymbal: "#0000FF", // Cymbal：青
};

/** MIDI解析結果を保持するマップ */
export const midi = {
  drumMap: new Map<number, Map<number, beatType>>(),
};

/** p5.js 側の進行管理 */
export const progress = {
  measureCount: 0,
  beatCount: 0,
  lastBeatTimeMs: 0,
};

/** Tone.Part 管理用の配列 */
export let parts: Tone.Part[] = [];

/** エフェクト（拡大アニメーション）用および残す静的形状用の型 */
export type EffectEvent = {
  startTime: number;
  x: number;
  y: number;
  drumType: beatType;
};

export type StaticShape = {
  x: number;
  y: number;
  drumType: beatType;
};

/** エフェクトと静的形状の配列 */
export const effects: EffectEvent[] = [];
export const staticShapes: StaticShape[] = [];
