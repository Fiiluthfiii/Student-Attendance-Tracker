import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import {
  getReminderSettings,
  saveReminderSettings,
  sendTestReminderEmail,
} from "../services/reminderService"
import useAuthStore from "../store/useAuthStore"

function ReminderSettings() {
  const { user } = useAuthStore()
  const [enabled, setEnabled] = useState(false)
  const [gmail, setGmail] = useState("")
  const [minutesBefore, setMinutesBefore] = useState(30)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await getReminderSettings(user.id)
        if (!active) return

        setEnabled(Boolean(data.enabled))
        setGmail(data.gmail || user.email || "")
        setMinutesBefore(Number(data.minutes_before) || 30)
      } catch (err) {
        if (active) setMessage(`Gagal memuat pengaturan: ${err.message}`)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [user.email, user.id])

  const handleSave = async (e) => {
    e.preventDefault()
    setMessage("")
    setSaving(true)

    try {
      await saveReminderSettings(user.id, {
        enabled,
        gmail: gmail.trim(),
        minutes_before: Number(minutesBefore),
      })
      setMessage("Pengaturan pengingat email berhasil disimpan.")
    } catch (err) {
      setMessage(`Gagal menyimpan pengaturan: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSendTest = async () => {
    setMessage("")
    setSendingTest(true)

    try {
      await sendTestReminderEmail(gmail.trim())
      setMessage("Email test berhasil dikirim. Cek inbox/spam Gmail kamu.")
    } catch (err) {
      setMessage(`Gagal kirim email test: ${err.message}`)
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div className="page-wrap">
      <Navbar />
      <main className="page-content max-w-3xl">
        <section className="surface p-6 md:p-8 space-y-5">
          <p className="pill bg-emerald-50 text-emerald-700">Settings</p>
          <h1 className="text-3xl font-bold">Pengingat ke Gmail</h1>
          <p className="text-sm text-slate-600">
            Atur email tujuan dan jeda pengingat sebelum jam kuliah. Notifikasi akan dikirim ke Gmail pribadi
            melalui server (Supabase Edge Function).
          </p>

          {loading ? (
            <p className="text-sm text-slate-500">Memuat pengaturan...</p>
          ) : (
            <form className="space-y-4" onSubmit={handleSave}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Aktifkan pengingat email otomatis</span>
              </label>

              <div className="space-y-2">
                <label className="text-sm text-slate-700">Email Gmail tujuan</label>
                <input
                  type="email"
                  className="field"
                  placeholder="contoh: namakamu@gmail.com"
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-700">Kirim pengingat berapa menit sebelum kelas</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  className="field"
                  value={minutesBefore}
                  onChange={(e) => setMinutesBefore(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col md:flex-row gap-2">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleSendTest}
                  disabled={sendingTest || !gmail.trim()}
                >
                  {sendingTest ? "Mengirim..." : "Kirim Email Test"}
                </button>
              </div>
            </form>
          )}

          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </section>
      </main>
    </div>
  )
}

export default ReminderSettings

