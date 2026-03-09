import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import { deleteAttendance, getAttendances } from "../services/attendanceService"
import useAuthStore from "../store/useAuthStore"
import { exportAttendancePdf } from "../utils/exportPdf"

function History() {
  const { user } = useAuthStore()
  const [rows, setRows] = useState([])
  const [filters, setFilters] = useState({ matkul: "", startDate: "", endDate: "" })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const loadData = async (activeRef = { current: true }) => {
    setLoading(true)
    setMessage("")

    try {
      const data = await getAttendances(user.id, filters)
      if (activeRef.current) setRows(data)
    } catch (err) {
      if (activeRef.current) setMessage(err.message)
    } finally {
      if (activeRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    const activeRef = { current: true }

    ;(async () => {
      await loadData(activeRef)
    })()

    return () => {
      activeRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  const handleDelete = async (id) => {
    const ok = window.confirm("Hapus data ini?")
    if (!ok) return

    try {
      await deleteAttendance(id, user.id)
      await loadData()
    } catch (err) {
      setMessage(err.message)
    }
  }

  const handleFilterSubmit = async (e) => {
    e.preventDefault()
    await loadData()
  }

  const handleExportPdf = async () => {
    setMessage("")
    setExporting(true)

    try {
      await exportAttendancePdf(rows)
    } catch (err) {
      setMessage(`Gagal export PDF: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="page-wrap">
      <Navbar />
      <main className="page-content space-y-4">
        <section className="surface p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <p className="pill bg-slate-900 text-white mb-2">Archive</p>
              <h1 className="text-3xl font-bold">Riwayat Kehadiran</h1>
            </div>
            <button type="button" className="btn-primary" onClick={handleExportPdf} disabled={exporting}>
              {exporting ? "Membuat PDF..." : "Export PDF"}
            </button>
          </div>

          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Filter mata kuliah"
              value={filters.matkul}
              onChange={(e) => setFilters((prev) => ({ ...prev, matkul: e.target.value }))}
              className="field"
            />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className="field"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              className="field"
            />
            <button type="submit" className="btn-ghost">
              Terapkan Filter
            </button>
          </form>
        </section>

        {message ? <p className="text-sm text-rose-600">{message}</p> : null}
        {loading ? <p className="text-sm text-slate-500">Memuat...</p> : null}

        {!loading && !rows.length ? (
          <section className="surface p-6 text-sm text-slate-500">Belum ada riwayat.</section>
        ) : (
          <section className="space-y-3">
            {rows.map((item) => (
              <article key={item.id} className="surface p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{item.matkul}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {item.tanggal} - {item.jam} - {item.mode}
                    </p>
                    <p className="text-sm text-slate-500">{item.ruangan || "-"}</p>
                    <p className="text-sm text-slate-500">{item.catatan || "Tanpa catatan"}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.foto_url ? (
                      <a href={item.foto_url} target="_blank" rel="noreferrer" className="btn-ghost text-sm py-2 px-3">
                        Lihat Foto
                      </a>
                    ) : null}
                    <button type="button" className="btn-danger text-sm py-2 px-3" onClick={() => handleDelete(item.id)}>
                      Hapus
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

export default History
