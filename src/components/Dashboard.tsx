import { useState, useCallback, useEffect, useRef } from 'react';
import { emit, listen } from '@tauri-apps/api/event';
import { WebviewWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/tauri';
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
  text: '¡Bienvenido a Teleprompter Pro de Escenario!\n\nCargá tu guion usando los controles de la izquierda.\n\nFormatos soportados:\n• Archivos .txt\n• Archivos .docx\n• URLs\n\nUsá la Pantalla de Escena para mostrar el teleprompter en otra pantalla.',
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
  const [stageReady, setStageReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const justResetRef = useRef(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Set up event listeners
  useEffect(() => {
    let unlistenStageReady: (() => void) | undefined;
    let unlistenControls: (() => void) | undefined;
    let unlistenDashboardClose: (() => void) | undefined;
    let unlistenStageClose: (() => void) | undefined;
    let stageWindow: any = null;
    let dashboardWindow: any = null;

    const setupEventListeners = async () => {
      // Listen for stage window ready
      unlistenStageReady = await listen('stage:ready', () => {
        setStageReady(true);
        emit('dashboard:state', state);
      });

      // Listen for control events from stage window
      unlistenControls = await listen('teleprompter:control', (event: any) => {
        const { type, payload } = event.payload;
        switch (type) {
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
              speed: Math.max(20, Math.min(200, prev.speed + payload))
            }));
            break;
        }
      });

      // Get dashboard and stage windows
      dashboardWindow = await WebviewWindow.getByLabel('main');
      stageWindow = await WebviewWindow.getByLabel('stage');

      // Handle dashboard close: cerrar completamente la app
      if (dashboardWindow) {
        unlistenDashboardClose = await dashboardWindow.onCloseRequested(async (_event: any) => {
          try {
            if (stageWindow) {
              await stageWindow.close(); // Cerrar completamente la ventana stage
            }
          } catch (error) {
            console.log("Stage window already closed");
          }
          // Cerrar completamente la app
          await invoke('quit_app');
        });
      }

      // Handle stage close: solo ocultar, no cerrar completamente
      if (stageWindow) {
        unlistenStageClose = await stageWindow.onCloseRequested(async (_event: any) => {
          await stageWindow.hide(); // Solo ocultar, mantener la ventana viva
        });
      }
    };

    setupEventListeners();
    return () => {
      if (unlistenStageReady) unlistenStageReady();
      if (unlistenControls) unlistenControls();
      if (unlistenDashboardClose) unlistenDashboardClose();
      if (unlistenStageClose) unlistenStageClose();
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

  // Emit state updates to stage window
  useEffect(() => {
  // Emitir siempre el estado completo, para que el Stage y la preview reciban el cambio de posición
  emit('dashboard:state', state);
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

  // Función auxiliar para detectar monitores extendidos
  const detectExtendedDisplay = () => {
    // En macOS, detectar monitores extendidos
    const primaryWidth = window.screen.width;
    const primaryHeight = window.screen.height;
    const availWidth = window.screen.availWidth;
    const availHeight = window.screen.availHeight;
    const availLeft = window.screen.availLeft;
    const availTop = window.screen.availTop;
    
    // Múltiples métodos de detección para ser más preciso
    const hasExtendedDisplay = 
      availLeft !== 0 || // Hay espacio a la izquierda (monitor extendido)
      availTop !== 0 ||  // Hay espacio arriba (monitor extendido)
      availWidth > primaryWidth || // El área total es mayor al monitor principal
      primaryWidth > 2560; // Monitor muy ancho (posiblemente multiple displays)
    
    // Calcular posición para monitor extendido
    let extendedX;
    if (hasExtendedDisplay) {
      // Si hay monitors extendidos, usar el ancho del monitor principal + pequeño offset
      extendedX = primaryWidth + 50;
    } else {
      // Fallback para monitor único
      extendedX = Math.max(primaryWidth - 1200, 100);
    }
    
    return {
      hasExtendedDisplay,
      primaryWidth,
      primaryHeight,
      availWidth,
      availLeft,
      availTop,
      extendedX
    };
  };

  const openStageWindow = useCallback(async () => {
    try {
      let stageWindow = await WebviewWindow.getByLabel('stage');
      
      if (!stageWindow) {
        // Crear la ventana stage si no existe
        stageWindow = new WebviewWindow('stage', {
          url: 'stage.html',
          width: 1200,
          height: 800,
          alwaysOnTop: false,
          resizable: true,
          visible: true,
          decorations: false,
          fullscreen: true,
        });
        
        // Esperar a que la ventana esté lista
        stageWindow.once('tauri://created', async () => {
          if (stageWindow) {
            try {
              // Detectar monitores extendidos y posicionar
              const displayInfo = detectExtendedDisplay();
              
              if (displayInfo.hasExtendedDisplay) {
                const { LogicalPosition } = await import('@tauri-apps/api/window');
                await stageWindow.setPosition(new LogicalPosition(displayInfo.extendedX, 0));
                console.log(`Stage window positioned at x=${displayInfo.extendedX} (extended display)`);
              }
              
              await stageWindow.setFocus();
            } catch (error) {
              console.error("Error positioning stage window:", error);
            }
          }
        });
      } else {
        // Mostrar la ventana existente
        await stageWindow.show();
        await stageWindow.setFocus();
      }
    } catch (error) {
      console.error("Failed to get or show stage window:", error);
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
                    stageReady ? "bg-green-500 animate-pulse" : "bg-slate-400"
                  )} />
                  <span className="text-sm font-medium text-slate-300">
                    Escena {stageReady ? 'Conectada' : 'Lista'}
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
              stageReady ? "bg-green-900/40 text-green-200" : "bg-slate-800 text-slate-300"
            )}>
              <Monitor className="w-4 h-4" />
        <span className="whitespace-nowrap">Escena {stageReady ? 'Conectada' : 'Lista'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
