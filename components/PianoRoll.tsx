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

// 加速用イージング関数
const easeInQuad = (t: number) => t * t;

const PianoRoll: React.FC<PianoRollProps> = ({
  midiDataRef,
  isPlaying,
  startTime,
  bpm,
}) => {
  const loopStartRef = useRef<number>(startTime);

  useEffect(() => {
    loopStartRef.current = startTime;
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

    const now = Tone.now();
    const elapsedLoop = now - loopStartRef.current;
    const scrollSpeed = (bpm / 60) * pianoRollSetting.pixelsPerBeat;
    const loopDuration = frame.width / scrollSpeed;
    const scrollX = frame.x + elapsedLoop * scrollSpeed;

    // 端到達でリセット
    if (elapsedLoop >= loopDuration) {
      loopStartRef.current = now;
      return;
    }

    p.push();
    p.translate(0, pianoRollSetting.yOffset);

    // ノート描画
    midiDataRef.current.tracks.forEach((track, trackIndex) => {
      track.notes.forEach((note, noteIndex) => {
        const noteStart = note.time;
        if (noteStart > elapsedLoop) return;

        const noteElapsed = elapsedLoop - noteStart;
        const fullWidth = note.duration * scrollSpeed;

        // 溜めてから加速伸長
        const stretchTime = 0.15;
        const chargeTime = Math.max(note.duration - stretchTime, 0);
        let w = 0;
        if (noteElapsed < chargeTime) {
          w = 1; // 溜め中の最小幅
        } else {
          const t2 = Math.min(noteElapsed - chargeTime, stretchTime) / stretchTime;
          const ratio = easeInQuad(t2);
          w = fullWidth * ratio;
        }

        const x = frame.x + noteStart * scrollSpeed;
        if (x > frame.x + frame.width || x + w < frame.x) return;

        const y = p.map(
          note.midi,
          pianoRollSetting.minMidi,
          pianoRollSetting.maxMidi,
          p.height,
          0
        );

        const cx = x + w / 2;
        p.fill(noteColors.default);
        p.noStroke();
        p.rect(cx, y, w, pianoRollSetting.noteHeight);
      });
    });

    // ワイプアニメーション: ループ終了直前に右から左へ背景をかぶせる
    const wipeDuration = 0.3;
    const timeLeft = loopDuration - elapsedLoop;
    if (timeLeft < wipeDuration) {
      const wipeRatio = (wipeDuration - timeLeft) / wipeDuration;
      const wipeX = frame.x + frame.width * (1 - wipeRatio);
      p.noStroke();
      p.fill(noteColors.background);
      p.rectMode(p.CORNER);
      p.rect(wipeX, 0, frame.width - (wipeX - frame.x), frame.height);
      p.rectMode(p.CENTER); // 元に戻す
    }

    p.pop();
  };

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
