import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './stores/useAuthStore'
import LoadingSpinner from './components/LoadingSpinner'

// ============================================
// Lazy Loaded Pages (Code Splitting)
// ============================================
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Chat = lazy(() => import('./pages/Chat'))

// Lazy loaded components
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'))

/**
 * App Component
 * 
 * Root component with lazy loading and code splitting.
 * Uses useAuthStore for session management.
 */
function App() {
  const initSession = useAuthStore((state) => state.initSession)

  useEffect(() => {
    // Initialize Auth Session on App Mount
    const cleanupPromise = initSession()
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup())
    }
  }, [initSession])

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
