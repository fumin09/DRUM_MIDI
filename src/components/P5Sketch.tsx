// src/components/P5Sketch.tsx
import React, { useEffect, useRef, useState } from "react";
import Sketch from "react-p5";
import p5 from "p5";
import { Midi } from "@tonejs/midi";
import {
  musicSetting,
  frameSetting,
  drumSetting,
  midi,
  progress,
  effects,
  staticShapes,
  EffectEvent,
  StaticShape,
} from "../constants/settings";
import * as Tone from "tone";
import { calcX, calcY, drawDrumShape, easeOutQuadSimple } from "../utils/p5Helpers";
import ControlPanel from "./ControlPanel";
import { parseMidiFile } from "../utils/midiParser";
import { loadFromIndexedDB } from "./MIDIUpload"; // IndexedDBから読み込む関数をimport
import PianoRoll from "./PianoRoll";

const P5Sketch: React.FC = () => {
  const midiDataRef = useRef<Midi | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(musicSetting.bpm);

  /** MIDIファイルをIndexedDBから読み込んでセットアップ */
  const loadMidiFromDB = async () => {
    const arrayBuffer = await loadFromIndexedDB();
    if (arrayBuffer) {
      const midiData = await parseMidiFile(arrayBuffer);
      midiDataRef.current = midiData;
      console.log("✅ IndexedDBからMIDIを読み込みました:", midiData);
    } else {
      console.warn("⚠ IndexedDBにMIDIファイルが見つかりませんでした");
    }
  };

  useEffect(() => {
    loadMidiFromDB(); // 初回読み込みでDBから取得
  }, []);

  /** BPM変更 */
  const handleChangeBPM = (val: number) => setBpm(val);

  /** p5.js setup */
  const setup = (p: p5, parent: Element) => {
    console.log("setup called");
    p.createCanvas(p.windowWidth, drumSetting.height).parent(parent);
    p.rectMode(p.CENTER);
    p.background(drumSetting.backgroundColor);
    p.frameRate(60);
    drawFrames(p);
  };
  

  /** p5.js draw */
  const draw = (p: p5) => {
    if (!isPlaying) return;
    p.background(drumSetting.backgroundColor);
    drawFrames(p);
    drawStaticShapes(p);

    const beatMs = Math.floor((60 / bpm) * 1000 * (4 / musicSetting.beatCount));
    const predictionOffset = 160; // ← 🎯 60ms 先を描く（お好みで 30〜80ms 調整）
    const now = Tone.now() * 1000 + predictionOffset; // ★ 予測タイミングに変更！; // ミリ秒に変換して使う！
   

    if (now - progress.lastBeatTimeMs >= beatMs) {
      if (progress.beatCount % musicSetting.beatCount === 0) {
        progress.beatCount = 0;
        progress.measureCount++;
      }
      progress.lastBeatTimeMs = now;
      progress.beatCount++;
      const rowVal = ((progress.measureCount - 1) % frameSetting.rowCount) + 1;
      const colVal = progress.beatCount;

      // 最初のビートのときに、前の measure の描画をクリア
      const clearVisuals = () => {
        effects.length = 0;
        staticShapes.length = 0;
      };
      // ここで変えて二段目（消さないで）
      if (progress.beatCount === 1 && progress.measureCount > 1) {
        clearVisuals();
      }

      const x = calcX(colVal, p.width);
      const y = calcY(rowVal);

      const measureMap = midi.drumMap.get(progress.measureCount);
      const drumType = measureMap?.get(colVal);
      if (drumType !== undefined) {
        effects.push({
          startTime: now,
          x,
          y,
          drumType,
        } as EffectEvent);
      }
    }
    updateAndDrawEffects(p, now);
  };

  const drawFrames = (p: p5) => {
    const { columnCount, rowCount, padding, size, color } = frameSetting;
    p.noFill();
    p.stroke(color);
    p.strokeWeight(1);
    const startX = (p.width - columnCount * size - (columnCount - 1) * padding) / 2;
    const startY = (p.height - rowCount * size - (rowCount - 1) * padding) / 2;
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < columnCount; col++) {
        const posX = startX + col * (size + padding) + size / 2;
        const posY = startY + row * (size + padding) + size / 2;
        p.square(posX, posY, size);
      }
    }
    p.textSize(15);
    p.fill("#222222");
    p.noStroke();
    p.text(
      `BPM(visual): ${bpm}, measure: ${progress.measureCount}, beat: ${progress.beatCount}/${musicSetting.beatCount}`,
      startX,
      startY - 10
    );
  };

  const drawStaticShapes = (p: p5) => {
    for (const shape of staticShapes) {
      p.push();
      p.translate(shape.x, shape.y);
      drawDrumShape(p, shape.drumType, 1.0, 255);
      p.pop();
    }
  };

  const updateAndDrawEffects = (p: p5, now: number) => {
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      const duration = 200;
      const frac = (now - e.startTime) / duration;
      if (frac >= 1) {
        staticShapes.push({
          x: e.x,
          y: e.y,
          drumType: e.drumType,
        } as StaticShape);
        effects.splice(i, 1);
        continue;
      }
      drawScaleEffect(p, e, frac);
    }
  };

  const drawScaleEffect = (p: p5, e: EffectEvent, frac: number) => {
    const eased = easeOutQuadSimple(frac);
    p.push();
    p.translate(e.x, e.y);
    p.scale(eased);
    drawDrumShape(p, e.drumType, 1.0, 255);
    p.pop();
  };
  const [startTime, setStartTime] = useState(0);

  

  return (
    <div>
<ControlPanel
  isPlaying={isPlaying}
  bpm={bpm}
  midiDataRef={midiDataRef}
  onChangeBPM={handleChangeBPM}
  onPlaybackStateChange={setIsPlaying}
  onStartTimeSet={setStartTime} // ✅ ここ1回だけにする！
/>
      <PianoRoll
  midiDataRef={midiDataRef}
  isPlaying={isPlaying}
  startTime={startTime} // ✅ これで音と視覚がバッチリ同期！
  bpm={bpm}
/>
<Sketch setup={setup} draw={draw} />
    </div>
  );
};

export default P5Sketch;
