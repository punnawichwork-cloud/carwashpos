export type CsvValue = string | number | null | undefined

function escapeCell(v: CsvValue): string {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

/**
 * Build a CSV string and trigger a browser download.
 * Prepends a UTF-8 BOM so Thai text opens correctly in Excel.
 */
export function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]): void {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','))
  const csv = '﻿' + lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
