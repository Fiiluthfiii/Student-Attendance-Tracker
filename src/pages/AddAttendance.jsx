import { useCallback, useEffect, useMemo, useState } from "react"
import Navbar from "../components/Navbar"
import QRScanner from "../components/QRScanner"
import { createAttendance, getSchedules, uploadImage } from "../services/attendanceService"
import useAuthStore from "../store/useAuthStore"

const DAY_MAP = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

function AddAttendance() {
  const { user } = useAuthStore()
  const [matkul, setMatkul] = useState("")
  const [tanggal, setTanggal] = useState("")
  const [jam, setJam] = useState("")
  const [mode, setMode] = useState("")
  const [ruangan, setRuangan] = useState("")
  const [catatan, setCatatan] = useState("")
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [schedules, setSchedules] = useState([])

  const selectedDay = useMemo(() => {
    if (!tanggal) return ""
    const dt = new Date(`${tanggal}T00:00:00`)
    return DAY_MAP[dt.getDay()]
  }, [tanggal])

  const filteredSchedules = useMemo(() => {
    if (!selectedDay) return schedules
    return schedules.filter((item) => item.hari === selectedDay)
  }, [schedules, selectedDay])

  const availableCourses = useMemo(() => {
    return [...new Set(filteredSchedules.map((item) => item.matkul).filter(Boolean))]
  }, [filteredSchedules])

  const resetForm = () => {
    setMatkul("")
    setTanggal("")
    setJam("")
    setMode("")
    setRuangan("")
    setCatatan("")
    setFile(null)
    setPreview("")
  }

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const rows = await getSchedules(user.id)
        setSchedules(rows || [])
      } catch (err) {
        setMessage(`Gagal memuat jadwal: ${err.message}`)
      }
    }

    loadSchedules()
  }, [user.id])

  useEffect(() => {
    if (!matkul) return

    if (!availableCourses.includes(matkul)) {
      setMatkul("")
      setRuangan("")
    }
  }, [availableCourses, matkul])

  const handleScanSuccess = useCallback((decodedText) => {
    const match = decodedText.match(/room\s*[:=-]\s*(.+)/i)
    setRuangan(match ? match[1].trim() : decodedText)
    setShowScanner(false)
    setMessage("QR terbaca. Ruangan otomatis terisi.")
  }, [])

  const handleImageChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) {
      setFile(null)
      setPreview("")
      return
    }
    if (!selectedFile.type.startsWith("image/")) {
      setMessage("File harus berupa gambar.")
      setFile(null)
      setPreview("")
      return
    }

    if (preview) URL.revokeObjectURL(preview)
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setMessage("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")
    setIsSubmitting(true)

    try {
      if (!availableCourses.includes(matkul)) {
        setMessage("Mata kuliah harus dipilih dari jadwal kuliah.")
        return
      }

      let fotoUrl = ""
      if (file) fotoUrl = await uploadImage(file, user.id)

      await createAttendance({
        user_id: user.id,
        matkul,
        tanggal,
        jam,
        mode,
        ruangan,
        foto_url: fotoUrl,
        catatan,
      })

      setMessage("Kehadiran berhasil disimpan.")
      resetForm()
    } catch (err) {
      setMessage(`Gagal menyimpan data: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-wrap">
      <Navbar />
      <main className="page-content max-w-4xl space-y-5">
        <section className="surface p-6 md:p-8">
          <p className="pill bg-cyan-50 text-cyan-700 mb-3">New Entry</p>
          <h1 className="text-3xl font-bold">Tambah Kehadiran</h1>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <select
              value={matkul}
              onChange={(e) => {
                const picked = e.target.value
                setMatkul(picked)
                const matched = filteredSchedules.find((item) => item.matkul === picked)
                if (matched?.ruangan) setRuangan(matched.ruangan)
              }}
              className="field"
              required
            >
              <option value="">Pilih Mata Kuliah dari Jadwal</option>
              {availableCourses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            {selectedDay && !availableCourses.length ? (
              <p className="text-sm text-rose-600">
                Tidak ada jadwal pada hari {selectedDay}. Tambahkan jadwal dulu di menu Jadwal.
              </p>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="field" required />
              <input type="time" value={jam} onChange={(e) => setJam(e.target.value)} className="field" required />
            </div>

            <select value={mode} onChange={(e) => setMode(e.target.value)} className="field" required>
              <option value="">Pilih Mode Kuliah</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>

            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                placeholder="Ruangan / Link Meeting"
                value={ruangan}
                onChange={(e) => setRuangan(e.target.value)}
                className="field"
              />
              <button type="button" className="btn-ghost whitespace-nowrap" onClick={() => setShowScanner((prev) => !prev)}>
                {showScanner ? "Tutup QR" : "Scan QR"}
              </button>
            </div>

            {showScanner ? (
              <div className="surface p-3 bg-slate-50/80">
                <QRScanner onScanSuccess={handleScanSuccess} />
              </div>
            ) : null}

            <textarea placeholder="Catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} className="field min-h-28" />

            <input type="file" accept="image/*" onChange={handleImageChange} className="field" />

            {preview ? <img src={preview} alt="Preview" className="w-full h-64 object-cover rounded-xl" /> : null}
            {message ? <p className="text-sm text-slate-600">{message}</p> : null}

            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Kehadiran"}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default AddAttendance
