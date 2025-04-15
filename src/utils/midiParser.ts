// src/utils/midiParser.ts
import { Midi } from "@tonejs/midi";
import { musicSetting, beatType, midi } from "../constants/settings";

/**
 * ArrayBuffer の MIDI ファイルを解析し、drumMap に結果を登録する
 */
export const parseMidiFile = async (arrayBuffer: ArrayBuffer): Promise<Midi> => {
  const midiData = new Midi(arrayBuffer);

  // 各トラックのノートを time 昇順にソート
  midiData.tracks.forEach((track) => {
    track.notes.sort((a, b) => a.time - b.time);
  });

  // 最初のトラックのノートを用いて drumMap を構築
  midiData.tracks[0]?.notes.forEach((note) => {
    // 例として、1小節を musicSetting.beatCount 拍とするための計算
    const beatTick = 480 * (4 / musicSetting.beatCount);
    const totalBeatCount = Math.floor(note.ticks / beatTick);
    const measureCount = Math.floor(totalBeatCount / musicSetting.beatCount) + 1;
    const beatCount = (totalBeatCount % musicSetting.beatCount) + 1;

    if (!midi.drumMap.has(measureCount)) {
      midi.drumMap.set(measureCount, new Map());
    }
    const measureMap = midi.drumMap.get(measureCount)!;

    // MIDI ノート番号に応じたドラム種別の登録
    switch (note.midi) {
      case musicSetting.drumCymbalMidiID:
        measureMap.set(beatCount, beatType.Cymbal);
        break;
      case musicSetting.drumSnareMidiID:
        if (measureMap.get(beatCount) !== beatType.Cymbal) {
          measureMap.set(beatCount, beatType.Snare);
        }
        break;
      case musicSetting.drumKickMidiID:
        if (
          measureMap.get(beatCount) !== beatType.Cymbal &&
          measureMap.get(beatCount) !== beatType.Snare
        ) {
          measureMap.set(beatCount, beatType.Kick);
        }
        break;
    }
  });

  return midiData;
};
