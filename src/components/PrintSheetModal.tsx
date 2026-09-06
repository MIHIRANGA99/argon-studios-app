import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, Sparkles, Scissors, Layers, CheckCircle2 } from 'lucide-react';
import type { ARCard } from '../types';

interface PrintSheetModalProps {
  card: ARCard;
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

type SheetSize = '5x7' | 'A5' | 'business';
type LayoutMode = 'single' | 'double';

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  card,
  isOpen,
  onClose,
  theme
}) => {
  const isDark = theme === 'dark';
  const [size, setSize] = useState<SheetSize>(card.type === 'business' ? 'business' : '5x7');
  const [layout, setLayout] = useState<LayoutMode>('single');
  const [showCropMarks, setShowCropMarks] = useState(true);
  const [showBleed, setShowBleed] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Generate High-Res QR Code for Print (1024x1024, High Error Correction)
  useEffect(() => {
    if (!isOpen) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://argonstudios.app';
    const viewUrl = `${origin}/?view=${encodeURIComponent(card.id)}`;

    QRCode.toDataURL(viewUrl, {
      width: 1024,
      margin: 1,
      color: {
        dark: '#0A0A0C',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    }).then((url) => setQrDataUrl(url));
  }, [card.id, isOpen]);

  if (!isOpen) return null;

  // Aspect Ratios and Dimensions for Preview
  const getDimensions = () => {
    switch (size) {
      case 'business':
        return { aspect: 'aspect-[3.5/2]', label: '3.5" × 2" (Standard Business Card)', mm: '89 × 51 mm' };
      case 'A5':
        return { aspect: 'aspect-[148/210]', label: 'A5 (148 × 210 mm Stationery)', mm: '148 × 210 mm' };
      case '5x7':
      default:
        return { aspect: 'aspect-[5/7]', label: '5" × 7" (127 × 178 mm Luxury Invitation)', mm: '127 × 178 mm' };
    }
  };

  const dim = getDimensions();

  // Print Dialog trigger
  const handlePrint = () => {
    window.print();
  };

  // High-Res Canvas PNG Download (300 DPI simulation)
  const handleDownloadPNG = async () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 300 DPI Canvas sizes
      const widthPx = size === 'business' ? 1050 : size === 'A5' ? 1748 : 1500;
      const heightPx = size === 'business' ? 600 : size === 'A5' ? 2480 : 2100;

      canvas.width = widthPx;
      canvas.height = heightPx;

      // Fill white paper background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, widthPx, heightPx);

      // Draw Artwork
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = card.targetImageUrl;

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      ctx.drawImage(img, 0, 0, widthPx, heightPx);

      // If single-sided, draw Corner QR overlay
      if (layout === 'single' && qrDataUrl) {
        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((resolve) => {
          qrImg.onload = resolve;
          qrImg.onerror = resolve;
        });

        const qrSize = Math.min(widthPx, heightPx) * 0.22;
        const padding = qrSize * 0.12;
        const boxX = widthPx - qrSize - padding * 2;
        const boxY = heightPx - qrSize - padding * 2;

        // Luxury badge background
        ctx.fillStyle = 'rgba(10, 10, 12, 0.9)';
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, qrSize + padding * 2, qrSize + padding * 2, 24);
        ctx.fill();
        ctx.stroke();

        // Draw QR
        ctx.drawImage(qrImg, boxX + padding, boxY + padding, qrSize, qrSize);
      }

      // Draw Crop Marks (if enabled)
      if (showCropMarks) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        const markLen = 40;
        const offset = 30;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(offset, 0); ctx.lineTo(offset, markLen);
        ctx.moveTo(0, offset); ctx.lineTo(markLen, offset);
        // Top-right
        ctx.moveTo(widthPx - offset, 0); ctx.lineTo(widthPx - offset, markLen);
        ctx.moveTo(widthPx, offset); ctx.lineTo(widthPx - markLen, offset);
        // Bottom-left
        ctx.moveTo(offset, heightPx); ctx.lineTo(offset, heightPx - markLen);
        ctx.moveTo(0, heightPx - offset); ctx.lineTo(markLen, heightPx - offset);
        // Bottom-right
        ctx.moveTo(widthPx - offset, heightPx); ctx.lineTo(widthPx - offset, heightPx - markLen);
        ctx.moveTo(widthPx, heightPx - offset); ctx.lineTo(widthPx - markLen, heightPx - offset);
        ctx.stroke();
      }

      // Trigger download
      const link = document.createElement('a');
      link.download = `argon-print-${card.id}-${size}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${
          isDark ? 'bg-[#121215] border-[#D4AF37]/40 text-white' : 'bg-white border-[#D4AF37]/50 text-neutral-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-700/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-luxury text-xl font-bold tracking-wide">
                  Print Sheet &amp; Bleed Generator
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  300 DPI Ready
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Commercial print layouts with trim marks, 3mm bleed margins, and precision scannable QR codes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Settings on Left, Live Print Sheet on Right */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Controls Column */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. Paper Format */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>1. Paper Size &amp; Format</span>
              </label>
              <div className="space-y-2">
                {([
                  { id: '5x7', label: '5" × 7" Invitation', desc: '127 × 178 mm • Luxury Wedding' },
                  { id: 'A5', label: 'A5 Stationery', desc: '148 × 210 mm • Greeting & Gala' },
                  { id: 'business', label: 'Business Card', desc: '3.5" × 2" (89 × 51 mm) • VIP Networking' }
                ] as const).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSize(fmt.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      size === fmt.id
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white gold-glow'
                        : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-200">{fmt.label}</div>
                      <div className="text-[10px] text-neutral-400">{fmt.desc}</div>
                    </div>
                    {size === fmt.id && <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Layout Mode */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-2">
                2. Layout Arrangement
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setLayout('single')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    layout === 'single'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] font-bold'
                      : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div>Single-Sided</div>
                  <div className="text-[10px] font-normal text-neutral-400 mt-0.5">Corner QR Badge</div>
                </button>
                <button
                  type="button"
                  onClick={() => setLayout('double')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    layout === 'double'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] font-bold'
                      : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div>Two-Sided</div>
                  <div className="text-[10px] font-normal text-neutral-400 mt-0.5">Clean Front + Back QR</div>
                </button>
              </div>
            </div>

            {/* 3. Print Shop Toggles */}
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3 text-xs">
              <span className="font-bold text-neutral-200 block text-[11px] uppercase tracking-wider">
                Print Shop Production Options
              </span>

              <label className="flex items-center justify-between cursor-pointer text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Corner Crop / Trim Marks</span>
                </span>
                <input
                  type="checkbox"
                  checked={showCropMarks}
                  onChange={(e) => setShowCropMarks(e.target.checked)}
                  className="rounded accent-[#D4AF37]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-neutral-300">
                <span>Include 3mm Bleed Zone</span>
                <input
                  type="checkbox"
                  checked={showBleed}
                  onChange={(e) => setShowBleed(e.target.checked)}
                  className="rounded accent-[#D4AF37]"
                />
              </label>
            </div>

            {/* Export Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-950 font-bold text-xs shadow-lg gold-glow hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>

              <button
                onClick={handleDownloadPNG}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 text-[#D4AF37] font-semibold text-xs transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating 300 DPI Sheet...' : 'Download 300 DPI PNG'}</span>
              </button>
            </div>
          </div>

          {/* Live Print Sheet Preview Column */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center p-6 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 overflow-hidden">
            <div className="text-center mb-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
                Live Print Sheet Preview ({dim.mm})
              </span>
              <p className="text-[10px] text-neutral-400">
                {showBleed ? 'Outer border represents 3mm bleed line' : 'Trim boundary'}
              </p>
            </div>

            {/* Simulated Paper Sheet */}
            <div
              ref={printContainerRef}
              className={`relative w-full max-w-[420px] ${dim.aspect} bg-white shadow-2xl transition-all duration-300 overflow-hidden ${
                showBleed ? 'p-2.5 bg-neutral-200' : ''
              }`}
            >
              {/* Corner Crop Marks */}
              {showCropMarks && (
                <>
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-black z-30 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-black z-30 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-black z-30 pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-black z-30 pointer-events-none" />
                </>
              )}

              {/* Layout Content */}
              {layout === 'single' ? (
                /* Single-Sided: Full Artwork with Corner Luxury QR */
                <div className="relative w-full h-full overflow-hidden bg-neutral-900">
                  <img
                    src={card.targetImageUrl}
                    alt="Card Artwork"
                    className="w-full h-full object-cover"
                  />

                  {/* Corner Luxury QR Badge */}
                  {qrDataUrl && (
                    <div className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/85 backdrop-blur-md border border-[#D4AF37] shadow-xl flex items-center gap-2 max-w-[170px]">
                      <img src={qrDataUrl} alt="QR Code" className="w-12 h-12 rounded-lg bg-white p-0.5" />
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>ARGON AR</span>
                        </span>
                        <span className="text-[7px] text-neutral-300 leading-tight font-medium">
                          Scan with camera to reveal 3D video
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Two-Sided: Luxury Backside Preview with Centered QR */
                <div className="relative w-full h-full bg-[#0A0A0C] border border-[#D4AF37]/40 p-6 flex flex-col items-center justify-between text-center text-white">
                  <div className="flex flex-col items-center gap-1.5 pt-4">
                    <img src="/brand/logo_2d.jpg" alt="Logo" className="w-8 h-8 rounded-lg border border-[#D4AF37]/50" />
                    <span className="font-serif-luxury text-sm font-bold text-[#D4AF37] tracking-wider">
                      ARGON STUDIOS
                    </span>
                    <span className="text-[8px] tracking-[0.2em] uppercase text-neutral-400">
                      Spatial Print Experience
                    </span>
                  </div>

                  {/* Centered Large QR Code */}
                  <div className="flex flex-col items-center gap-2">
                    {qrDataUrl && (
                      <div className="p-3 rounded-2xl bg-white shadow-2xl border-2 border-[#D4AF37]">
                        <img src={qrDataUrl} alt="QR Code" className="w-28 h-28" />
                      </div>
                    )}
                    <h4 className="font-serif-luxury text-xs font-bold text-white tracking-wide max-w-[200px] truncate">
                      {card.title}
                    </h4>
                    <span className="text-[8px] text-neutral-400 font-medium">
                      Point phone camera at this QR code or front artwork
                    </span>
                  </div>

                  <div className="text-[7px] text-neutral-500 pb-2">
                    © {new Date().getFullYear()} ARGON Studios • Handcrafted Spatial Print Excellence
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}