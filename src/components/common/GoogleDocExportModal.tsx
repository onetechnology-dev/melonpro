import React, { useState, useEffect } from 'react';
import { useI18n } from '../../locales/i18nContext';
import { googleSignIn, initAuth, logoutGoogle, getAccessToken } from '../../services/googleAuth';
import { createInvoiceGoogleDoc, GoogleDocExportResult } from '../../services/googleDocsService';
import { User } from 'firebase/auth';
import { 
  FileText, 
  ExternalLink, 
  Check, 
  Copy, 
  AlertCircle, 
  X, 
  Sparkles, 
  Download,
  Loader2
} from 'lucide-react';

interface GoogleDocExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDocExportModal: React.FC<GoogleDocExportModalProps> = ({ isOpen, onClose }) => {
  const { language } = useI18n();

  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<GoogleDocExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setHasToken(!!token);
      },
      () => {
        setUser(null);
        setHasToken(false);
      }
    );

    // Also check token immediately if user already signed in this session
    getAccessToken().then(tok => {
      if (tok) setHasToken(true);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setHasToken(true);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setErrorMessage(err?.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleExportToGoogleDoc = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setExportResult(null);
    try {
      const result = await createInvoiceGoogleDoc();
      setExportResult(result);
    } catch (err: any) {
      console.error('Export failed:', err);
      if (err?.message?.includes('Not authenticated') || err?.message?.includes('401')) {
        setHasToken(false);
        setErrorMessage('Authentication expired. Please sign in again.');
      } else {
        setErrorMessage(err?.message || 'Failed to create Google Doc. Please check permissions.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    if (!exportResult?.documentUrl) return;
    navigator.clipboard.writeText(exportResult.documentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-5 bg-linear-to-r from-[#164e22] to-[#1e6b30] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {language === 'km' ? 'នាំចេញជាឯកសារ Google Docs' : 'Export to Google Docs'}
              </h2>
              <p className="text-xs text-emerald-100">
                {language === 'km' 
                  ? 'បង្កើតឯកសារវិក្កយបត្រ និងបញ្ជីមុខងារពេញលេញនៅលើ Google Drive របស់អ្នក' 
                  : 'Generate complete project invoice & feature list in your Google Drive'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{language === 'km' ? 'មានបញ្ហា' : 'Notice'}</p>
                <p className="text-xs mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Box when generated */}
          {exportResult && (
            <div className="p-5 bg-emerald-50 border-2 border-emerald-500/40 rounded-xl space-y-3 animate-in zoom-in-95">
              <div className="flex items-center gap-2.5 text-emerald-800">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">
                    {language === 'km' ? 'ឯកសារ Google Docs ត្រូវបានបង្កើតដោយជោគជ័យ!' : 'Google Doc Successfully Created!'}
                  </h4>
                  <p className="text-xs text-emerald-700">
                    {language === 'km' ? 'ឯកសារត្រូវបានរក្សាទុកក្នុង Google Drive របស់អ្នក' : 'Document has been saved to your Google Drive'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-200 text-xs font-mono text-slate-700 truncate select-all">
                {exportResult.documentUrl}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={exportResult.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{language === 'km' ? 'បើកឯកសារ Google Docs ឥឡូវនេះ' : 'Open in Google Docs'}</span>
                </a>

                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg shadow-xs transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? (language === 'km' ? 'បានចម្លង!' : 'Copied!') : (language === 'km' ? 'ចម្លងតំណ' : 'Copy Link')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Document Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {language === 'km' ? 'ទិដ្ឋភាពទូទៅនៃឯកសារ' : 'Document Contents Preview'}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-full">
                17 Modules • ERP & Farm Management Breakdown
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 font-sans leading-relaxed">
              <p className="font-semibold text-slate-800">
                📄 MelonPro Smart Farm & Commercial ERP Management System — Scope & Invoice
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-600">
                <li><strong className="text-slate-700">Module 1:</strong> Executive Dashboard, Status KPIs & 8-Stage Botanical Melon Bar</li>
                <li><strong className="text-slate-700">Module 2:</strong> Crop Planning, Variety Management & Geometry Density Calculator</li>
                <li><strong className="text-slate-700">Module 3:</strong> Crop Calendar & Interactive Milestone Workflow Scheduler</li>
                <li><strong className="text-slate-700">Module 4:</strong> Farm Work Order & Task Management (Kanban Board & List)</li>
                <li><strong className="text-slate-700">Module 5:</strong> GIS Interactive Greenhouse Mapping & Plot Polygon Vertex Editor</li>
                <li><strong className="text-slate-700">Module 6:</strong> Crop Health Scouting, Refractometer Brix Sugar Tracker & Sensors</li>
                <li><strong className="text-slate-700">Module 7:</strong> Harvest Yield Weight Grading & Batch QR Code Traceability</li>
                <li><strong className="text-slate-700">Module 8:</strong> Chemical Spray, Fertigation & CamGAP Compliance Logbook</li>
                <li><strong className="text-slate-700">Module 9:</strong> Agrometeorology Live Weather & Agricultural Economics Analytics</li>
                <li><strong className="text-slate-700">Module 10:</strong> Bilingual Khmer/English Localization & Botanical Vector Branding</li>
                <li><strong className="text-emerald-700">Module 11:</strong> Stock & Inventory Management (Multi-Warehouse SKU Tracking)</li>
                <li><strong className="text-emerald-700">Module 12:</strong> Purchase Stock & Supplier Procurement Engine</li>
                <li><strong className="text-emerald-700">Module 13:</strong> Sales Invoicing, Commercial Distribution & Official Receipts</li>
                <li><strong className="text-emerald-700">Module 14:</strong> Farmer & Agronomy Team Operations Management</li>
                <li><strong className="text-emerald-700">Module 15:</strong> Customer CRM & Supermarket Contracts</li>
                <li><strong className="text-emerald-700">Module 16:</strong> Supplier & Agri-Input Vendor Directory</li>
                <li><strong className="text-emerald-700">Module 17:</strong> Financial Accounts, Cash Flow Ledger & P&L Engine</li>
              </ul>
            </div>
          </div>

          {/* User Sign-in / Export Action Area */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {language === 'km' ? 'ការតភ្ជាប់ជាមួយ Google' : 'Google Account Connection'}
            </h4>

            {user && hasToken ? (
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-slate-300" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{user.displayName || 'Google User'}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await logoutGoogle();
                    setUser(null);
                    setHasToken(false);
                    setExportResult(null);
                  }}
                  className="text-xs text-slate-500 hover:text-red-600 transition-colors"
                >
                  {language === 'km' ? 'ចាកចេញ' : 'Switch Account'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-3 space-y-2">
                <p className="text-xs text-slate-500 text-center max-w-sm">
                  {language === 'km' 
                    ? 'សូមចូលគណនី Google ដើម្បីបង្កើតឯកសារ Google Docs ក្នុង Google Drive របស់អ្នកដោយផ្ទាល់'
                    : 'Sign in with your Google account to create and save this Google Doc directly into your Google Drive.'}
                </p>

                {/* Standard Material Sign-in with Google Button as required by SKILL.md */}
                <button 
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-xs text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isLoggingIn ? (language === 'km' ? 'កំពុងចូល...' : 'Signing in...') : (language === 'km' ? 'ចូលជាមួយ Google' : 'Sign in with Google')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            {language === 'km' ? 'បិទ' : 'Close'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportToGoogleDoc}
              disabled={isExporting || !hasToken}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${
                hasToken && !isExporting
                  ? 'bg-[#164e22] hover:bg-[#123e1b] text-white hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{language === 'km' ? 'កំពុងបង្កើត Google Doc...' : 'Creating Google Doc...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>{language === 'km' ? 'បង្កើត និងរក្សាទុក Google Doc' : 'Create & Save to Google Docs'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
