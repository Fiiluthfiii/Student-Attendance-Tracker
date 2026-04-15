import { createClient } from "npm:@supabase/supabase-js@2"

const DAY_MAP = {
  Sunday: "Minggu",
  Monday: "Senin",
  Tuesday: "Selasa",
  Wednesday: "Rabu",
  Thursday: "Kamis",
  Friday: "Jumat",
  Saturday: "Sabtu",
} as const

const toMinutes = (value: string) => {
  const [h, m] = value.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

const truncateMessage = (value: string, max = 500) => value.slice(0, max)

const insertReminderLog = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  payload: {
    user_id: string
    schedule_id: number
    trigger_at: string
    email_to: string
    status: string
    schedule_name?: string | null
    error_message?: string | null
  }
) => {
  const row = {
    ...payload,
    schedule_name: payload.schedule_name ?? null,
    error_message: payload.error_message ?? null,
  }

  const { error } = await supabaseAdmin.from("reminder_logs").insert(row)
  if (!error) return

  const maybeMissingNewColumns =
    error.message.includes("schedule_name") || error.message.includes("error_message")

  if (!maybeMissingNewColumns) return

  const { schedule_name, error_message, ...fallbackRow } = row
  await supabaseAdmin.from("reminder_logs").insert(fallbackRow)
}

const getNowInTimezone = (timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date())

  const weekday = parts.find((item) => item.type === "weekday")?.value || ""
  const hour = Number(parts.find((item) => item.type === "hour")?.value)
  const minute = Number(parts.find((item) => item.type === "minute")?.value)

  if (!weekday || Number.isNaN(hour) || Number.isNaN(minute)) {
    return null
  }

  const dayName = DAY_MAP[weekday as keyof typeof DAY_MAP]
  if (!dayName) return null

  return {
    dayName,
    nowMinutes: hour * 60 + minute,
  }
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? ""
  const fromEmail = Deno.env.get("REMINDER_FROM_EMAIL") ?? "Reminder Bot <onboarding@resend.dev>"
  const reminderTimezone = Deno.env.get("REMINDER_TIMEZONE") ?? "Asia/Jakarta"
  const cronSecret = Deno.env.get("CRON_SECRET") ?? ""

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return new Response(JSON.stringify({ error: "Missing server env vars" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (cronSecret) {
    const incomingSecret = req.headers.get("x-cron-secret") ?? ""
    if (incomingSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized cron request" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  const nowInfo = getNowInTimezone(reminderTimezone)

  if (!nowInfo) {
    return new Response(JSON.stringify({ error: "Failed to resolve timezone clock" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const today = nowInfo.dayName
  const nowMinutes = nowInfo.nowMinutes

  const { data: settingsRows, error: settingsError } = await supabaseAdmin
    .from("reminder_settings")
    .select("user_id, gmail, minutes_before")
    .eq("enabled", true)

  if (settingsError) {
    return new Response(JSON.stringify({ error: settingsError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const report = []

  for (const setting of settingsRows ?? []) {
    const { data: schedules, error: scheduleError } = await supabaseAdmin
      .from("schedules")
      .select("id, matkul, hari, jam_mulai, jam, ruangan, dosen")
      .eq("user_id", setting.user_id)
      .eq("hari", today)

    if (scheduleError) {
      report.push({ user_id: setting.user_id, sent: 0, error: scheduleError.message })
      continue
    }

    let sentCount = 0
    let failedCount = 0

    for (const schedule of schedules ?? []) {
      const startTime = schedule.jam_mulai || schedule.jam
      if (!startTime) continue

      const startMinutes = toMinutes(startTime)
      if (startMinutes === null) continue

      const triggerMinutes = startMinutes - Number(setting.minutes_before || 30)
      if (triggerMinutes !== nowMinutes) continue

      const triggerAt = new Date()
      triggerAt.setSeconds(0, 0)
      const triggerIso = triggerAt.toISOString()

      const { data: existing } = await supabaseAdmin
        .from("reminder_logs")
        .select("id")
        .eq("user_id", setting.user_id)
        .eq("schedule_id", schedule.id)
        .eq("trigger_at", triggerIso)
        .maybeSingle()

      if (existing) continue

      const baseLog = {
        user_id: setting.user_id,
        schedule_id: schedule.id,
        trigger_at: triggerIso,
        email_to: setting.gmail,
        schedule_name: schedule.matkul || null,
      }

      const html = `
        <h2>Pengingat Kelas</h2>
        <p>Hai, ini pengingat untuk kelas berikut:</p>
        <ul>
          <li>Mata kuliah: <b>${schedule.matkul || "-"}</b></li>
          <li>Hari: <b>${today}</b></li>
          <li>Jam mulai: <b>${startTime}</b></li>
          <li>Ruangan/Link: <b>${schedule.ruangan || "-"}</b></li>
          <li>Dosen: <b>${schedule.dosen || "-"}</b></li>
        </ul>
        <p>Silakan siap-siap masuk kelas, semangat!</p>
      `

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [setting.gmail],
          subject: `Pengingat Kelas: ${schedule.matkul || "-"} (${today} ${startTime})`,
          html,
        }),
      })

      if (!emailRes.ok) {
        const providerError = truncateMessage(await emailRes.text())
        await insertReminderLog(supabaseAdmin, {
          ...baseLog,
          status: "failed",
          error_message: providerError || "Email provider returned non-2xx response",
        })
        failedCount += 1
        continue
      }

      await insertReminderLog(supabaseAdmin, {
        ...baseLog,
        status: "sent",
      })

      sentCount += 1
    }

    report.push({ user_id: setting.user_id, sent: sentCount, failed: failedCount })
  }

  return new Response(JSON.stringify({ ok: true, report }), {
    headers: { "Content-Type": "application/json" },
  })
})
