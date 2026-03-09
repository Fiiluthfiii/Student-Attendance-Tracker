import supabase from "./supabaseClient"

const REMINDER_TABLE = "reminder_settings"

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
  const { error } = await supabase.functions.invoke("send-reminder-test", {
    body: { toEmail },
  })

  if (error) throw new Error(error.message)
}

