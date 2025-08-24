import Dashboard from './components/Dashboard';
import Stage from './components/Stage';

function App() {
  const isStage = window.location.pathname.endsWith('stage.html');

  if (isStage) {
    return <Stage />;
  }

  return <Dashboard />;
}

export default App;
