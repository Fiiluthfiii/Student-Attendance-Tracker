import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import supabase from "../services/supabaseClient"

function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      setMessage(`Register gagal: ${error.message}`)
      return
    }

    setMessage("Register berhasil. Silakan login.")
    setTimeout(() => navigate("/login"), 900)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="surface w-full max-w-md p-8 animate-[fadeIn_.35s_ease]">
        <p className="pill bg-orange-50 text-orange-700 mb-3">Create Account</p>
        <h1 className="text-3xl font-bold mb-2">Buat Akun Baru</h1>
        <p className="text-sm text-slate-500 mb-6">Satu akun untuk dashboard, riwayat, dan reminder.</p>

        <form onSubmit={handleRegister} className="space-y-4">
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
              placeholder="Password (min. 6 karakter)"
              className="field pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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

          {message ? <p className="text-sm text-slate-600">{message}</p> : null}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Memproses..." : "Register"}
          </button>
        </form>

        <p className="text-sm mt-5 text-slate-600">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-cyan-700 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
