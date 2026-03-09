import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import AddAttendance from "./pages/AddAttendance"
import History from "./pages/History"
import ChangePassword from "./pages/ChangePassword"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Schedules from "./pages/Schedules"
import supabase from "./services/supabaseClient"
import useAuthStore from "./store/useAuthStore"

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  const { setUser, bootstrapAuth } = useAuthStore()

  useEffect(() => {
    bootstrapAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [bootstrapAuth, setUser])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AddAttendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedules"
          element={
            <ProtectedRoute>
              <Schedules />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
