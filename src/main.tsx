import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import StageView from "./components/StageView";
import "./index.css";

// Router simple para Electron
const isStageWindow = window.location.hash === '#/stage';

// Estado inicial para la vista de escenario
const initialState = {
  text: 'Cargando guion...',
  fontSize: 48,
  color: '#ffffff',
  bgColor: '#000000',
  speed: 60,
  isPlaying: false,
  lineHeight: 1.5,
  position: 0,
  isMirrored: false // Agregado para consistencia
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isStageWindow ? (
      <div className="h-screen w-screen bg-black">
        <StageView
          {...initialState}
          isStageWindow={true}
        />
      </div>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
