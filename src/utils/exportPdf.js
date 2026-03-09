import { jsPDF } from "jspdf"

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

const getImageDataUrl = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Gagal mengambil gambar")
  const blob = await response.blob()
  return blobToDataUrl(blob)
}

export const exportAttendancePdf = async (rows) => {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text("Attendance Report", 14, 18)

  doc.setFontSize(10)
  let y = 28

  if (!rows.length) {
    doc.text("No data available", 14, y)
  }

  for (let idx = 0; idx < rows.length; idx += 1) {
    const item = rows[idx]

    if (y > 250) {
      doc.addPage()
      y = 18
    }

    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(12, y - 4, 186, 52, 2, 2)
    doc.text(`${idx + 1}. ${item.matkul}`, 16, y + 2)
    doc.text(`Tanggal: ${item.tanggal}  Jam: ${item.jam}`, 16, y + 9)
    doc.text(`Mode: ${item.mode}  Ruangan: ${item.ruangan || "-"}`, 16, y + 16)
    doc.text(`Catatan: ${item.catatan || "-"}`, 16, y + 23)

    if (item.foto_url) {
      try {
        const imageDataUrl = await getImageDataUrl(item.foto_url)
        const format = imageDataUrl.includes("image/png") ? "PNG" : "JPEG"
        doc.addImage(imageDataUrl, format, 128, y, 64, 40)
      } catch {
        doc.text("Foto tidak dapat dimuat", 128, y + 8)
      }
    } else {
      doc.text("Tanpa foto", 128, y + 8)
    }

    y += 58
  }

  doc.save(`attendance-${new Date().toISOString().slice(0, 10)}.pdf`)
}
