import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
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
 * Each page is loaded only when needed.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
