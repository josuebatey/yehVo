import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/Layout'
import { Toaster } from './components/ui/toaster'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Receive } from './pages/Receive'
import { Send } from './pages/Send'
import { History } from './pages/History'
import { useAuthStore } from './store/auth'
import { useTheme } from './hooks/use-theme'
import { VerifyEmail } from './pages/VerifyEmail'
import AdminDashboard from './pages/AdminDashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  const { initializeAuth, isAuthenticated, isLoading } = useAuthStore()
  const { theme } = useTheme()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading VoicePay...</p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route 
                path="login" 
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
              />
              <Route 
                path="register" 
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
              />
              <Route 
                path="dashboard" 
                element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="receive" 
                element={isAuthenticated ? <Receive /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="send" 
                element={isAuthenticated ? <Send /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="history" 
                element={isAuthenticated ? <History /> : <Navigate to="/login" replace />} 
              />
              <Route path="verify-email" element={<VerifyEmail />} />
              <Route path="admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
          <Toaster />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App