// src/components/P5Sketch.tsx
import React, { useRef, useState } from "react";
import Sketch from "react-p5";
import p5 from "p5";
import { Midi } from "@tonejs/midi";
import * as Tone from "tone";
import {
  musicSetting,
  frameSetting,
  canvasSetting,
  midi,
  progress,
  parts,
  effects,
  staticShapes,
  EffectEvent,
  StaticShape,
} from "../constants/settings";
import { calcX, calcY, drawDrumShape, easeOutQuadSimple } from "../utils/p5Helpers";
import { parseMidiFile } from "../utils/midiParser";

const P5Sketch: React.FC = () => {
  const midiDataRef = useRef<Midi | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(musicSetting.bpm);

  /** preload: MIDIファイル読み込み */
  const preload = async (p: p5) => {
    console.log("preload start");
    const response = await fetch(`/${musicSetting.drumMidiFileName}`);
    const arrayBuffer = await response.arrayBuffer();
    const midiData = await parseMidiFile(arrayBuffer);
    midiDataRef.current = midiData;
    console.log("MIDI解析完了");
  };

  /** Start ボタン */
  const handleStart = async () => {
    console.log("Start button clicked");
    if (!midiDataRef.current) {
      console.log("MIDIデータがまだロードされていません");
      return;
    }
    await Tone.start();
    parts.forEach((p) => p.dispose());
    midiDataRef.current.tracks.forEach((track) => {
      const synth = new Tone.PolySynth().toDestination();
      const part = new Tone.Part(
        (time, note) => {
          synth.triggerAttackRelease(note.name, note.duration, time);
        },
        track.notes.map((note) => ({
          time: note.time,
          name: note.name,
          duration: note.duration,
        }))
      );
      part.loop = false;
      parts.push(part);
    });
    parts.forEach((part) => part.start(0));
    setIsPlaying(true);
    progress.lastBeatTimeMs = 0;
  };

  /** Stop ボタン */
  const handleStop = () => {
    parts.forEach((part) => part.stop(0));
    setIsPlaying(false);
    progress.measureCount = 0;
    progress.beatCount = 0;
    progress.lastBeatTimeMs = 0;
    effects.splice(0, effects.length);
    staticShapes.splice(0, staticShapes.length);
  };

  const handleChangeBPM = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBpm(Number(e.target.value));
  };

  /** p5.js setup */
  const setup = (p: p5, parent: Element) => {
    console.log("setup called");
    p.createCanvas(p.windowWidth, canvasSetting.height).parent(parent);
    p.rectMode(p.CENTER);
    p.background(canvasSetting.backgroundColor);
    drawFrames(p);
  };

  /** p5.js draw */
  const draw = (p: p5) => {
    if (!isPlaying) return;
    p.background(canvasSetting.backgroundColor);
    drawFrames(p);
    drawStaticShapes(p);

    const beatMs = Math.floor((60 / bpm) * 1000 * (4 / musicSetting.beatCount));
    const now = p.millis();
    if (now - progress.lastBeatTimeMs >= beatMs) {
      if (progress.beatCount % musicSetting.beatCount === 0) {
        progress.beatCount = 0;
        progress.measureCount++;
      }
      progress.lastBeatTimeMs = now;
      progress.beatCount++;
      const rowVal = ((progress.measureCount - 1) % frameSetting.rowCount) + 1;
      const colVal = progress.beatCount;
      if (rowVal === 2 && colVal === musicSetting.beatCount) {
        effects.splice(0, effects.length);
        staticShapes.splice(0, staticShapes.length);
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

  /** 枠描画 */
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
    p.fill("#FFFFFF");
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

  return (
    <div>
      <label>
        Visual BPM:
        <input
          type="range"
          min="60"
          max="240"
          step="1"
          value={bpm}
          onChange={handleChangeBPM}
        />
        {bpm}
      </label>
      {!isPlaying ? (
        <button onClick={handleStart}>Start</button>
      ) : (
        <button onClick={handleStop}>Stop</button>
      )}
      <Sketch setup={setup} draw={draw} preload={preload} />
    </div>
  );
};

export default P5Sketch;
