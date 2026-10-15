import React from 'react';
import { createPortal } from 'react-dom';
import { X, QrCode, Printer, Download, ExternalLink } from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { Plot } from '../../types/melon';

interface QRCodeModalProps {
  plot: Plot | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ plot, isOpen, onClose }) => {
  const { language, t } = useI18n();

  if (!isOpen || !plot) return null;

  const modalElement = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50"
      style={{ zIndex: 99999 }}
    >
      <div 
        className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center relative"
        style={{ zIndex: 100000 }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">{t('qrCodeTitle')}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-6 flex flex-col items-center">
          {/* Simulated Authentic QR Code Vector */}
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-sm inline-block">
            <svg viewBox="0 0 160 160" width="160" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Corner position squares */}
              <rect x="10" y="10" width="40" height="40" stroke="#14532D" strokeWidth="8" fill="white" />
              <rect x="22" y="22" width="16" height="16" fill="#14532D" />

              <rect x="110" y="10" width="40" height="40" stroke="#14532D" strokeWidth="8" fill="white" />
              <rect x="122" y="22" width="16" height="16" fill="#14532D" />

              <rect x="10" y="110" width="40" height="40" stroke="#14532D" strokeWidth="8" fill="white" />
              <rect x="22" y="122" width="16" height="16" fill="#14532D" />

              {/* Data pattern modules */}
              <g fill="#164e22">
                <rect x="60" y="15" width="8" height="8" />
                <rect x="75" y="15" width="8" height="8" />
                <rect x="90" y="25" width="8" height="8" />
                <rect x="60" y="35" width="8" height="8" />
                <rect x="75" y="45" width="8" height="8" />
                
                <rect x="15" y="65" width="8" height="8" />
                <rect x="30" y="65" width="8" height="8" />
                <rect x="45" y="75" width="8" height="8" />
                <rect x="15" y="85" width="8" height="8" />

                <rect x="60" y="65" width="12" height="12" />
                <rect x="80" y="70" width="10" height="10" />
                <rect x="70" y="85" width="14" height="8" />

                <rect x="110" y="65" width="8" height="8" />
                <rect x="130" y="75" width="8" height="8" />
                <rect x="140" y="90" width="8" height="8" />

                <rect x="60" y="115" width="8" height="8" />
                <rect x="75" y="125" width="8" height="8" />
                <rect x="90" y="115" width="8" height="8" />
                <rect x="110" y="120" width="8" height="8" />
                <rect x="130" y="130" width="8" height="8" />
                <rect x="140" y="115" width="8" height="8" />
              </g>

              {/* Center Melon Mini Emblem */}
              <circle cx="80" cy="80" r="12" fill="#EAF5EC" stroke="#164e22" strokeWidth="2" />
              <circle cx="80" cy="80" r="7" fill="#FFA726" />
            </svg>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-bold text-slate-900">{plot.name}</h4>
            <p className="text-xs text-emerald-700 font-semibold font-mono">
              {plot.qrCodeId}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              {t('scanNotice')}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('printQR')}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#164e22] text-white rounded-xl text-xs font-bold hover:bg-[#123e1b]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalElement, document.body)
    : modalElement;
};
