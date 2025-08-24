import { createRoot } from 'react-dom/client';
import Stage from './components/Stage';
import './index.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<Stage />);
}
