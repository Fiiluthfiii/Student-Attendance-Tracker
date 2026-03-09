import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Navbar from "../components/Navbar"
import supabase from "../services/supabaseClient"

function ChangePassword() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")

    if (newPassword.length < 6) {
      setMessage("Password baru minimal 6 karakter.")
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage("Konfirmasi password tidak sama.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    setLoading(false)

    if (error) {
      setMessage(`Gagal ubah password: ${error.message}`)
      return
    }

    setMessage("Password berhasil diubah.")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="page-wrap">
      <Navbar />
      <main className="page-content max-w-3xl">
        <section className="surface p-6 md:p-8">
          <p className="pill bg-cyan-50 text-cyan-700 mb-3">Security</p>
          <h1 className="text-3xl font-bold mb-2">Ubah Password</h1>
          <p className="text-sm text-slate-500 mb-6">Gunakan password baru yang aman dan mudah kamu ingat.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                placeholder="Password Baru"
                className="field pr-11"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                onClick={() => setShowNew((prev) => !prev)}
                aria-label={showNew ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Konfirmasi Password Baru"
                className="field pr-11"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {message ? <p className="text-sm text-slate-600">{message}</p> : null}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default ChangePassword
