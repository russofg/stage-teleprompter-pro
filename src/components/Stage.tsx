import { useState, useEffect } from 'react';
// Electron no necesita listen/emit, usa localStorage para comunicación
import StageView from './StageView';
import type { PrompterState } from '../types';

const INITIAL_STATE: PrompterState = {
  text: 'Esperando conexión con el panel...',
  fontSize: 48,
  color: '#e5e7eb',
  bgColor: '#000000',
  speed: 60,
  isPlaying: false,
  isMirrored: false,
  lineHeight: 1.4,
  position: 0,
};

export default function Stage() {
  const [state, setState] = useState<PrompterState>(INITIAL_STATE);

  useEffect(() => {
    // Avisar al dashboard que la ventana stage está lista
    // Electron no necesita emit, usa localStorage

    // Electron: escuchar cambios en localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'teleprompterState' && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          setState(prev => ({ 
            ...prev, 
            ...newState,
            position: (Object.prototype.hasOwnProperty.call(newState || {}, 'position')
              ? newState.position
              : prev.position)
          }));
        } catch (error) {
          console.error('Error parsing teleprompter state:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También verificar cambios locales
    const checkLocalStorage = () => {
      try {
        const saved = localStorage.getItem('teleprompterState');
        if (saved) {
          const parsed = JSON.parse(saved);
          setState(prev => ({ 
            ...prev, 
            ...parsed,
            position: (Object.prototype.hasOwnProperty.call(parsed || {}, 'position')
              ? parsed.position
              : prev.position)
          }));
        }
      } catch (error) {
        console.error('Error checking teleprompter state:', error);
      }
    };

    const interval = setInterval(checkLocalStorage, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return <StageView {...state} isStageWindow={true} />;
}
