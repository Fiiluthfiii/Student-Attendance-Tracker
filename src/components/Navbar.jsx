import { Link, NavLink, useNavigate } from "react-router-dom"
import useAuthStore from "../store/useAuthStore"

function Navbar() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()

  const handleLogout = async () => {
    await signOut()
    navigate("/login")
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm transition ${
      isActive
        ? "bg-slate-900 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="font-bold tracking-tight text-slate-900 text-lg">
          Student Attendance Tracker
        </Link>

        <nav className="flex items-center gap-2 order-3 sm:order-2 w-full sm:w-auto overflow-x-auto">
          <NavLink to="/" className={linkClass} end>
            Dashboard
          </NavLink>
          <NavLink to="/add" className={linkClass}>
            Tambah
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            Riwayat
          </NavLink>
          <NavLink to="/schedules" className={linkClass}>
            Jadwal
          </NavLink>
        </nav>

        <div className="flex items-center gap-2 order-2 sm:order-3 ml-auto">
          <span className="text-xs text-slate-500 hidden md:inline">{user?.email}</span>
          <NavLink to="/change-password" className={linkClass}>
            Password
          </NavLink>
          <button type="button" className="btn-ghost text-sm py-2 px-3" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
