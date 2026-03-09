import { useEffect, useMemo, useState } from "react"
import Navbar from "../components/Navbar"
import {
  createSchedule,
  deleteSchedule,
  getSchedules,
  updateSchedule,
} from "../services/attendanceService"
import useAuthStore from "../store/useAuthStore"

const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

const colorOptions = [
  { label: "Biru", value: "#0ea5e9" },
  { label: "Hijau", value: "#22c55e" },
  { label: "Oranye", value: "#f97316" },
  { label: "Merah", value: "#ef4444" },
  { label: "Ungu", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
]

const emptyForm = {
  matkul: "",
  hari: "Senin",
  kelas: "",
  ruangan: "",
  jam_mulai: "",
  jam_selesai: "",
  dosen: "",
  sks: "",
  warna: "#0ea5e9",
}

function Schedules() {
  const { user } = useAuthStore()
  const [form, setForm] = useState(emptyForm)
  const [rows, setRows] = useState([])
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState(null)

  const loadSchedules = async (activeRef = { current: true }) => {
    try {
      const data = await getSchedules(user.id)
      if (activeRef.current) setRows(data)
    } catch (err) {
      if (activeRef.current) {
        setMessage(
          `Gagal memuat jadwal: ${err.message}. Pastikan kolom baru jadwal sudah ditambahkan.`
        )
      }
    }
  }

  useEffect(() => {
    const activeRef = { current: true }

    ;(async () => {
      await loadSchedules(activeRef)
    })()

    return () => {
      activeRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  const groupedSchedules = useMemo(() => {
    const grouped = days.reduce((acc, day) => {
      acc[day] = []
      return acc
    }, {})

    rows.forEach((item) => {
      if (grouped[item.hari]) grouped[item.hari].push(item)
    })

    days.forEach((day) => {
      grouped[day].sort((a, b) => {
        const aTime = a.jam_mulai || a.jam || ""
        const bTime = b.jam_mulai || b.jam || ""
        return aTime.localeCompare(bTime)
      })
    })

    return grouped
  }, [rows])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")

  const payload = {
      ...form,
      jam: form.jam_mulai,
      sks: Number(form.sks),
      user_id: user.id,
    }

    try {
      if (editingId) {
        await updateSchedule(editingId, user.id, payload)
        setMessage("Jadwal berhasil diperbarui.")
      } else {
        await createSchedule(payload)
        setMessage("Jadwal berhasil disimpan.")
      }

      setForm(emptyForm)
      setEditingId(null)
      await loadSchedules()
    } catch (err) {
      setMessage(err.message)
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setForm({
      matkul: item.matkul || "",
      hari: item.hari || "Senin",
      kelas: item.kelas || item.ruangan || "",
      ruangan: item.ruangan || "",
      jam_mulai: item.jam_mulai || item.jam || "",
      jam_selesai: item.jam_selesai || "",
      dosen: item.dosen || "",
      sks: String(item.sks ?? ""),
      warna: item.warna || "#0ea5e9",
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
    setMessage("")
  }

  const handleDelete = async (id) => {
    try {
      await deleteSchedule(id, user.id)
      await loadSchedules()
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <div className="page-wrap">
      <Navbar />
      <main className="page-content space-y-4">
        <section className="surface p-6">
          <p className="pill bg-orange-50 text-orange-700 mb-2">Reminder</p>
          <h1 className="text-3xl font-bold mb-5">Jadwal Kuliah</h1>

          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Mata kuliah"
              value={form.matkul}
              onChange={(e) => setForm((prev) => ({ ...prev, matkul: e.target.value }))}
              className="field"
              required
            />
            <select
              value={form.hari}
              onChange={(e) => setForm((prev) => ({ ...prev, hari: e.target.value }))}
              className="field"
            >
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={form.jam_mulai}
              onChange={(e) => setForm((prev) => ({ ...prev, jam_mulai: e.target.value }))}
              className="field"
              required
            />
            <input
              type="time"
              value={form.jam_selesai}
              onChange={(e) => setForm((prev) => ({ ...prev, jam_selesai: e.target.value }))}
              className="field"
              required
            />
            <input
              type="text"
              placeholder="Kelas (contoh: IF-23-A)"
              value={form.kelas}
              onChange={(e) => setForm((prev) => ({ ...prev, kelas: e.target.value }))}
              className="field"
              required
            />
            <input
              type="text"
              placeholder="Ruangan (contoh: GKU 2.3)"
              value={form.ruangan}
              onChange={(e) => setForm((prev) => ({ ...prev, ruangan: e.target.value }))}
              className="field"
              required
            />
            <input
              type="text"
              placeholder="Dosen / Guru"
              value={form.dosen}
              onChange={(e) => setForm((prev) => ({ ...prev, dosen: e.target.value }))}
              className="field"
              required
            />
            <input
              type="number"
              placeholder="SKS"
              value={form.sks}
              onChange={(e) => setForm((prev) => ({ ...prev, sks: e.target.value }))}
              className="field"
              min={1}
              max={6}
              required
            />

            <div className="field flex items-center gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  aria-label={color.label}
                  title={color.label}
                  onClick={() => setForm((prev) => ({ ...prev, warna: color.value }))}
                  className={`h-7 w-7 rounded-full border-2 ${
                    form.warna === color.value ? "border-slate-900" : "border-white"
                  }`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex flex-col md:flex-row gap-2">
              <button type="submit" className="btn-primary flex-1">
                {editingId ? "Update Jadwal" : "Simpan Jadwal"}
              </button>

              {editingId ? (
                <button type="button" className="btn-ghost" onClick={handleCancelEdit}>
                  Batal Edit
                </button>
              ) : null}
            </div>
          </form>

          {message ? <p className="text-sm text-rose-600 mt-3">{message}</p> : null}
        </section>

        <section className="surface p-5">
          <h2 className="text-xl font-semibold mb-4">Grid Jadwal Mingguan</h2>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
            {days.map((day) => (
              <div key={day} className="rounded-xl border border-slate-200 bg-white p-3 min-h-[220px]">
                <h3 className="font-semibold text-sm mb-2">{day}</h3>

                <div className="space-y-2">
                  {groupedSchedules[day].length ? (
                    groupedSchedules[day].map((item) => (
                      <article
                        key={item.id}
                        className="rounded-lg p-2 text-white"
                        style={{ backgroundColor: item.warna || "#0ea5e9" }}
                      >
                        <p className="text-sm font-semibold leading-snug">{item.matkul}</p>
                        <p className="text-xs opacity-90">
                          {item.jam_mulai || item.jam} - {item.jam_selesai || "-"}
                        </p>
                        <p className="text-xs opacity-90">
                          Kelas: {item.kelas || "-"} | Ruang: {item.ruangan || "-"}
                        </p>

                        <div className="mt-2 flex gap-1">
                          <button
                            type="button"
                            className="text-[11px] px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-[11px] px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                            onClick={() => handleDelete(item.id)}
                          >
                            Hapus
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Kosong</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Schedules
