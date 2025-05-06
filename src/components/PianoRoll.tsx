import React, { useRef, useEffect } from "react";
import Sketch from "react-p5";
import p5 from "p5";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import { pianoRollSetting, noteColors } from "../constants/settings";

type PianoRollProps = {
  midiDataRef: React.MutableRefObject<Midi | null>;
  isPlaying: boolean;
  startTime: number;  // 再生開始のタイムスタンプ（秒）
  bpm: number;
};

const PianoRoll: React.FC<PianoRollProps> = ({
  midiDataRef,
  isPlaying,
  startTime,
  bpm,
}) => {
  // → ループ開始時刻を内製で保持
  const loopStartRef = useRef(startTime);
  const drawnNotesRef = useRef<Set<string>>(new Set());

  // 親コンポーネントで startTime が変わったら同期
  useEffect(() => {
    loopStartRef.current = startTime;
    drawnNotesRef.current.clear();
  }, [startTime]);

  const setup = (p: p5, parent: Element) => {
    p.createCanvas(p.windowWidth, pianoRollSetting.height).parent(parent);
    p.rectMode(p.CENTER);
  };

  const draw = (p: p5) => {
    p.background(noteColors.background);

    if (!isPlaying || !midiDataRef.current) return;

    const frame = {
      x: 100,
      y: pianoRollSetting.yOffset,
      width: p.width - 200,
      height: pianoRollSetting.height,
    };

    // 秒→ピクセル換算
    const scrollSpeed = (bpm / 60) * pianoRollSetting.pixelsPerBeat;
    const now = Tone.now();
    // ループ開始からの経過時間
    const currentTime = now - loopStartRef.current;
    const scrollX = frame.x + currentTime * scrollSpeed;

    // 端に到達したらリセット
    if (scrollX > frame.x + frame.width) {
      loopStartRef.current = now;
      drawnNotesRef.current.clear();
      return;  // このフレームは描画せず、次フレームから新ループ開始
    }

    p.push();
    p.translate(0, pianoRollSetting.yOffset);

    midiDataRef.current.tracks.forEach((track, trackIndex) => {
      track.notes.forEach((note, noteIndex) => {
        const noteStart = note.time;
        if (noteStart > currentTime) return;

        const elapsed = currentTime - noteStart;
        const duration = Math.min(elapsed, note.duration);

        const x = frame.x + noteStart * scrollSpeed;
        const w = duration * scrollSpeed;
        if (x + w < frame.x) return;  // まだ左外ならスキップ

        const y = p.map(
          note.midi,
          pianoRollSetting.minMidi,
          pianoRollSetting.maxMidi,
          p.height,
          0
        );

        p.fill(noteColors.default);
        p.noStroke();
        p.rect(x, y, w, pianoRollSetting.noteHeight);
      });
    });

    p.pop();
  };

  // ウィンドウサイズ変更対応
  const windowResized = (p: p5) => {
    p.resizeCanvas(p.windowWidth, pianoRollSetting.height);
  };

  return (
    <Sketch
      setup={setup}
      draw={draw}
      windowResized={windowResized}
    />
  );
};

export default PianoRoll;

