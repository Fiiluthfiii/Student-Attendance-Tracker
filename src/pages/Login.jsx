import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import supabase from "../services/supabaseClient"

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setMessage(`Login gagal: ${error.message}`)
      return
    }

    navigate("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="surface w-full max-w-md p-8 animate-[fadeIn_.35s_ease]">
        <p className="pill bg-cyan-50 text-cyan-700 mb-3">Welcome Back</p>
        <h1 className="text-3xl font-bold mb-2">Masuk ke Akun</h1>
        <p className="text-sm text-slate-500 mb-6">Kelola logbook kehadiran kuliah kamu.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="field pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {message ? <p className="text-sm text-rose-600">{message}</p> : null}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <p className="text-sm mt-5 text-slate-600">
          Belum punya akun?{" "}
          <Link to="/register" className="text-cyan-700 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
