import { useState, useCallback, useEffect } from 'react';
import { emit, listen } from '@tauri-apps/api/event';
import { WebviewWindow } from '@tauri-apps/api/window';
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
  text: 'Welcome to Stage Teleprompter Pro!\n\nLoad your script using the controls on the left.\n\nSupported formats:\n• .txt files\n• .docx files\n• URLs\n\nUse the Stage View to display your teleprompter on a separate screen.',
  fontSize: 32,
  color: '#1f2937',
  bgColor: '#ffffff',
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

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Set up event listeners
  useEffect(() => {
    const setupEventListeners = async () => {
      // Listen for stage window ready
      const unlistenStageReady = await listen('stage:ready', () => {
        console.log('Stage window ready');
        setStageReady(true);
      });

      // Listen for control events from stage window
      const unlistenControls = await listen('teleprompter:control', (event: any) => {
        const { type } = event.payload;
        switch (type) {
          case 'togglePlay':
            setState((prev: PrompterState) => ({ ...prev, isPlaying: !prev.isPlaying }));
            break;
          case 'resetPosition':
            setState((prev: PrompterState) => ({ ...prev, position: 0, isPlaying: false }));
            break;
        }
      });

      return () => {
        unlistenStageReady();
        unlistenControls();
      };
    };

    setupEventListeners();

    // Also listen for web-based messages from stage windows
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      switch (event.data?.type) {
        case 'togglePlay':
          setState((prev: PrompterState) => ({ ...prev, isPlaying: !prev.isPlaying }));
          break;
        case 'resetPosition':
          setState((prev: PrompterState) => ({ ...prev, position: 0, isPlaying: false }));
          break;
        case 'adjustSpeed':
          const adjustment = event.data.payload || 0;
          setState((prev: PrompterState) => ({ 
            ...prev, 
            speed: Math.max(20, Math.min(200, prev.speed + adjustment))
          }));
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Emit state updates to stage window
  useEffect(() => {
    const isTauri = typeof (window as any).__TAURI__ !== 'undefined';
    
    if (isTauri) {
      // Tauri mode
      if (stageReady) {
        emit('dashboard:state', state);
      }
    } else {
      // Web mode - use localStorage and postMessage
      try {
        localStorage.setItem('teleprompter-state', JSON.stringify(state));
        
        // Also send via postMessage to any open stage windows
        const message = {
          type: 'dashboard:state',
          payload: state
        };
        
        // Send to all open windows
        if (typeof window !== 'undefined') {
          // Try to find and message stage windows
          try {
            window.postMessage(message, window.location.origin);
          } catch (error) {
            console.log('Could not send postMessage:', error);
          }
        }
      } catch (error) {
        console.error('Error saving state:', error);
      }
    }
  }, [state, stageReady]);

  const handleStateChange = useCallback((updates: Partial<PrompterState>) => {
    setState((prev: PrompterState) => ({ ...prev, ...updates }));
  }, []);

  const togglePlayPause = () => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const resetPosition = () => {
    setState(prev => ({ ...prev, position: 0, isPlaying: false }));
  };

  const openStageWindow = useCallback(async () => {
    try {
      console.log('Attempting to open stage window...');
      
      // Multiple ways to detect Tauri
      const hasTauriGlobal = '__TAURI__' in window;
      const hasTauriInvoke = 'invokeHandlers' in window || '__TAURI_INVOKE__' in window;
      const isLocalhost = window.location.hostname === 'localhost';
      const isTauriPort = window.location.port === '1420';
      const isTauriProtocol = window.location.protocol === 'tauri:';
      
      // Force Tauri mode for development server
      const isDevelopmentTauri = isLocalhost && isTauriPort;
      const isInTauri = hasTauriGlobal || hasTauriInvoke || isTauriProtocol || isDevelopmentTauri;
      
      if (isInTauri) {
        // Tauri mode - try creating WebviewWindow
        console.log('Tauri mode confirmed, creating WebviewWindow');
        try {
          // Check if there's already a stage window
          const existingWindows = await WebviewWindow.getByLabel('stage-window');
          if (existingWindows) {
            console.log('Stage window already exists, focusing it');
            await existingWindows.setFocus();
            emit('dashboard:state', state);
            return;
          }

          const webview = new WebviewWindow('stage-window', {
            url: '/stage/',
            title: 'Stage Teleprompter Pro - Stage View',
            width: 1200,
            height: 800,
            resizable: true,
            minimizable: true,
            maximizable: true,
            closable: true,
            center: true,
          });

          // Listen for window events
          webview.once('tauri://created', function () {
            console.log('Tauri stage window created successfully!');
            setTimeout(() => {
              emit('dashboard:state', state);
              console.log('State sent to new Tauri window');
            }, 1000);
          });

          webview.once('tauri://error', function (e) {
            console.error('Error creating Tauri stage window:', e);
            alert('Error al crear la ventana Stage en Tauri: ' + JSON.stringify(e));
          });

          console.log('WebviewWindow creation initiated');
          return;
        } catch (tauriError) {
          console.error('Failed to create Tauri window:', tauriError);
          console.log('Falling back to web method...');
          // Fall through to web method
        }
      }
      
      // Web mode or Tauri detection failed - use window.open
      console.log('Using web mode fallback method');
      const stageUrl = `${window.location.origin}/?view=stage`;
      console.log('Opening URL:', stageUrl);
      
      const popup = window.open(
        stageUrl, 
        'stage-window', 
        'width=1200,height=800,resizable=yes,scrollbars=no,status=no,location=no,toolbar=no,menubar=no'
      );

      if (popup) {
        console.log('Stage window opened successfully, focusing...');
        popup.focus();
        
        // Send state via multiple methods
        setTimeout(() => {
          console.log('Sending state to stage window...');
          try {
            popup.postMessage({
              type: 'dashboard:state',
              payload: state
            }, window.location.origin);
            console.log('PostMessage sent successfully');
          } catch (error) {
            console.log('PostMessage failed:', error);
          }
        }, 1500);
        
        console.log('Stage window setup completed');
        return;
      } else {
        console.error('Failed to open popup - likely blocked');
        
        // Try direct navigation as last resort
        const directUrl = `${window.location.origin}/?view=stage`;
        console.log('Trying direct navigation to:', directUrl);
        window.location.href = directUrl;
      }

    } catch (error) {
      console.error('Failed to open stage window:', error);
      alert('Error crítico al abrir la ventana Stage: ' + error);
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Modern Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">T</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Stage Teleprompter Pro
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">Professional presentation control</p>
                </div>
              </div>
              
              {/* Quick Action Buttons */}
              <div className="flex items-center space-x-2 bg-slate-100/80 rounded-xl p-1">
                <button
                  onClick={togglePlayPause}
                  className={clsx(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105",
                    state.isPlaying
                      ? "bg-red-500 text-white shadow-lg hover:bg-red-600"
                      : "bg-green-500 text-white shadow-lg hover:bg-green-600"
                  )}
                >
                  {state.isPlaying ? (
                    <><Pause className="w-4 h-4" /><span>Pause</span></>
                  ) : (
                    <><Play className="w-4 h-4" /><span>Play</span></>
                  )}
                </button>
                <button
                  onClick={resetPosition}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all transform hover:scale-105"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-8">
              {/* Status Indicators */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-sm font-medium text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{currentTime}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={clsx(
                    "w-3 h-3 rounded-full transition-colors",
                    stageReady ? "bg-green-500 animate-pulse" : "bg-slate-400"
                  )} />
                  <span className="text-sm font-medium text-slate-600">
                    Stage {stageReady ? 'Connected' : 'Ready'}
                  </span>
                </div>
              </div>

              {/* Open Stage Button */}
              <button
                onClick={openStageWindow}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
              >
                <Monitor className="w-5 h-5" />
                <span>Open Stage</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-8">
          {/* Controls Sidebar */}
          <div className="col-span-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/60 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-blue-500" />
                  <h2 className="font-bold text-slate-800 text-lg">Controls</h2>
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
          <div className="col-span-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200/60 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-green-500" />
                    <h2 className="font-bold text-slate-800 text-lg">Live Preview</h2>
                  </div>
                  <div className="flex items-center space-x-2 text-xs bg-white/70 px-3 py-1 rounded-full border">
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      state.isPlaying ? "bg-green-500 animate-pulse" : "bg-slate-400"
                    )} />
                    <span className="font-semibold text-slate-700">
                      {state.isPlaying ? 'LIVE' : 'READY'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner border-2 border-slate-200" style={{ height: '280px' }}>
                  <StageView {...state} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200/60">
                    <div className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wide">Characters</div>
                    <div className="text-2xl font-bold text-blue-800">{state.text.length.toLocaleString()}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200/60">
                    <div className="text-xs text-purple-600 font-medium mb-1 uppercase tracking-wide">Words</div>
                    <div className="text-2xl font-bold text-purple-800">
                      {state.text.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Script Editor */}
          <div className="col-span-5">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-slate-200/60 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-purple-500" />
                  <h2 className="font-bold text-slate-800 text-lg">Script Editor</h2>
                </div>
              </div>
              <div className="p-6">
                <textarea
                  value={state.text}
                  onChange={(e) => handleStateChange({ text: e.target.value })}
                  className="w-full h-80 p-4 border-2 border-slate-200 rounded-xl resize-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 text-sm leading-relaxed font-mono transition-all bg-slate-50/50"
                  placeholder="Enter your teleprompter script here or load a file..."
                />
                
                {/* Editor Status Bar */}
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      <span>Position: {state.position || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      <span>Speed: {state.speed} px/s</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Type className="w-4 h-4" />
                      <span>Font: {state.fontSize}px</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {state.isPlaying && (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-600 font-semibold">Recording</span>
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
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/60 px-8 py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                Speed: {state.speed} px/s
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                Font: {state.fontSize}px
              </div>
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                Line: {state.lineHeight}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <div className={clsx(
              "flex items-center space-x-2 px-3 py-1 rounded-full font-medium",
              stageReady ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
            )}>
              <Monitor className="w-4 h-4" />
              <span>Stage {stageReady ? 'Connected' : 'Ready'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
