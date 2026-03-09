import supabase from "./supabaseClient"

const ATTENDANCE_TABLE = "attendances"
const SCHEDULE_TABLE = "schedules"
const BUCKET = "attendance"

export const uploadImage = async (file, userId) => {
  const safeName = file.name.replace(/\s+/g, "-")
  const filePath = `${userId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file)

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

export const createAttendance = async (payload) => {
  const { error } = await supabase.from(ATTENDANCE_TABLE).insert([payload])
  if (error) throw new Error(error.message)
}

export const getAttendances = async (userId, { matkul = "", startDate = "", endDate = "" } = {}) => {
  let query = supabase
    .from(ATTENDANCE_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("tanggal", { ascending: false })
    .order("jam", { ascending: false })

  if (matkul) query = query.ilike("matkul", `%${matkul}%`)
  if (startDate) query = query.gte("tanggal", startDate)
  if (endDate) query = query.lte("tanggal", endDate)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export const deleteAttendance = async (attendanceId, userId) => {
  const { data, error } = await supabase
    .from(ATTENDANCE_TABLE)
    .delete()
    .eq("id", attendanceId)
    .eq("user_id", userId)
    .select("id")

  if (error) throw new Error(error.message)

  if (!data || data.length === 0) {
    throw new Error(
      "Data tidak terhapus. Kemungkinan policy DELETE (RLS) belum aktif atau data bukan milik user login."
    )
  }
}

export const getAttendanceStats = async (userId) => {
  const today = new Date()
  const startOfWeek = new Date(today)
  const day = startOfWeek.getDay()
  const diff = (day + 6) % 7
  startOfWeek.setDate(startOfWeek.getDate() - diff)

  const isoStartWeek = startOfWeek.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from(ATTENDANCE_TABLE)
    .select("id, matkul, tanggal")
    .eq("user_id", userId)

  if (error) throw new Error(error.message)

  const rows = data || []
  const weekRows = rows.filter((item) => item.tanggal >= isoStartWeek)
  const uniqueMatkul = new Set(rows.map((item) => item.matkul))

  return {
    total: rows.length,
    thisWeek: weekRows.length,
    uniqueCourses: uniqueMatkul.size,
  }
}

export const getSchedules = async (userId) => {
  const { data, error } = await supabase
    .from(SCHEDULE_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("hari", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export const createSchedule = async (payload) => {
  const { error } = await supabase.from(SCHEDULE_TABLE).insert([payload])
  if (error) throw new Error(error.message)
}

export const updateSchedule = async (scheduleId, userId, payload) => {
  const { error } = await supabase
    .from(SCHEDULE_TABLE)
    .update(payload)
    .eq("id", scheduleId)
    .eq("user_id", userId)

  if (error) throw new Error(error.message)
}

export const deleteSchedule = async (scheduleId, userId) => {
  const { error } = await supabase
    .from(SCHEDULE_TABLE)
    .delete()
    .eq("id", scheduleId)
    .eq("user_id", userId)
  if (error) throw new Error(error.message)
}
