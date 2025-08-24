import React, { useCallback } from 'react';
import { Upload, Play, Monitor, FileText, Settings2, Zap } from 'lucide-react';
import type { PrompterState, FileData } from '../types';
import { loadFile } from '../lib/fileLoaders';
import { clsx } from 'clsx';

interface ControlsProps {
  state: PrompterState;
  onStateChange: (updates: Partial<PrompterState>) => void;
  onOpenStage: () => void;
}

export default function Controls({ state, onStateChange, onOpenStage }: ControlsProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileData: FileData = await loadFile(file);
      onStateChange({ text: fileData.content });
      
      // Limpiar el input para permitir recargar el mismo archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error loading file:', error);
      
      // Mostrar error más amigable
      const message = error instanceof Error ? error.message : 'Error desconocido al cargar el archivo';
      alert(`Error al cargar archivo: ${message}`);
      
      // Limpiar el input en caso de error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setLoading(false);
    }
  }, [onStateChange]);

  // Función de carga por URL removida - muy complicada de implementar

  const resetPosition = () => {
  onStateChange({ position: -1, isPlaying: false });
  setTimeout(() => {
    onStateChange({ position: 0 });
  }, 30);
  };

  return (
    <div className="space-y-6">
      {/* File Loading Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-3 md:mb-4">
          <FileText className="w-4 h-4 text-blue-500" />
          <h3 className="text-xs sm:text-sm font-semibold text-slate-200">Cargar contenido</h3>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 shadow-lg whitespace-nowrap"
        >
          <Upload className="w-4 h-4" />
          <span className="">Subir archivo</span>
          <span className="hidden sm:inline">(.txt, .docx)</span>
        </button>


      </div>

      {/* Playback Controls */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-3 md:mb-4">
          <Play className="w-4 h-4 text-green-500" />
          <h3 className="text-xs sm:text-sm font-semibold text-slate-200">Reproducción</h3>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onStateChange({ isPlaying: !state.isPlaying })}
            className={clsx(
              "w-full px-5 py-3 text-[15px] rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg",
              state.isPlaying 
        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white' 
        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
            )}
          >
            <span className="inline sm:hidden">{state.isPlaying ? 'Pausar' : 'Iniciar'}</span>
            <span className="hidden sm:inline">{state.isPlaying ? 'Pausar' : 'Iniciar'}</span>
          </button>
          <button
            onClick={resetPosition}
            className="w-full px-5 py-3 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white text-[15px] rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
          >
            <span className="">Reiniciar</span>
          </button>
        </div>

  <div className="space-y-3 bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">
              Velocidad: {state.speed} px/s
            </label>
          </div>
          <input
            type="range"
            min="20"
            max="200"
            value={state.speed}
            onChange={(e) => onStateChange({ speed: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-orange-500/20"
          />
          <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 font-medium">
            <span>20</span>
            <span>110</span>
            <span>200</span>
          </div>
        </div>
      </div>

      {/* Display Configuration (collapsible to reduce scroll) */}
      <div className="space-y-2">
  <details className="group bg-slate-900/70 rounded-xl border border-slate-800">
          <summary className="list-none cursor-pointer select-none flex items-center justify-between px-3 sm:px-4 py-3 md:py-4">
            <div className="flex items-center space-x-2">
              <Settings2 className="w-4 h-4 text-purple-500" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">Pantalla</span>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium group-open:hidden">Mostrar</span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium hidden group-open:inline">Ocultar</span>
          </summary>

          <div className="space-y-4 p-3 sm:p-4 pt-0 sm:pt-0">
          <div className="bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-800">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-3">
              <span>Tamaño de fuente: {state.fontSize}px</span>
            </label>
            <input
              type="range"
              min="24"
              max="72"
              value={state.fontSize}
              onChange={(e) => onStateChange({ fontSize: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-800">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-3">
              <span>Interlineado: {state.lineHeight}</span>
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={state.lineHeight}
              onChange={(e) => onStateChange({ lineHeight: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-slate-900/60 p-2 sm:p-3 rounded-xl border border-slate-800">
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-2">Color de texto</label>
              <input
                type="color"
                value={state.color}
                onChange={(e) => onStateChange({ color: e.target.value })}
                className="w-full h-8 rounded-lg border-2 border-slate-800 cursor-pointer bg-slate-900"
              />
            </div>
            <div className="bg-slate-900/60 p-2 sm:p-3 rounded-xl border border-slate-800">
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-2">Fondo</label>
              <input
                type="color"
                value={state.bgColor}
                onChange={(e) => onStateChange({ bgColor: e.target.value })}
                className="w-full h-8 rounded-lg border-2 border-slate-800 cursor-pointer bg-slate-900"
              />
            </div>
          </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl border border-indigo-800/60">
            <span className="text-xs font-semibold text-slate-300">Espejar texto</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={state.isMirrored}
                onChange={(e) => onStateChange({ isMirrored: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          </div>
        </details>
      </div>

      {/* Stage Display */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-3 md:mb-4">
          <Monitor className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs sm:text-sm font-semibold text-slate-200">Pantalla de escena</h3>
        </div>
        
        <button
          onClick={onOpenStage}
          className="w-full px-3 sm:px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg whitespace-nowrap"
        >
          <Monitor className="w-5 h-5" />
          <span className="hidden xs:inline sm:inline">Abrir pantalla de escena</span>
        </button>
        
        {loading && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-blue-600 text-sm font-semibold">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Cargando...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
