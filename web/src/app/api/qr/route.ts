import { Buffer } from 'node:buffer';
import QRCode from 'qrcode';
import sharp from 'sharp';

export const runtime = 'nodejs';

function logoMark(x: number, y: number, size: number) {
  const scale = size / 100;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <circle cx="50" cy="50" r="48" fill="#080807" stroke="#ffffff" stroke-width="8"/>
    <path d="M75 23 A37 37 0 1 0 75 77" fill="none" stroke="#FFB800" stroke-width="8" stroke-linecap="round"/>
    <path d="M65 35 A21 21 0 1 0 65 65" fill="none" stroke="#FFB800" stroke-width="7" stroke-linecap="round"/>
    <path d="M51 50 H79 M69 39 L80 50 L69 61" fill="none" stroke="#FFB800" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function barcode() {
  const widths = [3, 8, 3, 5, 10, 3, 7, 4, 3, 9, 5, 3, 8, 4, 6, 3, 9, 3, 5, 8, 3, 6, 10, 3, 5];
  let x = 0;
  return widths.map((width, index) => {
    const result = index % 2 === 0 ? `<rect x="${x}" y="0" width="${width}" height="54" fill="#080807"/>` : '';
    x += width;
    return result;
  }).join('');
}

async function ticketSvg(target: string) {
  const qr = await QRCode.toString(target, { type: 'svg', margin: 2, errorCorrectionLevel: 'H', color: { dark: '#080807', light: '#FFFFFF' } });
  const embeddedQr = qr.replace('<svg ', '<svg x="680" y="105" width="460" height="460" ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
    <rect width="1200" height="700" fill="#f1eee7"/>
    <rect x="18" y="18" width="1164" height="664" rx="38" fill="#ffffff" stroke="#080807" stroke-width="2" stroke-dasharray="8 9"/>
    <path d="M625 42 V658" stroke="#aaa49a" stroke-width="2" stroke-dasharray="7 9"/>
    <circle cx="625" cy="18" r="17" fill="#f1eee7"/><circle cx="625" cy="682" r="17" fill="#f1eee7"/>
    <g transform="translate(72 68)">${logoMark(0, 0, 76)}
      <text x="96" y="31" font-family="Arial, sans-serif" font-size="25" font-weight="800" letter-spacing="3" fill="#080807">CRISDAL</text>
      <text x="96" y="55" font-family="Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="5" fill="#9a6800">AGENCY</text>
    </g>
    <text x="72" y="218" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="4" fill="#8c867d">DIGITAL BOARDING PASS</text>
    <text x="72" y="282" font-family="Arial, sans-serif" font-size="52" font-weight="900" letter-spacing="-2" fill="#080807">BROCHURE</text>
    <text x="72" y="330" font-family="Arial, sans-serif" font-size="52" font-weight="900" letter-spacing="-2" fill="#080807">CRISDAL</text>
    <rect x="72" y="365" width="96" height="8" rx="4" fill="#FFB800"/>
    <text x="72" y="435" font-family="Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="2" fill="#8c867d">DESTINO</text>
    <text x="72" y="466" font-family="Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="1" fill="#080807">CRECER CON ORDEN</text>
    <text x="330" y="435" font-family="Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="2" fill="#8c867d">ACCESO</text>
    <text x="330" y="466" font-family="Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="1" fill="#080807">INMEDIATO</text>
    <g transform="translate(72 552)">${barcode()}</g>
    <text x="72" y="630" font-family="Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="2.4" fill="#080807">SCAN · DISCOVER · CREATE</text>
    <text x="655" y="72" font-family="Arial, sans-serif" font-size="10" font-weight="800" letter-spacing="3" fill="#8c867d">ESCANEA PARA ABRIR</text>
    ${embeddedQr}
    ${logoMark(865, 290, 90)}
    <text x="910" y="612" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="#080807">CRISDALAGENCY</text>
    <text x="910" y="638" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" letter-spacing="2" fill="#8c867d">LIMA · PERÚ</text>
  </svg>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') === 'png' ? 'png' : 'svg';
  const preview = url.searchParams.get('preview') === '1';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const target = `${siteUrl.replace(/\/$/, '')}/brochure`;
  const svg = await ticketSvg(target);
  const disposition = preview ? 'inline' : `attachment; filename="qr-brochure-crisdal.${format}"`;

  if (format === 'png') {
    const body = await sharp(Buffer.from(svg, 'utf8'), { density: 180 }).png().toBuffer();
    return new Response(new Uint8Array(body), { headers: { 'Content-Type': 'image/png', 'Content-Disposition': disposition, 'Cache-Control': 'public, max-age=3600' } });
  }
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Content-Disposition': disposition, 'Cache-Control': 'public, max-age=3600' } });
}
