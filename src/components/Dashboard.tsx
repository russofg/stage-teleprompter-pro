import { useState, useCallback, useEffect, useRef } from 'react';

// Electron API types
declare global {
  interface Window {
    electronAPI: {
      openStageWindow: () => Promise<{ success: boolean }>;
      closeStageWindow: () => Promise<{ success: boolean }>;
      quitApp: () => Promise<{ success: boolean }>;
      getDisplays: () => Promise<any[]>;
      openExternal: (url: string) => Promise<{ success: boolean }>;

    };
  }
}
import Controls from './Controls';
import StageView from './StageView';
import type { PrompterState } from '../types';
import { 
  Monitor, 
  FileText, 
  Play,
  Pause,
  RotateCcw,
  Clock,
  Settings,
  Activity,
  Zap,
  Type,
  Eye
} from 'lucide-react';
import { clsx } from 'clsx';

const INITIAL_STATE: PrompterState = {
  text: '¡Bienvenido a Teleprompter Pro de Escenario!\n\nCargá tu guion usando los controles de la izquierda.\n\nFormatos soportados:\n• Archivos .txt\n• Archivos .docx\n\nUsá la Pantalla de Escena para mostrar el teleprompter en otra pantalla.',
  fontSize: 32,
  color: '#e5e7eb', // texto claro para fondo oscuro
  bgColor: '#000000', // fondo oscuro por defecto
  speed: 60,
  isPlaying: false,
  isMirrored: false,
  lineHeight: 1.5,
  position: 0,
};

export default function Dashboard() {
  const [state, setState] = useState<PrompterState>(INITIAL_STATE);
  // Electron no necesita stageReady, se maneja desde el main process
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const justResetRef = useRef(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Set up event listeners for Electron
  useEffect(() => {
    // Escuchar eventos de localStorage desde StageView
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'teleprompterControl' && e.newValue) {
        try {
          const control = JSON.parse(e.newValue);
          switch (control.type) {
            case 'togglePlay':
              setState((prev: PrompterState) => ({ ...prev, isPlaying: !prev.isPlaying }));
              break;
            case 'resetPosition':
              justResetRef.current = true;
              setState((prev: PrompterState) => ({ ...prev, position: 0, isPlaying: false }));
              break;
            case 'adjustSpeed':
              setState((prev: PrompterState) => ({ 
                ...prev, 
                speed: Math.max(20, Math.min(200, prev.speed + (control.payload || 0)))
              }));
              break;
          }
        } catch (error) {
          console.error('Error parsing teleprompter control:', error);
        }
      }
    };

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // También escuchar cambios locales (misma ventana)
    const checkLocalStorage = () => {
      const control = localStorage.getItem('teleprompterControl');
      if (control) {
        try {
          handleStorageChange({ key: 'teleprompterControl', newValue: control } as StorageEvent);
          localStorage.removeItem('teleprompterControl'); // Limpiar después de procesar
        } catch (error) {
          console.error('Error parsing local teleprompter control:', error);
        }
      }
    };

    const interval = setInterval(checkLocalStorage, 100); // Verificar cada 100ms

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Global shortcuts (desktop-wide) - DISABLED temporarily to avoid build issues
  // useEffect(() => {
  //   let disposed = false;
  //   let doCleanup: null | (() => Promise<void>) = null;
  //   // Global shortcuts code commented out for now
  //   return () => {
  //     disposed = true;
  //     if (doCleanup) void doCleanup();
  //   };
  // }, []);

  // Electron no necesita emit, el estado se comparte a través de localStorage o context
  useEffect(() => {
    // Guardar estado en localStorage para que StageView pueda acceder
    localStorage.setItem('teleprompterState', JSON.stringify(state));
  }, [state]);

  const handleStateChange = useCallback((updates: Partial<PrompterState>) => {
    setState((prev: PrompterState) => ({ ...prev, ...updates }));
  }, []);

  const togglePlayPause = () => {
  setState(prev => ({ ...prev, isPlaying: !prev.isPlaying })); // Solo cambia isPlaying
  };

  const resetPosition = () => {
    setState(prev => ({ ...prev, position: -1, isPlaying: false }));
    setTimeout(() => {
      setState(prev => ({ ...prev, position: 0 }));
    }, 30);
  };

  // Electron maneja la detección de monitores desde el main process

  const openStageWindow = useCallback(async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API no disponible');
      }
      
      // Usar Electron API para abrir la ventana stage
      const result = await window.electronAPI.openStageWindow();
      if (result.success) {
        console.log('Stage window opened successfully');
      } else {
        throw new Error('No se pudo abrir la ventana de escenario');
      }
    } catch (error) {
      console.error('Error opening stage window:', error);
      
      // Mostrar error al usuario de forma amigable
      const message = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al abrir ventana de escenario: ${message}`);
    }
  }, []);

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black">
  {/* Modern design active */}
      
      {/* Modern Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                  {/* SVG Logo for Teleprompter Pro */}
                  <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="8" width="32" height="24" rx="6" fill="#6366F1"/>
                    <rect x="8" y="12" width="24" height="16" rx="3" fill="#1E293B"/>
                    <polygon points="18,16 26,20 18,24" fill="#22D3EE"/>
                    <rect x="12" y="30" width="16" height="2.5" rx="1.25" fill="#22D3EE" opacity="0.7"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    Teleprompter Pro de Escenario
                  </h1>
                  <p className="text-sm text-slate-400 font-medium">Control profesional para presentaciones</p>
                </div>
              </div>
              
              {/* Quick Action Buttons */}
              <div className="flex items-center space-x-2 bg-slate-800/70 rounded-xl p-1">
                <button
                  onClick={togglePlayPause}
                  className={clsx(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105",
                    state.isPlaying
                      ? "bg-red-500 text-white shadow-lg hover:bg-red-600"
                      : "bg-emerald-500 text-white shadow-lg hover:bg-emerald-600"
                  )}
                  aria-label={state.isPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {state.isPlaying ? (
                    <><Pause className="w-4 h-4" /><span className="hidden sm:inline">Pausar</span></>
                  ) : (
                    <><Play className="w-4 h-4" /><span className="hidden sm:inline">Reproducir</span></>
                  )}
                </button>
                <button
                  onClick={resetPosition}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-sm bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all transform hover:scale-105"
                  aria-label="Reiniciar"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Reiniciar</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-8">
              {/* Status Indicators */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono hidden sm:inline">{currentTime}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={clsx(
                    "w-3 h-3 rounded-full transition-colors",
                    "bg-slate-400"
                  )} />
                  <span className="text-sm font-medium text-slate-300">
                    Escena Lista
                  </span>
                </div>
              </div>

              {/* Open Stage Button */}
              <button
                onClick={openStageWindow}
                className="flex items-center space-x-2 px-4 md:px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg whitespace-nowrap"
              >
                <Monitor className="w-5 h-5" />
                <span className="hidden sm:inline">Abrir Escena</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-4 md:gap-6 lg:gap-8">
          {/* Controls Sidebar */}
          <div className="col-span-12 lg:col-span-3 min-w-0">
            <div className="bg-slate-900/80 backdrop-blur-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-bold text-slate-100 text-lg">Controles</h2>
                </div>
              </div>
              <div className="p-6">
                <Controls
                  state={state}
                  onStateChange={handleStateChange}
                  onOpenStage={openStageWindow}
                />
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="col-span-12 lg:col-span-4 min-w-0">
            <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-900/60 to-emerald-800/60 border-b border-slate-800 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-bold text-slate-100 text-lg">Vista previa</h2>
                  </div>
                  <div className="flex items-center space-x-2 text-xs bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 text-slate-200">
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      state.isPlaying ? "bg-green-500 animate-pulse" : "bg-slate-400"
                    )} />
                    <span className="font-semibold">
                      {state.isPlaying ? 'EN VIVO' : 'LISTO'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="bg-black/90 rounded-2xl overflow-hidden shadow-xl border border-slate-800/80 h-52 sm:h-72 md:h-96 flex items-center justify-center">
                  <StageView {...state} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-6 mt-8">
                  <div className="bg-gradient-to-br from-indigo-900/60 to-indigo-800/60 rounded-xl p-2 text-center border border-indigo-700/60 shadow-md">
                    <div className="text-xs text-indigo-200 font-semibold mb-0.5 uppercase tracking-wide">Caracteres</div>
                    <div className="text-base font-bold text-indigo-100">{state.text.length.toLocaleString()}</div>
                  </div>
                  <div className="bg-gradient-to-br from-violet-900/60 to-violet-800/60 rounded-xl p-2 text-center border border-violet-700/60 shadow-md">
                    <div className="text-xs text-violet-200 font-semibold mb-0.5 uppercase tracking-wide">Palabras</div>
                    <div className="text-base font-bold text-violet-100">
                      {state.text.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Script Editor */}
          <div className="col-span-12 lg:col-span-5 min-w-0">
            <div className="bg-slate-900/80 backdrop-blur-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-violet-900/60 to-indigo-900/60 border-b border-slate-800 px-8 py-6">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-violet-300" />
                  <h2 className="font-bold text-slate-100 text-lg">Editor de Guion</h2>
                </div>
              </div>
              <div className="p-8">
                <textarea
                  value={state.text}
                  onChange={(e) => handleStateChange({ text: e.target.value })}
                  className="w-full h-80 md:h-96 p-6 border-2 border-violet-800 rounded-2xl resize-none focus:ring-4 focus:ring-violet-500/30 focus:border-violet-500 text-base leading-relaxed font-mono transition-all bg-slate-950 text-slate-100 placeholder-slate-500 shadow-lg"
                  placeholder="Escribe tu guion aquí o carga un archivo..."
                />
                
                {/* Editor Status Bar */}
                <div className="mt-6 flex items-center justify-between text-base text-slate-300 pt-6 border-t border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      <span>Posición: {state.position || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      <span>Velocidad: {state.speed} px/s</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Type className="w-4 h-4" />
                      <span>Fuente: {state.fontSize}px</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {state.isPlaying && (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 font-semibold">Grabando</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Bottom Status */}
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 px-4 md:px-8 py-3 md:py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
        <div className="bg-blue-900/40 text-blue-200 px-3 py-1 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap">
                Velocidad: {state.speed} px/s
              </div>
        <div className="bg-emerald-900/40 text-emerald-200 px-3 py-1 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap">
                Fuente: {state.fontSize}px
              </div>
        <div className="bg-violet-900/40 text-violet-200 px-3 py-1 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap">
                Interlineado: {state.lineHeight}
              </div>
            </div>
          </div>
      <div className="flex items-center space-x-2 md:space-x-4 text-xs md:text-sm text-slate-300">
            <div className={clsx(
              "flex items-center space-x-2 px-3 py-1 rounded-full font-medium",
              "bg-slate-800 text-slate-300"
            )}>
              <Monitor className="w-4 h-4" />
        <span className="whitespace-nowrap">Escena Lista</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
