import { createClient } from "npm:@supabase/supabase-js@2"

const DAY_MAP = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

const toMinutes = (value: string) => {
  const [h, m] = value.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? ""
  const fromEmail = Deno.env.get("REMINDER_FROM_EMAIL") ?? "Reminder Bot <onboarding@resend.dev>"

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return new Response(JSON.stringify({ error: "Missing server env vars" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  const now = new Date()
  const today = DAY_MAP[now.getDay()]
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

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

    for (const schedule of schedules ?? []) {
      const startTime = schedule.jam_mulai || schedule.jam
      if (!startTime) continue

      const startMinutes = toMinutes(startTime)
      if (startMinutes === null) continue

      const triggerMinutes = startMinutes - Number(setting.minutes_before || 30)
      if (triggerMinutes !== nowMinutes) continue

      const triggerAt = new Date(now)
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

      const html = `
        <h2>Pengingat Kuliah</h2>
        <p><b>${schedule.matkul}</b> akan mulai pada ${startTime}.</p>
        <p>Ruangan/Link: ${schedule.ruangan || "-"}</p>
        <p>Dosen: ${schedule.dosen || "-"}</p>
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
          subject: `Reminder Kuliah: ${schedule.matkul}`,
          html,
        }),
      })

      if (!emailRes.ok) continue

      await supabaseAdmin.from("reminder_logs").insert({
        user_id: setting.user_id,
        schedule_id: schedule.id,
        trigger_at: triggerIso,
        email_to: setting.gmail,
        status: "sent",
      })

      sentCount += 1
    }

    report.push({ user_id: setting.user_id, sent: sentCount })
  }

  return new Response(JSON.stringify({ ok: true, report }), {
    headers: { "Content-Type": "application/json" },
  })
})
