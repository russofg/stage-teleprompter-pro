export interface PrompterState {
  text: string;
  fontSize: number;
  color: string;
  bgColor: string;
  speed: number; // pixels per second
  isPlaying: boolean;
  isMirrored: boolean;
  lineHeight: number;
  position: number; // current scroll position
}

export interface FileData {
  name: string;
  content: string;
  type: 'txt' | 'docx';
}

export type PrompterEvent = 
  | { type: 'updateState'; payload: Partial<PrompterState> }
  | { type: 'togglePlay' }
  | { type: 'resetPosition' }
  | { type: 'loadText'; payload: string };
