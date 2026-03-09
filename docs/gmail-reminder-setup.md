# Setup Pengingat Gmail (Supabase)

## 1) Jalankan SQL tabel pengaturan
Buka Supabase SQL Editor, lalu jalankan file:
- `supabase/email_reminder_setup.sql`

## 2) Siapkan provider email
Contoh paling mudah: Resend.

Set environment variables di project Supabase:
- `RESEND_API_KEY` = API key dari Resend
- `REMINDER_FROM_EMAIL` = sender email yang sudah diverifikasi di Resend

## 3) Deploy Edge Function
Deploy fungsi test:
- `supabase functions deploy send-reminder-test`

Deploy fungsi scheduler:
- `supabase functions deploy send-schedule-reminders`

Pastikan juga env bawaan tersedia:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 4) Aktifkan scheduler otomatis
Bisa pakai pg_cron atau external cron (GitHub Actions / cron-job.org).

Contoh pg_cron setiap 1 menit:
```sql
select cron.schedule(
  'send-schedule-reminders-every-minute',
  '* * * * *',
  $$
  select
    net.http_post(
      url := 'https://<PROJECT-REF>.functions.supabase.co/send-schedule-reminders',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```

Ganti `<PROJECT-REF>` dengan project ref Supabase kamu.

## 5) Pakai dari aplikasi
Di halaman `Pengingat`:
1. Isi Gmail tujuan
2. Atur menit sebelum kelas
3. Aktifkan pengingat
4. Klik `Kirim Email Test`

Jika test berhasil, email reminder otomatis akan dikirim sesuai jadwal.
