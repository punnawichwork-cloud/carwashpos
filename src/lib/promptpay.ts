import generatePayload from 'promptpay-qr'
import QRCode from 'qrcode'

/** Build the EMVCo PromptPay payload string for a shop id + amount. */
export function buildPromptPayPayload(promptpayId: string, amount: number): string {
  return generatePayload(promptpayId, { amount })
}

/** Render a PromptPay QR to a PNG data-URL for <img src>. */
export async function generatePromptPayQR(promptpayId: string, amount: number): Promise<string> {
  const payload = buildPromptPayPayload(promptpayId, amount)
  return QRCode.toDataURL(payload, {
    margin: 0,
    width: 420,
    errorCorrectionLevel: 'M',
    color: { dark: '#0B1220', light: '#ffffff' },
  })
}
