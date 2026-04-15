import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const part = token.split(".")[1]
    if (!part) return null
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

const DAY_MAP = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

type ScheduleRow = {
  id: number
  matkul: string | null
  hari: string | null
  jam_mulai: string | null
  jam: string | null
  ruangan: string | null
  dosen: string | null
}

const toMinutes = (value: string) => {
  const [h, m] = value.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

const getNextSchedule = (rows: ScheduleRow[], now: Date) => {
  const nowDay = now.getDay()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  let best: { schedule: ScheduleRow; startTime: string; diffMinutes: number } | null = null

  for (const row of rows) {
    const startTime = row.jam_mulai || row.jam
    if (!startTime || !row.hari) continue

    const dayIndex = DAY_MAP.indexOf(row.hari)
    const startMinutes = toMinutes(startTime)
    if (dayIndex < 0 || startMinutes === null) continue

    let dayDiff = (dayIndex - nowDay + 7) % 7
    let diffMinutes = dayDiff * 24 * 60 + (startMinutes - nowMinutes)
    if (diffMinutes < 0) diffMinutes += 7 * 24 * 60

    if (!best || diffMinutes < best.diffMinutes) {
      best = { schedule: row, startTime, diffMinutes }
    }
  }

  return best
}

const formatCountdown = (diffMinutes: number) => {
  if (diffMinutes <= 0) return "sebentar lagi"
  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60
  if (hours === 0) return `${mins} menit lagi`
  if (mins === 0) return `${hours} jam lagi`
  return `${hours} jam ${mins} menit lagi`
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? ""
    const fromEmail = Deno.env.get("REMINDER_FROM_EMAIL") ?? "Reminder Bot <onboarding@resend.dev>"

    if (!supabaseUrl || !resendApiKey) {
      return new Response(JSON.stringify({ error: "Missing server env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const authHeader = req.headers.get("Authorization") ?? ""
    const body = await req.json().catch(() => ({}))
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : ""
    const payload = token ? decodeJwtPayload(token) : null
    const userId = typeof payload?.sub === "string" ? payload.sub : ""
    const userEmail = typeof payload?.email === "string" ? payload.email : ""
    const toEmail = body?.toEmail || userEmail

    if (!toEmail) {
      return new Response(JSON.stringify({ error: "Target email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    let scheduleBlock = `<p>Belum ada jadwal terdekat yang bisa dibaca. Pastikan data jadwal kuliah sudah diisi.</p>`
    let emailSubject = "Test Pengingat Kuliah"

    if (serviceRoleKey && userId) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
      const { data: schedules, error: scheduleError } = await supabaseAdmin
        .from("schedules")
        .select("id, matkul, hari, jam_mulai, jam, ruangan, dosen")
        .eq("user_id", userId)

      if (!scheduleError && schedules?.length) {
        const nextSchedule = getNextSchedule(schedules as ScheduleRow[], new Date())

        if (nextSchedule) {
          const { schedule, startTime, diffMinutes } = nextSchedule
          const courseName = schedule.matkul || "Mata kuliah"
          const dayName = schedule.hari || "-"
          const room = schedule.ruangan || "-"
          const lecturer = schedule.dosen || "-"
          const countdown = formatCountdown(diffMinutes)

          emailSubject = `Test Reminder: ${courseName} (${dayName} ${startTime})`
          scheduleBlock = `
            <p><b>Ini simulasi reminder untuk jadwal terdekatmu:</b></p>
            <ul>
              <li>Mata kuliah: <b>${courseName}</b></li>
              <li>Hari: <b>${dayName}</b></li>
              <li>Jam mulai: <b>${startTime}</b></li>
              <li>Ruangan/Link: <b>${room}</b></li>
              <li>Dosen: <b>${lecturer}</b></li>
              <li>Waktu menuju kelas: <b>${countdown}</b></li>
            </ul>
          `
        }
      }
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: emailSubject,
        html: `
          <h2>Test Pengingat Kuliah</h2>
          <p>Halo ${userEmail || toEmail},</p>
          ${scheduleBlock}
          <p>Email ini adalah simulasi dari sistem reminder Student Attendance Tracker.</p>
        `,
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.text()
      return new Response(JSON.stringify({ error: `Email provider error: ${errBody}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
