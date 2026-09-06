import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, ExternalLink } from 'lucide-react';
import type { ARCard } from '../types';

interface QRCodeModalProps {
  card: ARCard;
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  card,
  isOpen,
  onClose,
  theme,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const viewUrl = `${window.location.origin}?view=${card.id}`;

  useEffect(() => {
    if (isOpen && card) {
      QRCode.toDataURL(viewUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0A0A0C',
          light: '#FFFFFF',
        },
      }).then(setQrDataUrl);
    }
  }, [isOpen, card, viewUrl]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(viewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${card.title.replace(/\s+/g, '_')}_QR.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-md rounded-2xl p-6 border shadow-2xl transition-all ${
          isDark
            ? 'bg-[#131316] border-[#D4AF37]/30 text-[#E5E2E3]'
            : 'bg-[#FBFBFA] border-[#D4AF37]/40 text-[#1A1A1A]'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-500/20 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4AF37]">
            Printable AR Target
          </span>
          <h3 className="font-serif-luxury text-2xl font-bold mt-1">
            {card.title}
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Print this QR on the back of your card or share the direct link.
          </p>
        </div>

        <div className="flex justify-center p-5 bg-white rounded-xl shadow-inner border border-neutral-200 mx-auto max-w-[260px]">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="WebAR QR Code" className="w-full h-auto rounded" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-neutral-400 text-sm">
              Generating...
            </div>
          )}
        </div>

        <div
          className={`flex items-center justify-between gap-2 mt-5 p-3 rounded-lg text-xs border ${
            isDark
              ? 'bg-neutral-900/90 border-neutral-800 text-neutral-300'
              : 'bg-white border-neutral-300 text-neutral-700'
          }`}
        >
          <span className="truncate select-all">{viewUrl}</span>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#D4AF37] text-neutral-950 font-semibold hover:brightness-110 transition-all shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleDownloadQR}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border font-semibold text-xs transition-all ${
              isDark
                ? 'border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 text-[#D4AF37]'
                : 'border-[#D4AF37] hover:bg-[#D4AF37]/10 text-neutral-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>

          <a
            href={viewUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Launch Viewer</span>
          </a>
        </div>
      </div>
    </div>
  );
};
