import './App.css'
import { AdminPage } from './components/AdminPage'
import { MainApp } from './components/MainApp'

function App() {
  const currentPath = window.location.pathname;

  if (currentPath === '/admin') {
    return <AdminPage />;
  }

  return <MainApp />;
}

export default App
