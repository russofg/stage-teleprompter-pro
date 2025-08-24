
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { emit } from '@tauri-apps/api/event';

export interface StageViewProps {
  text: string;
  fontSize: number;
  color: string;
  bgColor: string;
  speed: number;
  isPlaying: boolean;
  isMirrored: boolean;
  lineHeight: number;
  position?: number;
  isStageWindow?: boolean;
}

export interface StageViewHandle {
  scrollToTop: () => void;
}

const StageView = forwardRef<StageViewHandle, StageViewProps>(function StageView({
  text,
  fontSize,
  color,
  bgColor,
  speed,
  isPlaying,
  isMirrored,
  lineHeight,
  position = 0,
  isStageWindow = false
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof position !== 'number') return;
    if (position === 0) {
      el.scrollTop = 0;
    } else if (Math.abs(el.scrollTop - position) > 1) {
      el.scrollTop = position;
    }
  }, [position]);

  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }
  }), []);

  useEffect(() => {
    let frameId: number | undefined;
    let lastTime = performance.now();
    let scrollAccumulator = 0;
    function animate(currentTime: number) {
      if (!isPlaying) return;
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      if (containerRef.current && textRef.current) {
        // Sumar margen extra para asegurar que se vean las últimas líneas
        const extraMargin = 200; // px, aumentado para asegurar visibilidad
        const maxScroll = textRef.current.scrollHeight - containerRef.current.clientHeight + extraMargin;
        scrollAccumulator += speed * deltaTime;
        let next = containerRef.current.scrollTop;
        if (scrollAccumulator >= 1) {
          next += Math.floor(scrollAccumulator);
          scrollAccumulator -= Math.floor(scrollAccumulator);
        }
        if (next > maxScroll) next = maxScroll;
        containerRef.current.scrollTop = next;
      }
      frameId = requestAnimationFrame(animate);
    }
    if (isPlaying) {
      frameId = requestAnimationFrame(animate);
    }
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [isPlaying, speed, text, position]);

  useEffect(() => {
    if (!isStageWindow) return;
    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      switch (e.code) {
        case 'Space':
          emit('teleprompter:control', { type: 'togglePlay' });
          break;
        case 'KeyR':
        case 'Home':
          emit('teleprompter:control', { type: 'resetPosition' });
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
        case 'ArrowUp':
          emit('teleprompter:control', { type: 'adjustSpeed', payload: 10 });
          break;
        case 'ArrowDown':
          emit('teleprompter:control', { type: 'adjustSpeed', payload: -10 });
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isStageWindow]);

  const textStyle = {
    color,
    fontSize: isStageWindow ? `${fontSize}px` : '18px',
    lineHeight: lineHeight ? lineHeight.toString() : undefined,
    transform: isMirrored ? 'scaleX(-1)' : 'none',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: 400,
    textAlign: 'center' as const,
    padding: isStageWindow ? '8vh 6vw' : '2rem',
    whiteSpace: 'pre-wrap' as const,
    userSelect: 'none' as const,
    letterSpacing: '0.3px',
    transition: 'font-size 0.3s ease, line-height 0.3s ease',
    wordBreak: 'break-word' as const,
  };

  const containerStyle = {
    background: bgColor,
    height: '100%',
    overflowY: 'auto',
    position: 'relative' as const,
    cursor: isStageWindow ? 'none' : 'default',
    borderRadius: isStageWindow ? '0' : '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    border: isStageWindow ? 'none' : 'none',
  };

  return (
    <div
      ref={containerRef}
      style={{
        ...containerStyle,
        overflowY: 'auto',
      }}
      className={`${isStageWindow ? 'fixed inset-0' : 'w-full h-full'} stage-view`}
    >
      {/* Clean header bar for stage window */}
      {isStageWindow && (
        <div className="sticky top-0 w-full h-12 sm:h-14 bg-black/70 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6 sm:px-10 z-50 text-slate-200">
          <div className="flex items-center gap-3 pt-6 pb-6">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              {/* SVG Logo for Teleprompter Pro */}
              <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="8" width="32" height="24" rx="6" fill="#6366F1"/>
                <rect x="8" y="12" width="24" height="16" rx="3" fill="#1E293B"/>
                <polygon points="18,16 26,20 18,24" fill="#22D3EE"/>
                <rect x="12" y="30" width="16" height="2.5" rx="1.25" fill="#22D3EE" opacity="0.7"/>
              </svg>
            </div>
            <span className="font-semibold text-sm sm:text-lg whitespace-nowrap">Teleprompter Pro</span>
          </div>
        </div>
      )}
      {/* Main content with clean styling */}
      <div 
        ref={textRef}
        style={{
          ...textStyle,
          marginTop: isStageWindow ? '48px' : '0',
          minHeight: isStageWindow ? 'calc(100vh - 48px)' : '100%',
          paddingBottom: isStageWindow ? '20vh' : '4rem', // Agregar padding bottom para ver últimas líneas
        }}
        className="stage-text"
      >
        {text || (
          <div className="text-center mt-20 opacity-80">
            <div className="w-16 h-16 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center">
              <span className="text-slate-200 text-2xl">📄</span>
            </div>
            <p className="text-lg font-medium mb-2" style={{ color }}>Sin guion cargado</p>
            <p className="text-sm opacity-75" style={{ color }}>
              {isStageWindow 
                ? 'Volvé al panel para cargar tu guion' 
                : 'Cargá un archivo o escribí texto para empezar'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default StageView;
