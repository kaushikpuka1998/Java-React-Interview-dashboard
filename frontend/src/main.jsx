import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminPage from './components/AdminPage.jsx'
import './index.css'

// ponytail: raw pathname check at the entry point — avoids adding react-router just for a wildcard
function Router() {
  const [path, setPath] = useState(() => typeof window !== 'undefined' ? window.location.pathname : '/')

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Dedicated admin route (create / edit / delete questions).
  if (path === '/admin' || path.startsWith('/admin/')) return <AdminPage />

  // Pass the live pathname; App resolves it to a question slug (or shows the in-reader 404).
  return <App path={path} onPathChange={setPath} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
