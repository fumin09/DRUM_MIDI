// src/components/ControlPanel.tsx
import React, { useEffect, useRef } from "react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import {
  progress,
  effects,
  staticShapes,
} from "../constants/settings";

// ★ P5Sketch から移動してきた再生制御を扱うコンポーネント

const parts: Tone.Part[] = []; // ★ ControlPanel内にローカルで管理

type Props = {
  isPlaying: boolean;
  bpm: number;
  midiDataRef: React.MutableRefObject<Midi | null>;
  onChangeBPM: (value: number) => void;
  onPlaybackStateChange: (playing: boolean) => void;
  onStartTimeSet: (time: number) => void; // 🆕 これを追加
};

const ControlPanel: React.FC<Props> = ({
  isPlaying,
  bpm,
  midiDataRef,
  onChangeBPM,
  onPlaybackStateChange,
  onStartTimeSet, // ← ✅ 追加
}) => {
  // useRefでSamplerを保持
  const samplerRef = useRef<Tone.Sampler | null>(null);
  
  useEffect(() => {
    const transport = Tone.getTransport();
    transport.bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    const sampler = new Tone.Sampler({
      urls: {
        C1: "kick.wav",
        D1: "snare.wav",
        E1: "hihat.wav",
      },
      baseUrl: "/drums/",
      onload: () => {
        console.log("✅ Sampler loaded");
        samplerRef.current = sampler;
      },
    }).toDestination();
  }, []);

  /** Start ボタン */
  const handleStart = async () => {
    if (!midiDataRef.current || !samplerRef.current) return;

    await Tone.start();
    const transport = Tone.getTransport();
    transport.bpm.value = bpm; // ← ここで同期させる！
    transport.stop();
    transport.setLoopPoints(0, 0);
    transport.start();

    const drumSampler = samplerRef.current;
    if (!drumSampler) return;

    parts.forEach((p) => p.dispose());
    parts.length = 0; // 明示的に空にする

    midiDataRef.current.tracks.forEach((track, index) => {
      console.log(`🎵 Track ${index} - ノート数: ${track.notes.length}`);

      

      

      const part = new Tone.Part(
        (time, note) => {
          console.log("🎹 再生中のMIDIノート:", note.midi);
          
          switch (note.midi) {
            case 36:
              drumSampler.triggerAttack("C1", time);
              break;
            case 38:
              drumSampler.triggerAttack("D1", time);
              break;
            case 42:
              drumSampler.triggerAttack("E1", time);
              break;
            default:
              console.warn("⚠ 想定外のMIDIノート:", note.midi);
          }
        },
        track.notes.map((note) => ({
          time: note.time,
          midi: note.midi,
        }))
      );

      part.loop = false;
      parts.push(part);
    });
    

    parts.forEach((part) => part.start(0));
    
    onStartTimeSet(Tone.now()); // ← 秒単位で渡す（ms に変換しないこと！）
    onPlaybackStateChange(true);
    progress.lastBeatTimeMs = 0;
  };

  

  /** Stop ボタン */
  const handleStop = () => {
    parts.forEach((part) => part.stop(0));
    onPlaybackStateChange(false);
    progress.measureCount = 0;
    progress.beatCount = 0;
    progress.lastBeatTimeMs = 0;
    effects.splice(0, effects.length);
    staticShapes.splice(0, staticShapes.length);
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <label>
        Visual BPM:
        <input
          type="range"
          min="60"
          max="240"
          step="1"
          value={bpm}
          onChange={(e) => onChangeBPM(Number(e.target.value))}
        />
        {bpm}
      </label>
      <div>
        {!isPlaying ? (
          <button onClick={handleStart}>Start</button>
        ) : (
          <button onClick={handleStop}>Stop</button>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
