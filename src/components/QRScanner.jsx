import { useEffect } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"

function QRScanner({ onScanSuccess }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 220, height: 220 } },
      false
    )

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText)
        scanner.clear().catch(() => {})
      },
      () => {}
    )

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [onScanSuccess])

  return <div id="qr-reader" className="w-full" />
}

export default QRScanner
