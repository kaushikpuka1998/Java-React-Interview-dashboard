import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminPage from './components/AdminPage.jsx'
import ProfilePage from './components/ProfilePage.jsx'
import PublicProfilePage from './components/PublicProfilePage.jsx'
import LeaderboardPage from './components/LeaderboardPage.jsx'
import ResumePage from './components/ResumePage.jsx'
import ResumeEditor from './components/ResumeEditor.jsx'
import ResetPasswordPage from './components/ResetPasswordPage.jsx'
import './index.css'

// Patch fetch to always include credentials for API_BASE requests
const originalFetch = window.fetch;
window.fetch = function() {
  let [resource, config] = arguments;
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api';
  if (typeof resource === 'string' && resource.startsWith(apiBase)) {
    config = config || {};
    config.credentials = 'include';
    arguments[1] = config;
  }
  return originalFetch.apply(this, arguments);
};

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

  // User profile / progress dashboard.
  if (path === '/profile' || path.startsWith('/profile/')) return <ProfilePage />

  if (path === '/leaderboard') return <LeaderboardPage />

  // Resume builder: list, and one resume's editor.
  if (path === '/resume') return <ResumePage />
  if (path.startsWith('/resume/')) return <ResumeEditor id={path.split('/')[2]} />

  // Public progress page for any member (no sign-in needed).
  if (path.startsWith('/u/')) return <PublicProfilePage username={decodeURIComponent(path.split('/')[2] || '')} />

  // Password reset page.
  if (path === '/reset-password' || path.startsWith('/reset-password')) return <ResetPasswordPage />

  // Pass the live pathname; App resolves it to a question slug (or shows the in-reader 404).
  return <App path={path} onPathChange={setPath} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
