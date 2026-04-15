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
- `supabase functions deploy send-reminder-test --no-verify-jwt --project-ref <PROJECT-REF>`

Deploy fungsi scheduler:
- `supabase functions deploy send-schedule-reminders --no-verify-jwt --project-ref <PROJECT-REF>`

Pastikan juga env bawaan tersedia:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (secret acak untuk pengaman endpoint scheduler)
- `REMINDER_TIMEZONE` (contoh: `Asia/Jakarta`)

## 4) Aktifkan scheduler otomatis
Bisa pakai `pg_cron` + `pg_net` dari SQL Editor Supabase.

Set secret dulu:
```bash
npx supabase@latest secrets set CRON_SECRET="<SECRET-ACAK-YANG-PANJANG>" --project-ref <PROJECT-REF>
npx supabase@latest secrets set REMINDER_TIMEZONE="Asia/Jakarta" --project-ref <PROJECT-REF>
```

Contoh pg_cron setiap 1 menit:
```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- opsional: hapus job lama agar tidak dobel
select cron.unschedule(jobid)
from cron.job
where jobname = 'send-schedule-reminders-every-minute';

select cron.schedule(
  'send-schedule-reminders-every-minute',
  '* * * * *',
  $$
  select
    net.http_post(
      url := 'https://<PROJECT-REF>.functions.supabase.co/send-schedule-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', '<SECRET-ACAK-YANG-PANJANG>'
      ),
      body := '{}'::jsonb
    );
  $$
);
```

Ganti `<PROJECT-REF>` dengan project ref Supabase kamu.

Cek job aktif:
```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'send-schedule-reminders-every-minute';
```

## 5) Pakai dari aplikasi
Di halaman `Pengingat`:
1. Isi Gmail tujuan
2. Atur menit sebelum kelas
3. Aktifkan pengingat
4. Klik `Kirim Email Test`

Jika test berhasil, email reminder otomatis akan dikirim sesuai jadwal.

## Troubleshooting cepat

### Error: `Could not find the table 'public.reminder_settings'`
Penyebab: SQL setup belum dijalankan di project Supabase yang sama dengan `VITE_SUPABASE_URL`.

Solusi:
1. Buka SQL Editor pada project Supabase yang dipakai aplikasi.
2. Jalankan file `supabase/email_reminder_setup.sql`.
3. Verifikasi tabel:
```sql
select * from public.reminder_settings limit 1;
```

### Error: `functions/v1/send-reminder-test` 404 + CORS
Penyebab: Edge Function `send-reminder-test` belum ter-deploy di project tersebut.

Solusi:
1. Deploy function:
```bash
supabase functions deploy send-reminder-test
```
2. Pastikan env function sudah di-set:
`RESEND_API_KEY`, `REMINDER_FROM_EMAIL`.
3. Coba panggil lagi dari halaman `Pengingat`.
