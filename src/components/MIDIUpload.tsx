// src/components/MIDIUpload.tsx
import React, { useEffect } from "react";
import { Midi } from "@tonejs/midi";
import { openDB } from "idb";

// IndexedDB設定
const DB_NAME = "midiDB";
const STORE_NAME = "midiFiles";
const KEY = "userMidi";

// 保存関数
export const saveToIndexedDB = async (buffer: ArrayBuffer) => {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
  await db.put(STORE_NAME, buffer, KEY);
};

// 読み込み関数
export const loadFromIndexedDB = async (): Promise<ArrayBuffer | null> => {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
  return (await db.get(STORE_NAME, KEY)) ?? null;
};

// アップロードコンポーネント
const MIDIUpload: React.FC = () => {
  // アップロード時処理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    await saveToIndexedDB(arrayBuffer);

    const parsedMidi = new Midi(arrayBuffer); // パースして構造確認（任意）
    console.log("🎹 アップロードされたMIDIの構造:", parsedMidi);
  };

  // 初回マウント時に保存済みMIDIの存在をチェック
  useEffect(() => {
    const checkSavedMidi = async () => {
      const buffer = await loadFromIndexedDB();
      if (buffer) {
        const parsed = new Midi(buffer);
        console.log("📦 保存済みMIDIを読み込みました:", parsed);
      } else {
        console.log("ℹ️ 保存済みMIDIは見つかりませんでした");
      }
    };
    checkSavedMidi();
  }, []);

  return (
    <div style={{ marginBottom: "20px" }}>
      <label htmlFor="midi-upload">🎵 MIDIファイルをアップロード：</label>
      <input
        id="midi-upload"
        type="file"
        accept=".mid"
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default MIDIUpload;
