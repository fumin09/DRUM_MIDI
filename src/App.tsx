// src/App.tsx
import React from "react";
import P5Sketch from "./components/P5Sketch";
import MIDIUpload from "./components/MIDIUpload";


const App: React.FC = () => {
  return (
    <div>
      <h1>MIDI Visualizer 🎵</h1>
      <MIDIUpload /> {/* ← ここで使えばOK */}
      <P5Sketch />

    </div>
  );
};


export default App;
