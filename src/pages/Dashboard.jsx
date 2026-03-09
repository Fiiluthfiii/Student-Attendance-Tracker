import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import { getAttendances, getAttendanceStats, getSchedules } from "../services/attendanceService"
import useAuthStore from "../store/useAuthStore"

const DAY_MAP = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, uniqueCourses: 0 })
  const [recent, setRecent] = useState([])
  const [schedules, setSchedules] = useState([])
  const [message, setMessage] = useState("")
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, attendanceRows, scheduleRows] = await Promise.all([
          getAttendanceStats(user.id),
          getAttendances(user.id),
          getSchedules(user.id).catch(() => []),
        ])

        setStats(statsData)
        setRecent(attendanceRows.slice(0, 6))
        setSchedules(scheduleRows)
      } catch (err) {
        setMessage(err.message)
      }
    }

    load()
  }, [user.id])

  const activeReminders = useMemo(() => {
    const day = DAY_MAP[now.getDay()]
    const hour = String(now.getHours()).padStart(2, "0")
    const minute = String(now.getMinutes()).padStart(2, "0")
    const currentTime = `${hour}:${minute}`
    return schedules.filter((item) => item.hari === day && (item.jam_mulai || item.jam) === currentTime)
  }, [now, schedules])

  const todayReminders = useMemo(() => {
    const today = DAY_MAP[now.getDay()]
    return schedules
      .filter((item) => item.hari === today)
      .sort((a, b) => (a.jam_mulai || a.jam || "").localeCompare(b.jam_mulai || b.jam || ""))
  }, [now, schedules])

  const tomorrowReminders = useMemo(() => {
    const tomorrowIdx = (now.getDay() + 1) % 7
    const tomorrow = DAY_MAP[tomorrowIdx]
    return schedules.filter((item) => item.hari === tomorrow)
  }, [now, schedules])

  return (
    <div className="page-wrap">
      <Navbar />
      <main className="page-content space-y-6">
        <section className="surface p-6 md:p-8">
          <p className="pill bg-slate-900 text-white mb-3">Dashboard</p>
          <h1 className="text-3xl font-bold">Ringkasan Kehadiran</h1>
          <p className="text-slate-600 mt-2">Lihat statistik dan aktivitas terbaru dalam satu halaman.</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article className="surface p-5">
            <p className="text-sm text-slate-500">Total Kehadiran</p>
            <p className="text-4xl font-bold mt-2">{stats.total}</p>
          </article>
          <article className="surface p-5">
            <p className="text-sm text-slate-500">Minggu Ini</p>
            <p className="text-4xl font-bold mt-2">{stats.thisWeek}</p>
          </article>
          <article className="surface p-5">
            <p className="text-sm text-slate-500">Mata Kuliah Unik</p>
            <p className="text-4xl font-bold mt-2">{stats.uniqueCourses}</p>
          </article>
        </section>

        {activeReminders.length ? (
          <section className="surface p-5 border-cyan-200">
            <p className="font-semibold text-cyan-800">Reminder Kuliah Sekarang</p>
            <ul className="mt-2 text-sm text-cyan-900 space-y-1">
              {activeReminders.map((item) => (
                <li key={item.id}>
                  {item.matkul} - {item.jam_mulai || item.jam} ({item.kelas || "tanpa kelas"})
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {todayReminders.length ? (
          <section className="surface p-5 border-sky-200">
            <p className="font-semibold text-sky-800">Pengingat Hari Ini</p>
            <ul className="mt-2 text-sm text-sky-900 space-y-1">
              {todayReminders.map((item) => (
                <li key={item.id}>
                  {item.matkul} | {item.jam_mulai || item.jam} - {item.jam_selesai || "-"} | {item.kelas || "-"} |{" "}
                  {item.dosen || "-"}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {tomorrowReminders.length ? (
          <section className="surface p-5 border-orange-200">
            <p className="font-semibold text-orange-800">Pengingat H-1 (Besok)</p>
            <ul className="mt-2 text-sm text-orange-900 space-y-1">
              {tomorrowReminders.map((item) => (
                <li key={item.id}>
                  {item.matkul} | {item.jam_mulai || item.jam} - {item.jam_selesai || "-"} | {item.kelas || "-"} |{" "}
                  {item.dosen || "-"}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Riwayat Terbaru</h2>
            <Link className="btn-ghost text-sm" to="/history">
              Lihat semua
            </Link>
          </div>

          {message ? <p className="text-sm text-rose-600 mb-3">{message}</p> : null}

          {!recent.length ? (
            <p className="text-sm text-slate-500">Belum ada data kehadiran.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recent.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold">{item.matkul}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {item.tanggal} - {item.jam} - {item.mode}
                  </p>
                  <p className="text-sm text-slate-500">{item.ruangan || "-"}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Dashboard
