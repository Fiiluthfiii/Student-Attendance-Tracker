import supabase from "./supabaseClient"

const REMINDER_TABLE = "reminder_settings"
const REMINDER_LOG_TABLE = "reminder_logs"

const defaultSettings = {
  enabled: false,
  gmail: "",
  minutes_before: 30,
}

export const getReminderSettings = async (userId) => {
  const { data, error } = await supabase
    .from(REMINDER_TABLE)
    .select("enabled, gmail, minutes_before")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data || defaultSettings
}

export const saveReminderSettings = async (userId, payload) => {
  const { error } = await supabase.from(REMINDER_TABLE).upsert(
    {
      user_id: userId,
      enabled: payload.enabled,
      gmail: payload.gmail,
      minutes_before: payload.minutes_before,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error) throw new Error(error.message)
}

export const sendTestReminderEmail = async (toEmail) => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) throw new Error(sessionError.message)
  if (!session?.access_token) throw new Error("Sesi login habis. Silakan login ulang.")

  const { error } = await supabase.functions.invoke("send-reminder-test", {
    body: { toEmail },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (error) throw new Error(error.message)
}

export const getReminderLogs = async (userId, limit = 15) => {
  const selectWithReason =
    "id, schedule_id, schedule_name, trigger_at, sent_at, email_to, status, error_message"

  const selectFallback = "id, schedule_id, trigger_at, sent_at, email_to, status"

  const buildQuery = (selectColumns) =>
    supabase
      .from(REMINDER_LOG_TABLE)
      .select(selectColumns)
      .eq("user_id", userId)
      .order("sent_at", { ascending: false })
      .limit(limit)

  const { data, error } = await buildQuery(selectWithReason)
  if (!error) return data || []

  const { data: fallbackData, error: fallbackError } = await buildQuery(selectFallback)
  if (fallbackError) throw new Error(fallbackError.message)

  return (fallbackData || []).map((row) => ({
    ...row,
    schedule_name: null,
    error_message: null,
  }))
}
