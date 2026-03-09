import { useEffect, useRef, useState } from "react"

function QRScanner({ onCapture, onError }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isStarting, setIsStarting] = useState(true)
  const [facingMode, setFacingMode] = useState("environment")

  useEffect(() => {
    let mounted = true

    const stopStream = () => {
      if (!streamRef.current) return
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    const startCamera = async () => {
      if (mounted) setIsStarting(true)
      if (!navigator.mediaDevices?.getUserMedia) {
        onError?.("Browser tidak mendukung akses kamera.")
        setIsStarting(false)
        return
      }

      try {
        stopStream()
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: false,
        })

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        onError?.("")
      } catch (err) {
        const detail = err?.message || "Izin kamera ditolak atau kamera sedang dipakai aplikasi lain."
        onError?.(`Gagal membuka kamera: ${detail}`)
      } finally {
        if (mounted) setIsStarting(false)
      }
    }

    startCamera()

    return () => {
      mounted = false
      stopStream()
    }
  }, [facingMode, onError])

  const handleCapture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) {
      onError?.("Kamera belum siap. Coba lagi.")
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      onError?.("Gagal memproses frame kamera.")
      return
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onError?.("Gagal mengambil foto dari kamera.")
          return
        }
        const file = new File([blob], `kamera-${Date.now()}.jpg`, { type: "image/jpeg" })
        onCapture?.(file)
      },
      "image/jpeg",
      0.92
    )
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        <video ref={videoRef} className="w-full min-h-[260px] max-h-[420px] object-cover" playsInline muted />
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn-ghost" onClick={handleCapture} disabled={isStarting}>
          {isStarting ? "Menyiapkan Kamera..." : "Ambil Foto"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
          disabled={isStarting}
        >
          {facingMode === "environment" ? "Kamera Depan" : "Kamera Belakang"}
        </button>
      </div>
      <p className="text-xs text-slate-500">Ambil foto langsung dari kamera web untuk lampiran kehadiran.</p>
    </div>
  )
}

export default QRScanner
