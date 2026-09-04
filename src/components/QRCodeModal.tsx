import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, ExternalLink, Smartphone } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  joinUrl: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  joinUrl,
}) => {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(joinUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => setQrSrc(url))
      .catch(err => console.error('Failed to generate QR code', err));
  }, [isOpen, joinUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      id="qr-code-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="qr-code-modal-container"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all"
        onClick={e => e.stopPropagation()}
      >
        <button
          id="qr-code-modal-close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Smartphone className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Scan to Join & Vote</h3>
          <p className="mt-1 text-sm text-slate-550">
            Attendees can point their smartphone camera at this QR code to join instantly and select their member firm.
          </p>

          <div className="my-5 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4">
            {qrSrc ? (
              <img
                src={qrSrc}
                alt="Scan QR code to join poll"
                className="h-60 w-60 rounded-lg shadow-sm"
              />
            ) : (
              <div className="flex h-60 w-60 items-center justify-center text-slate-400 text-sm">
                Generating QR code...
              </div>
            )}
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span>Room PIN:</span>
              <span className="rounded-md bg-slate-900 px-3 py-1 font-mono text-base tracking-widest text-white">
                {roomCode}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              id="copy-join-link-btn"
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:bg-slate-100 transition"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">Link copied to clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-500" />
                  <span>Copy Direct Join Link</span>
                </>
              )}
            </button>

            <a
              id="open-voter-tab-btn"
              href={joinUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 active:bg-indigo-800 transition"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open Participant View in New Tab</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
