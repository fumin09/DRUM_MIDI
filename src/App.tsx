// src/App.tsx
import React from "react";
import P5Sketch from "./components/P5Sketch";

const App: React.FC = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* 上部：メインコンテンツ */}
      <main style={{ flex: 1, padding: "20px" }}>
        <h1>Welcome to the Drum Visualizer</h1>
        <p>ここにメインのコンテンツを置くことができます。</p>
      </main>

      {/* 下部：DRUM用のp5スケッチ */}
      <footer
        style={{
          backgroundColor: "#222",         // ✅ 背景色を明示
          padding: "10px 0",
          color: "#fff",                   // 任意で文字色を調整
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <P5Sketch height={300} backgroundColor="#111" />
        </div>
      </footer>
    </div>
  );
};

export default App;
