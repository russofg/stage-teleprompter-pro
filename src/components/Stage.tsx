import { useState, useEffect } from 'react';
import { listen, emit } from '@tauri-apps/api/event';
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
    emit('stage:ready');

    const setupListener = async () => {
      const unlisten = await listen('dashboard:state', (event: any) => {
        console.log('Stage recibió estado del dashboard:', event.payload);
        setState(prev => ({ ...prev, ...event.payload,position: (Object.prototype.hasOwnProperty.call(event.payload || {}, 'position')
    ? event.payload.position
    : prev.position), }));
      });
      return unlisten;
    };

    setupListener();

    // Listener para eventos de control desde stage (atajos de teclado)
    const setupControlListener = async () => {
      const unlisten = await listen('teleprompter:control', (event: any) => {
        const { type, payload } = event.payload;
        console.log('Stage recibió evento de control:', type, payload);
        
        switch (type) {
          case 'togglePlay':
            setState((prev: PrompterState) => ({ ...prev, isPlaying: !prev.isPlaying }));
            break;
          case 'resetPosition':
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
      return unlisten;
    };

    setupControlListener();
  }, []);

  return <StageView {...state} isStageWindow={true} />;
}
