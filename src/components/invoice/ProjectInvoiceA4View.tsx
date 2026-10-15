import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  QrCode, 
  Sparkles, 
  ChevronDown, 
  SlidersHorizontal, 
  Check, 
  Share2, 
  ExternalLink,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  User,
  CreditCard,
  Edit3,
  Plus,
  Trash2,
  BookmarkCheck,
  FileCheck,
  HelpCircle,
  Clock,
  Award
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { createInvoiceGoogleDoc } from '../../services/googleDocsService';
import { GoogleDocExportModal } from '../common/GoogleDocExportModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface InvoiceLineItem {
  id: string;
  itemNo: string;
  moduleEn: string;
  moduleKm: string;
  deliverableScope: string;
  deliverableScopeKm: string;
  category: string;
  rate: number;
  discount: number;
}

export const CATEGORY_PRESETS = [
  'Core System',
  'Agronomy Engine',
  'GIS & Mapping',
  'Quality & Yield',
  'ERP & Commerce',
  'Localization',
  'Hardware & IoT',
  'Custom Service'
];

// Initial Default Deliverable Modules
const DEFAULT_DELIVERABLES: InvoiceLineItem[] = [
  {
    id: 'item-01',
    itemNo: '01',
    moduleEn: 'Core Dashboard & Botanical Stage Pipeline',
    moduleKm: 'ផ្ទាំងគ្រប់គ្រងទូទៅ & បន្ទាត់ពេលវេលានៃការលូតលាស់',
    deliverableScope: 'Interactive executive KPI status cards, 8-stage botanical illustrated growth pipeline, live DAT tracking, stage progress bar, and daily checklist.',
    deliverableScopeKm: 'ផ្ទាំងតាមដានទិន្នន័យកសិកម្មឆ្លាតវៃ បន្ទាត់ដំណាក់កាលលូតលាស់ ៨ ដំណាក់កាល រូបភាព SVG លម្អិត និងកិច្ចការប្រចាំថ្ងៃ។',
    category: 'Core System',
    rate: 1800,
    discount: 0,
  },
  {
    id: 'item-02',
    itemNo: '02',
    moduleEn: 'Crop Planning Engine & Geometry Calculator',
    moduleKm: 'ម៉ាស៊ីនរៀបចំផែនការដាំ & គណនាដង់ស៊ីតេ',
    deliverableScope: 'Variety selection database, greenhouse row layout planning, inter-plant spacing calculator, nursery seedling requirement estimation.',
    deliverableScopeKm: 'ការកំណត់ទំហំរោងដាំ គម្លាតគុម្ព គណនាចំនួនកូនដំណាំ និងតម្រូវការគ្រាប់ពូជដោយស្វ័យប្រវត្តិ។',
    category: 'Agronomy Engine',
    rate: 1200,
    discount: 0,
  },
  {
    id: 'item-03',
    itemNo: '03',
    moduleEn: 'Interactive Crop Calendar & Work Orders',
    moduleKm: 'ប្រតិទិនដំណាំ & ការគ្រប់គ្រងកិច្ចការចំការ',
    deliverableScope: 'Dynamic multi-view calendar (Month/Week/Agenda), color-coded agronomy task categories (fertigation, trellising, pollination, harvest), task modal.',
    deliverableScopeKm: 'ប្រតិទិនដាំដុះឌីជីថល កាលវិភាគស្រោចទឹក ដាក់ជី បង្កាត់ផ្កា និងចាត់ចែងបុគ្គលិកទទួលខុសត្រូវ។',
    category: 'Agronomy Engine',
    rate: 1400,
    discount: 0,
  },
  {
    id: 'item-04',
    itemNo: '04',
    moduleEn: 'GIS Real Field Mapping & Polygon Editor',
    moduleKm: 'ផែនទីចំការ GIS & កែសម្រួលរាងដីលើផ្កាយរណប',
    deliverableScope: 'Google Satellite hybrid maps, interactive polygon boundaries for greenhouses A-D, NDVI simulation, live telemetry and valve status.',
    deliverableScopeKm: 'ផែនទីផ្កាយរណបផ្ទាល់ Google Maps គូររាងរោងកញ្ចក់ វាស់សំណើមដី សីតុណ្ហភាព និងបញ្ជាវ៉ានទឹក។',
    category: 'GIS & Mapping',
    rate: 2200,
    discount: 0,
  },
  {
    id: 'item-05',
    itemNo: '05',
    moduleEn: 'Crop Health, Brix Sugar Monitoring & Telemetry',
    moduleKm: 'តាមដានសុខភាពដំណាំ កម្រិតផ្អែម Brix & ឧបករណ៍ចាប់សញ្ញា',
    deliverableScope: 'Digital Brix refractometer logging (°Bx 12–16), plant vigor rating, pest scouting record, real-time sensor dashboards.',
    deliverableScopeKm: 'កត់ត្រាកម្រិតជាតិស្ករក្នុងផ្លែឪឡឹក (°Brix) តាមដានការលូតលាស់ដើម និងត្រួតពិនិត្យសត្វល្អិត។',
    category: 'Quality & Yield',
    rate: 1300,
    discount: 0,
  },
  {
    id: 'item-06',
    itemNo: '06',
    moduleEn: 'Harvest Yield Grading & Batch QR Traceability',
    moduleKm: 'ប្រមូលផល ចាត់ថ្នាក់ផ្លែ & កូដ QR តាមដានប្រភពដើម',
    deliverableScope: 'Multi-grade sorting (Grade A, B, C, Premium), batch weight logging, yield vs target variance, automated customer QR traceability modal.',
    deliverableScopeKm: 'កត់ត្រាទិន្នផលប្រមូលផលជាក់ស្តែង ចាត់ថ្នាក់ទម្ងន់ផ្លែ និងបង្កើតស្លាក QR Code សម្រាប់អ្នកទិញស្កេនពិនិត្យប្រភពដើម។',
    category: 'Quality & Yield',
    rate: 1600,
    discount: 0,
  },
  {
    id: 'item-07',
    itemNo: '07',
    moduleEn: 'CamGAP / GlobalGAP Compliance Logbook',
    moduleKm: 'កំណត់ត្រាអនុលោមភាពស្តង់ដារ CamGAP / GlobalGAP',
    deliverableScope: 'Chemical application record, Pre-Harvest Interval (PHI) compliance enforcement, Re-entry interval timers, and export-ready logbooks.',
    deliverableScopeKm: 'សៀវភៅកត់ត្រាការប្រើប្រាស់ជី ថ្នាំកសិកម្ម គណនាថ្ងៃផុតកំណត់ថ្នាំមុនពេលបេះ (PHI) តាមស្តង់ដារ GAP។',
    category: 'Quality & Yield',
    rate: 1100,
    discount: 0,
  },
  {
    id: 'item-08',
    itemNo: '08',
    moduleEn: 'Stock Inventory & Multi-Warehouse Tracking',
    moduleKm: 'ស្តុកទំនិញ & គ្រប់គ្រងឃ្លាំងកសិកម្ម',
    deliverableScope: 'Multi-category agricultural warehouse inventory (seeds, fertilizers, bio-controls, packaging, fresh melons), low stock alerts, stock reconciliation.',
    deliverableScopeKm: 'ប្រព័ន្ធគ្រប់គ្រងស្តុកគ្រាប់ពូជ ជី ថ្នាំ និងផ្លែឪឡឹកក្នុងបន្ទប់ត្រជាក់ ព្រមានពេលជិតអស់ស្តុក។',
    category: 'ERP & Commerce',
    rate: 1500,
    discount: 0,
  },
  {
    id: 'item-09',
    itemNo: '09',
    moduleEn: 'Master Item Management & Barcode Labeling',
    moduleKm: 'ការគ្រប់គ្រងមុខទំនិញ & បោះពុម្ពស្លាកបាកូដ',
    deliverableScope: 'Item master catalog, EAN-13 barcode generator, cost vs selling price profit margins, dosage mixing guidelines, thermal label printer.',
    deliverableScopeKm: 'កាតាឡុកទំនិញមេ បង្កើតបាកូដស្វ័យប្រវត្តិ គណនារឹមប្រាក់ចំណេញ (%) និងបោះពុម្ពស្លាកតម្លៃបិទលើកេស។',
    category: 'ERP & Commerce',
    rate: 1400,
    discount: 0,
  },
  {
    id: 'item-10',
    itemNo: '10',
    moduleEn: 'Purchase Stock Orders & Supplier Procurement',
    moduleKm: 'បញ្ជាទិញចូលស្តុក & គ្រប់គ្រងអ្នកផ្គត់ផ្គង់',
    deliverableScope: 'Purchase Order (PO) workflow, supplier contact directory, automated inventory replenishment, and accounts payable registration.',
    deliverableScopeKm: 'ដំណើរការបញ្ជាទិញសម្ភារៈ និងជីពីក្រុមហ៊ុនផ្គត់ផ្គង់ ធ្វើបច្ចុប្បន្នភាពស្តុកដោយស្វ័យប្រវត្តិតាមការទូទាត់។',
    category: 'ERP & Commerce',
    rate: 1200,
    discount: 0,
  },
  {
    id: 'item-11',
    itemNo: '11',
    moduleEn: 'Commercial Sales, Invoices & Customer CRM',
    moduleKm: 'ការលក់ទំនិញ វិក្កយបត្រលក់ & អតិថិជន CRM',
    deliverableScope: 'Supermarket and wholesale B2B invoicing, produce delivery slips, customer directory (Lucky, Chip Mong, AEON), automatic revenue recording.',
    deliverableScopeKm: 'វិក្កយបត្រលក់ជូនផ្សារទំនើប និងអ្នកទិញដុំ បញ្ជីអតិថិជន និងកត់ត្រាការទូទាត់ចំណូលចូលគណនី។',
    category: 'ERP & Commerce',
    rate: 1600,
    discount: 0,
  },
  {
    id: 'item-12',
    itemNo: '12',
    moduleEn: 'Financial Accounts, General Ledger & P&L',
    moduleKm: 'គណនេយ្យហិរញ្ញវត្ថុ សៀវភៅធំ & របាយការណ៍ចំណេញខាត',
    deliverableScope: 'Multi-account management (ABA Bank operating, Cash vault), real-time revenue and expense ledger, cash flow analysis, and internal transfers.',
    deliverableScopeKm: 'គ្រប់គ្រងគណនីធនាគារ ABA និងលុយសុទ្ធ កត់ត្រាចំណូល-ចំណាយ និងគណនាប្រាក់ចំណេញដុលជាក់ស្តែង។',
    category: 'ERP & Commerce',
    rate: 1500,
    discount: 0,
  },
  {
    id: 'item-13',
    itemNo: '13',
    moduleEn: 'Bilingual Localization (Khmer & English) & Vector Assets',
    moduleKm: 'ភាសាពីរ (ខ្មែរ-អង់គ្លេស) & ក្រាហ្វិកគំនូរជីវចល',
    deliverableScope: 'Full Kantumruy Pro dual-language architecture, mobile-responsive layouts, custom botanical SVG illustrations, and print stylesheet.',
    deliverableScopeKm: 'រចនាសម្ព័ន្ធភាសាខ្មែរ និងអង់គ្លេសពេញលេញ អក្សរ Kantumruy Pro គំនូររុក្ខសាស្ត្រឪឡឹក និងទ្រង់ទ្រាយបោះពុម្ព A4។',
    category: 'Localization',
    rate: 1500,
    discount: 0,
  },
];

const DEFAULT_TERMS_NOTE = `តម្លៃសម្រង់ខាងលើនេះមានសុពលភាពរយៈពេល ៣០ ថ្ងៃ គិតចាប់ពីថ្ងៃចេញលិខិតនេះ។ តម្លៃរួមបញ្ចូលការដំឡើងប្រព័ន្ធ ការបណ្តុះបណ្តាលបុគ្គលិក ការធានាប្រព័ន្ធ និងជំនួយបច្ចេកទេសកសិកម្មរៀបចំវដ្តដាំដុះរយៈពេល ១២ ខែពេញ (12-Month Maintenance & SLA Support) ពីក្រុមហ៊ុន ONETECHNOLOGY។ វិក្កយបត្រ/លិខិតសម្រង់តម្លៃនេះជាឯកសារផ្លូវការស្របច្បាប់។`;

const LOCAL_STORAGE_KEY = 'melonpro_quotation_custom_data_v3';

// Sleek ONETECHNOLOGY Modern Vector Logo Component
const OneTechnologyLogo: React.FC<{ className?: string }> = ({ className = "w-14 h-14" }) => (
  <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-2 text-white shadow-md border border-emerald-500/30 ${className}`}>
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="oneTechGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <radialGradient id="techGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="42" fill="url(#techGlow)" />
      {/* Outer Hexagon / Shield Frame */}
      <polygon points="50,6 92,28 92,72 50,94 8,72 8,28" stroke="url(#oneTechGrad)" strokeWidth="5" fill="rgba(16, 185, 129, 0.06)" />
      {/* High-tech numeral '1' monogram */}
      <path d="M42 34 L52 24 L52 74 M38 74 L64 74" stroke="url(#oneTechGrad)" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Tech Circuit Accent Nodes */}
      <circle cx="50" cy="6" r="3.5" fill="#10b981" />
      <circle cx="92" cy="28" r="3" fill="#06b6d4" />
      <circle cx="92" cy="72" r="3" fill="#3b82f6" />
      <circle cx="50" cy="94" r="3.5" fill="#10b981" />
      <circle cx="8" cy="72" r="3" fill="#3b82f6" />
      <circle cx="8" cy="28" r="3" fill="#06b6d4" />
    </svg>
  </div>
);

export const ProjectInvoiceA4View: React.FC = () => {
  const { language } = useI18n();
  const { setActiveTab } = useFarm();
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const printSheetRef = useRef<HTMLDivElement>(null);

  // PDF Generation & Sandbox Protection State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [expandedDeliverableId, setExpandedDeliverableId] = useState<string | null>(null);

  // Helper to load persistent state
  const loadSavedData = () => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse saved quotation data from localStorage:', e);
    }
    return null;
  };

  const savedData = loadSavedData();

  // 1. BRAND & LOGO STATE (Remembered)
  const [brandName, setBrandName] = useState(savedData?.brandName ?? 'ONETECHNOLOGY');
  const [brandTagline, setBrandTagline] = useState(savedData?.brandTagline ?? 'Enterprise Software Solutions & Agronomy Systems');
  const [brandTaglineKm, setBrandTaglineKm] = useState(savedData?.brandTaglineKm ?? 'ស្ថាបត្យកម្មប្រព័ន្ធបច្ចេកវិទ្យា & ដំណោះស្រាយកសិកម្មឆ្លាតវៃ');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(savedData?.customLogoUrl ?? null);

  // 2. QUOTATION METADATA STATE (Remembered)
  const [quotationNumber, setQuotationNumber] = useState(savedData?.quotationNumber ?? 'QT-2026-OT088');
  const [issueDate, setIssueDate] = useState(savedData?.issueDate ?? '2026-10-05');
  const [validUntilDate, setValidUntilDate] = useState(savedData?.validUntilDate ?? '2026-11-04');
  const [paymentTerms, setPaymentTerms] = useState(savedData?.paymentTerms ?? 'Net 30 Days (50% Deposit)');
  const [projectRef, setProjectRef] = useState(savedData?.projectRef ?? 'Turnkey Smart Farm Operating System (MelonPro)');

  // 3. ISSUED BY STATE (ONETECHNOLOGY) (Remembered)
  const [issuerCompany, setIssuerCompany] = useState(savedData?.issuerCompany ?? 'ONETECHNOLOGY CO., LTD.');
  const [issuerCompanyKm, setIssuerCompanyKm] = useState(savedData?.issuerCompanyKm ?? 'ក្រុមហ៊ុន វ័ន ថេកណូឡូជី (ខេមបូឌា) ខូអិលធីឌី');
  const [issuerAddress, setIssuerAddress] = useState(savedData?.issuerAddress ?? '#88 Technology Innovation Tower, Monivong Blvd, Phnom Penh, Cambodia');
  const [issuerTaxId, setIssuerTaxId] = useState(savedData?.issuerTaxId ?? 'VAT TIN: K002-902188410');
  const [issuerEmail, setIssuerEmail] = useState(savedData?.issuerEmail ?? 'contact@onetechnology.com.kh');
  const [issuerPhone, setIssuerPhone] = useState(savedData?.issuerPhone ?? '+855 (0) 23 888 168 / +855 (0) 12 999 168');
  const [signatoryName, setSignatoryName] = useState(savedData?.signatoryName ?? 'Meng Luk');
  const [signatoryTitle, setSignatoryTitle] = useState(savedData?.signatoryTitle ?? 'Authorized Representative / Managing Director');

  // 4. BILLED TO STATE (CLIENT) (Remembered)
  const [clientName, setClientName] = useState(savedData?.clientName ?? 'Green Farm Agro-Industrial Co., Ltd.');
  const [clientNameKm, setClientNameKm] = useState(savedData?.clientNameKm ?? 'ក្រុមហ៊ុន ហ្គ្រីន ហ្វាម អាក្រូ-អ៊ិនដាសស្ទ្រី');
  const [clientAttention, setClientAttention] = useState(savedData?.clientAttention ?? 'Attn: Farm Operations & Project Committee');
  const [clientAddress, setClientAddress] = useState(savedData?.clientAddress ?? 'Sa’ang District, Kandal Province, Cambodia');
  const [clientTaxId, setClientTaxId] = useState(savedData?.clientTaxId ?? 'VAT TIN: K008-883921045');
  const [clientContact, setClientContact] = useState(savedData?.clientContact ?? 'procurement@greenfarm-kh.com | +855 12 345 678');

  // 5. PAYMENT REMITTANCE & ATTACHED QR CODE STATE (Remembered)
  const [remitBankName, setRemitBankName] = useState(savedData?.remitBankName ?? 'ABA Bank Ltd.');
  const [remitAccountName, setRemitAccountName] = useState(savedData?.remitAccountName ?? 'ONETECHNOLOGY CO., LTD.');
  const [remitAccountNumber, setRemitAccountNumber] = useState(savedData?.remitAccountNumber ?? '001 892 473');
  const [remitCurrency, setRemitCurrency] = useState(savedData?.remitCurrency ?? 'USD');
  const [remitSwift, setRemitSwift] = useState(savedData?.remitSwift ?? 'ABAAKHPP');
  const [remitBranch, setRemitBranch] = useState(savedData?.remitBranch ?? 'Central Branch, Phnom Penh');
  const [remitNotes, setRemitNotes] = useState(savedData?.remitNotes ?? 'Please email payment remittance slip to billing@onetechnology.com.kh after transfer.');
  const [customQrUrl, setCustomQrUrl] = useState<string | null>(savedData?.customQrUrl ?? null);

  // 6. DELIVERABLES WITH EDITABLE AMOUNTS (Remembered)
  const [deliverables, setDeliverables] = useState<InvoiceLineItem[]>(savedData?.deliverables ?? DEFAULT_DELIVERABLES);
  const [isInlineEditingAmounts, setIsInlineEditingAmounts] = useState<boolean>(false);

  // 7. FINANCIALS, DISCOUNT & DEPOSIT STATE (Remembered)
  const [discountPercent, setDiscountPercent] = useState<number>(savedData?.discountPercent ?? 10);
  const [depositAmount, setDepositAmount] = useState<number>(savedData?.depositAmount ?? 2000);
  const [displayLang, setDisplayLang] = useState<'dual' | 'en' | 'km'>(savedData?.displayLang ?? 'dual');

  // 8. QUOTATION TERMS & SUPPORT STATE (Remembered)
  const [termsNote, setTermsNote] = useState<string>(savedData?.termsNote ?? DEFAULT_TERMS_NOTE);
  const [termsValidityDays, setTermsValidityDays] = useState<number>(savedData?.termsValidityDays ?? 30);
  const [termsWarrantyMonths, setTermsWarrantyMonths] = useState<number>(savedData?.termsWarrantyMonths ?? 12);
  const [termsMilestoneSchedule, setTermsMilestoneSchedule] = useState<string>(
    savedData?.termsMilestoneSchedule ?? '50% Advance Deposit on Quotation Sign-Off, 50% upon Final Deployment & Acceptance'
  );

  // UI Panels & Status
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [activeCustomizerTab, setActiveCustomizerTab] = useState<'terms' | 'amounts' | 'financials' | 'payment' | 'issued' | 'billed' | 'brand'>('terms');
  const [showGoogleDocModal, setShowGoogleDocModal] = useState(false);
  const [isExportingGDoc, setIsExportingGDoc] = useState(false);
  const [exportedGDocUrl, setExportedGDocUrl] = useState<string | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string>('Saved');

  // AUTO-SAVE / REMEMBER FEATURE: Persist all customized data into localStorage
  useEffect(() => {
    const dataToSave = {
      brandName,
      brandTagline,
      brandTaglineKm,
      customLogoUrl,
      quotationNumber,
      issueDate,
      validUntilDate,
      paymentTerms,
      projectRef,
      issuerCompany,
      issuerCompanyKm,
      issuerAddress,
      issuerTaxId,
      issuerEmail,
      issuerPhone,
      signatoryName,
      signatoryTitle,
      clientName,
      clientNameKm,
      clientAttention,
      clientAddress,
      clientTaxId,
      clientContact,
      remitBankName,
      remitAccountName,
      remitAccountNumber,
      remitCurrency,
      remitSwift,
      remitBranch,
      remitNotes,
      customQrUrl,
      deliverables,
      discountPercent,
      depositAmount,
      displayLang,
      termsNote,
      termsValidityDays,
      termsWarrantyMonths,
      termsMilestoneSchedule,
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
      setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('Could not auto-save to localStorage:', e);
    }
  }, [
    brandName,
    brandTagline,
    brandTaglineKm,
    customLogoUrl,
    quotationNumber,
    issueDate,
    validUntilDate,
    paymentTerms,
    projectRef,
    issuerCompany,
    issuerCompanyKm,
    issuerAddress,
    issuerTaxId,
    issuerEmail,
    issuerPhone,
    signatoryName,
    signatoryTitle,
    clientName,
    clientNameKm,
    clientAttention,
    clientAddress,
    clientTaxId,
    clientContact,
    remitBankName,
    remitAccountName,
    remitAccountNumber,
    remitCurrency,
    remitSwift,
    remitBranch,
    remitNotes,
    customQrUrl,
    deliverables,
    discountPercent,
    depositAmount,
    displayLang,
    termsNote,
    termsValidityDays,
    termsWarrantyMonths,
    termsMilestoneSchedule,
  ]);

  // Dynamic Financial Calculations (Subtotal, Discount, Deposit, Balance Due)
  const subtotal = deliverables.reduce((acc, item) => acc + item.rate, 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const safeDeposit = Math.min(afterDiscount, Math.max(0, depositAmount));
  const balanceDue = Math.max(0, afterDiscount - safeDeposit);
  const khrExchangeRate = 4100;
  const balanceDueKhr = balanceDue * khrExchangeRate;

  // Master Handler for Editable Features, Technical Scope, Category & Amounts
  const handleUpdateDeliverableField = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setDeliverables((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (field === 'rate') {
            return { ...item, rate: Math.max(0, parseFloat(value) || 0) };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleUpdateDeliverableRate = (id: string, newRate: number) => {
    handleUpdateDeliverableField(id, 'rate', newRate);
  };

  const handleResetDeliverables = () => {
    setDeliverables(DEFAULT_DELIVERABLES);
  };

  const handleResetAllToFactory = () => {
    if (window.confirm('Reset all quotation details and terms back to initial factory defaults?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setBrandName('ONETECHNOLOGY');
      setBrandTagline('Enterprise Software Solutions & Agronomy Systems');
      setBrandTaglineKm('ស្ថាបត្យកម្មប្រព័ន្ធបច្ចេកវិទ្យា & ដំណោះស្រាយកសិកម្មឆ្លាតវៃ');
      setCustomLogoUrl(null);
      setQuotationNumber('QT-2026-OT088');
      setIssueDate('2026-10-05');
      setValidUntilDate('2026-11-04');
      setPaymentTerms('Net 30 Days (50% Deposit)');
      setProjectRef('Turnkey Smart Farm Operating System (MelonPro)');
      setIssuerCompany('ONETECHNOLOGY CO., LTD.');
      setIssuerCompanyKm('ក្រុមហ៊ុន វ័ន ថេកណូឡូជី (ខេមបូឌា) ខូអិលធីឌី');
      setIssuerAddress('#88 Technology Innovation Tower, Monivong Blvd, Phnom Penh, Cambodia');
      setIssuerTaxId('VAT TIN: K002-902188410');
      setIssuerEmail('contact@onetechnology.com.kh');
      setIssuerPhone('+855 (0) 23 888 168 / +855 (0) 12 999 168');
      setSignatoryName('Meng Luk');
      setSignatoryTitle('Authorized Representative / Managing Director');
      setClientName('Green Farm Agro-Industrial Co., Ltd.');
      setClientNameKm('ក្រុមហ៊ុន ហ្គ្រីន ហ្វាម អាក្រូ-អ៊ិនដាសស្ទ្រី');
      setClientAttention('Attn: Farm Operations & Project Committee');
      setClientAddress('Sa’ang District, Kandal Province, Cambodia');
      setClientTaxId('VAT TIN: K008-883921045');
      setClientContact('procurement@greenfarm-kh.com | +855 12 345 678');
      setRemitBankName('ABA Bank Ltd.');
      setRemitAccountName('ONETECHNOLOGY CO., LTD.');
      setRemitAccountNumber('001 892 473');
      setRemitCurrency('USD');
      setRemitSwift('ABAAKHPP');
      setRemitBranch('Central Branch, Phnom Penh');
      setRemitNotes('Please email payment remittance slip to billing@onetechnology.com.kh after transfer.');
      setCustomQrUrl(null);
      setDeliverables(DEFAULT_DELIVERABLES);
      setDiscountPercent(10);
      setDepositAmount(2000);
      setDisplayLang('dual');
      setTermsNote(DEFAULT_TERMS_NOTE);
      setTermsValidityDays(30);
      setTermsWarrantyMonths(12);
      setTermsMilestoneSchedule('50% Advance Deposit on Quotation Sign-Off, 50% upon Final Deployment & Acceptance');
    }
  };

  const handleAddCustomDeliverable = () => {
    const nextNo = String(deliverables.length + 1).padStart(2, '0');
    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}`,
      itemNo: nextNo,
      moduleEn: 'Custom Engineering & System Integration',
      moduleKm: 'សេវាកម្មអភិវឌ្ឍន៍បន្ថែម & ការតភ្ជាប់ប្រព័ន្ធ',
      deliverableScope: 'Custom agronomy API logic, IoT sensor firmware bridge, and specialized workflow setup.',
      deliverableScopeKm: 'ការអភិវឌ្ឍមុខងារបន្ថែម ការតភ្ជាប់ប្រព័ន្ធបញ្ជាទឹក និងការបណ្តុះបណ្តាលបច្ចេកទេស។',
      category: 'Core System',
      rate: 1000,
      discount: 0,
    };
    setDeliverables([...deliverables, newItem]);
  };

  const handleDeleteDeliverable = (id: string) => {
    if (deliverables.length <= 1) return;
    setDeliverables(deliverables.filter((d) => d.id !== id));
  };

  // DIRECT HIGH-FIDELITY PDF GENERATOR (Immune to Sandboxed Iframe Print Limitations)
  const handleDownloadPdf = async () => {
    if (!printSheetRef.current) return;

    try {
      setIsGeneratingPdf(true);
      setShowCustomizer(false);
      setIsInlineEditingAmounts(false);

      // Brief wait for any state updates to flush to DOM
      await new Promise((resolve) => setTimeout(resolve, 150));

      const sheetElement = printSheetRef.current;

      // Render high-DPI canvas (2x scale for ultra crisp text and vectors)
      const canvas = await html2canvas(sheetElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: sheetElement.scrollWidth,
        windowHeight: sheetElement.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // Create official A4 Portrait PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `Quotation-${quotationNumber || 'QT-2026-OT088'}.pdf`;
      pdf.save(fileName);

      setPdfSuccessMessage(`✓ Downloaded ${fileName} successfully! You can view, print, or share your official A4 quotation.`);
      setTimeout(() => setPdfSuccessMessage(null), 7000);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      // Fallback: download standalone printable HTML
      handleDownloadHtml();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // STANDALONE PRINTABLE HTML DOWNLOAD FALLBACK
  const handleDownloadHtml = () => {
    if (!printSheetRef.current) return;
    const content = printSheetRef.current.outerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="UTF-8">
  <title>Quotation - ${quotationNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4 portrait; margin: 6mm 8mm; }
    body { background: #f8fafc; font-family: 'Plus Jakarta Sans', 'Kantumruy Pro', sans-serif; margin: 0; padding: 20px; }
    .a4-sheet { max-width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    @media print {
      body { background: #fff; padding: 0; }
      .a4-sheet { box-shadow: none; border: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 20px;">
    <button onclick="window.print()" style="padding: 10px 24px; font-weight: bold; background: #164e22; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
      🖨️ Print Quotation (Ctrl + P)
    </button>
  </div>
  <div class="a4-sheet">
    ${content}
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 300);
    });
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quotation-${quotationNumber || 'QT-2026-OT088'}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setPdfSuccessMessage(`✓ Downloaded standalone printable HTML file: Quotation-${quotationNumber || 'QT-2026-OT088'}.html`);
    setTimeout(() => setPdfSuccessMessage(null), 7000);
  };

  // ROBUST PRINT FUNCTION: Auto-detects sandboxed iframe to prevent "Ignored call to 'print()'" error
  const handlePrint = () => {
    setShowCustomizer(false);
    setIsInlineEditingAmounts(false);
    window.focus();

    // Check if running inside sandboxed iframe (such as AI Studio dev preview)
    const isSandboxed = window.self !== window.top;
    if (isSandboxed) {
      // In sandboxed iframe, window.print() is blocked by browser with:
      // "Ignored call to 'print()'. The document is sandboxed, and the 'allow-modals' keyword is not set."
      // We automatically generate the real A4 PDF directly instead!
      handleDownloadPdf();
      return;
    }

    try {
      window.print();
    } catch (e) {
      // Graceful fallback to direct PDF generation
      handleDownloadPdf();
    }
  };

  // Upload Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload Attached QR Code
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomQrUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportGoogleDocsDirect = async () => {
    try {
      setIsExportingGDoc(true);
      const res = await createInvoiceGoogleDoc();
      setExportedGDocUrl(res.documentUrl);
    } catch (err: any) {
      setShowGoogleDocModal(true);
    } finally {
      setIsExportingGDoc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Control Toolbar (Non-printable) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-0.5">
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>Standardized A4 Project Deliverables Quotation</span>
            {/* Remember / Auto-Saved Status Indicator */}
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 ml-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Remembered / បានចងចាំ ({lastSavedTimestamp})</span>
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Project Deliverables Quotation (A4)</span>
            <span className="text-sm font-normal text-slate-400 font-khmer">/ លិខិតសម្រង់តម្លៃគម្រោង</span>
          </h2>
          <p className="text-xs text-slate-500 font-khmer mt-0.5">
            រៀបចំដោយ {brandName} សម្រាប់គម្រោងកសិកម្មឆ្លាតវៃ តាមស្តង់ដារបោះពុម្ពក្រដាស A4 (210mm x 297mm)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Inline Edit Deliverables & Category */}
          <button
            onClick={() => setIsInlineEditingAmounts(!isInlineEditingAmounts)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border ${
              isInlineEditingAmounts
                ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-200'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
            title="Toggle inline editing for deliverable features, technical scope, categories, and amounts"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isInlineEditingAmounts ? 'Done Editing Deliverables' : 'Edit Features & Category'}</span>
          </button>

          {/* Language Switcher */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setDisplayLang('dual')}
              className={`px-2.5 py-1 rounded-lg transition-all ${displayLang === 'dual' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Dual (EN/KM)
            </button>
            <button
              onClick={() => setDisplayLang('en')}
              className={`px-2.5 py-1 rounded-lg transition-all ${displayLang === 'en' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              English
            </button>
            <button
              onClick={() => setDisplayLang('km')}
              className={`px-2.5 py-1 rounded-lg transition-all font-khmer ${displayLang === 'km' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ភាសាខ្មែរ
            </button>
          </div>

          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showCustomizer 
                ? 'bg-emerald-50 text-[#164e22] border-emerald-300 ring-2 ring-emerald-100 font-bold' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Customize Quotation</span>
          </button>

          <button
            onClick={handleExportGoogleDocsDirect}
            disabled={isExportingGDoc}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{isExportingGDoc ? 'Exporting...' : 'Google Docs'}</span>
          </button>

          {/* PRIMARY DIRECT SAVE AS PDF BUTTON */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
            title="Generate and download authentic high-resolution A4 PDF document"
          >
            {isGeneratingPdf ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                <span>Generating A4 PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.2]" />
                <span>Save as PDF (A4)</span>
              </>
            )}
          </button>

          {/* SECONDARY PRINT DIALOG BUTTON */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Open system print dialog or save via printer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* PDF Generation Success Notification */}
      {pdfSuccessMessage && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-2xs animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{pdfSuccessMessage}</span>
          </div>
          <button onClick={() => setPdfSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold p-1">✕</button>
        </div>
      )}

      {/* 2. Interactive Customizer Panel (Non-printable) */}
      {showCustomizer && (
        <div className="no-print bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs space-y-4 animate-in fade-in-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
              <span className="font-extrabold text-sm text-slate-900">
                Quotation & SOW Parameters Customizer
              </span>
              <span className="text-[11px] text-emerald-700 font-normal font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Auto-Remembered in Browser
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetAllToFactory}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold underline"
              >
                Reset to Factory Defaults
              </button>
              <button onClick={() => setShowCustomizer(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveCustomizerTab('terms')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeCustomizerTab === 'terms' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Terms & Support</span>
            </button>
            <button
              onClick={() => setActiveCustomizerTab('amounts')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeCustomizerTab === 'amounts' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Deliverables, Scope & Category ({deliverables.length})</span>
            </button>
            <button
              onClick={() => setActiveCustomizerTab('financials')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeCustomizerTab === 'financials' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Discount & Deposit</span>
            </button>
            <button
              onClick={() => setActiveCustomizerTab('payment')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeCustomizerTab === 'payment' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment Remittance & QR</span>
            </button>
            <button
              onClick={() => setActiveCustomizerTab('brand')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeCustomizerTab === 'brand' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Logo & Brand</span>
            </button>
            <button
              onClick={() => setActiveCustomizerTab('issued')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeCustomizerTab === 'issued' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>ISSUED BY</span>
            </button>
            <button
              onClick={() => setActiveCustomizerTab('billed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeCustomizerTab === 'billed' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>BILL TO</span>
            </button>
          </div>

          {/* TAB 1: QUOTATION TERMS & SUPPORT (CUSTOMIZABLE) */}
          {activeCustomizerTab === 'terms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Quotation Terms & SLA Support Configuration</h4>
                  <p className="text-[11px] text-slate-500 font-khmer">
                    កំណត់លក្ខខណ្ឌសម្រង់តម្លៃ សុពលភាព រយៈពេលធានាប្រព័ន្ធ និងកាលវិភាគទូទាត់ប្រាក់កក់ដែលត្រូវបង្ហាញលើសន្លឹក A4
                  </p>
                </div>
              </div>

              {/* Preset Shortcuts */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setTermsValidityDays(30);
                    setTermsWarrantyMonths(12);
                    setTermsMilestoneSchedule('50% Advance Deposit on Quotation Sign-Off, 50% upon Final Deployment & Acceptance');
                    setTermsNote(`តម្លៃសម្រង់ខាងលើនេះមានសុពលភាពរយៈពេល ៣០ ថ្ងៃ គិតចាប់ពីថ្ងៃចេញលិខិតនេះ។ តម្លៃរួមបញ្ចូលការដំឡើងប្រព័ន្ធ ការបណ្តុះបណ្តាលបុគ្គលិក ការធានាប្រព័ន្ធ និងជំនួយបច្ចេកទេសកសិកម្មរៀបចំវដ្តដាំដុះរយៈពេល ១២ ខែពេញ (12-Month Maintenance & SLA Support) ពីក្រុមហ៊ុន ${brandName}។`);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                >
                  Standard Turnkey (12M SLA + 50/50)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTermsValidityDays(60);
                    setTermsWarrantyMonths(24);
                    setTermsMilestoneSchedule('30% Project Inception, 40% Mid-Stage UAT Milestone, 30% Final Handover');
                    setTermsNote(`សម្រង់តម្លៃនេះមានសុពលភាពរយៈពេល ៦០ ថ្ងៃ។ រួមបញ្ចូលការធានាថែទាំប្រព័ន្ធកម្រិតសហគ្រាសរយៈពេល ២៤ ខែពេញ (24-Month Enterprise SLA) ជំនួយបច្ចេកទេស 24/7 និងការបណ្តុះបណ្តាលវិស្វករកសិកម្មប្រចាំចំការ។`);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                >
                  Enterprise 24M SLA
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Quotation Validity (Days)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={termsValidityDays}
                      onChange={(e) => setTermsValidityDays(parseInt(e.target.value) || 30)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">Days</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Warranty & Support (Months)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={termsWarrantyMonths}
                      onChange={(e) => setTermsWarrantyMonths(parseInt(e.target.value) || 12)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">Months SLA</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Payment Schedule</label>
                  <input
                    type="text"
                    value={termsMilestoneSchedule}
                    onChange={(e) => setTermsMilestoneSchedule(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Custom Quotation Terms & SLA Support Statement (Khmer & English)
                  </label>
                  <textarea
                    rows={4}
                    value={termsNote}
                    onChange={(e) => setTermsNote(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-khmer text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="បញ្ចូលលក្ខខណ្ឌសម្រង់តម្លៃ ការធានា និងកិច្ចសន្យា..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDITABLE DELIVERABLES, TECHNICAL SCOPE & CATEGORY */}
          {activeCustomizerTab === 'amounts' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Main Features, Technical Deliverables & Categories Editor
                  </h4>
                  <p className="text-[11px] text-slate-500 font-khmer">
                    កែប្រែឈ្មោះមុខងារ ការពិពណ៌នាបច្ចេកទេស ប្រភេទ (Category) និងតម្លៃទឹកប្រាក់ (Amount USD)។ ទិន្នន័យត្រូវបានចងចាំស្វ័យប្រវត្តិ។
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddCustomDeliverable}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Module</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDeliverables}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset All</span>
                  </button>
                </div>
              </div>

              {/* High-Density Editable List with Expandable Scope Details */}
              <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1 border border-slate-200 rounded-xl p-2.5 bg-white">
                {deliverables.map((item) => {
                  const isExpanded = expandedDeliverableId === item.id;
                  return (
                    <div 
                      key={item.id} 
                      className={`p-2.5 rounded-xl border transition-all ${
                        isExpanded 
                          ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200 shadow-2xs' 
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {/* Row 1: Item No, Feature Name EN, Category, Amount, Expand & Delete */}
                      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                        <span className="font-mono font-bold text-slate-400 text-xs w-6 shrink-0 text-center">
                          {item.itemNo}
                        </span>

                        {/* Feature Title (EN) Input */}
                        <div className="flex-1 min-w-[200px]">
                          <input
                            type="text"
                            value={item.moduleEn}
                            onChange={(e) => handleUpdateDeliverableField(item.id, 'moduleEn', e.target.value)}
                            placeholder="Feature Title (English)"
                            className="w-full px-2 py-1 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Category Selector / Input */}
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => handleUpdateDeliverableField(item.id, 'category', e.target.value)}
                            placeholder="Category"
                            className="w-28 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white text-slate-700"
                          />
                          <select
                            value={CATEGORY_PRESETS.includes(item.category) ? item.category : ''}
                            onChange={(e) => {
                              if (e.target.value) handleUpdateDeliverableField(item.id, 'category', e.target.value);
                            }}
                            className="px-1.5 py-1 text-xs border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                            title="Pick standard category preset"
                          >
                            <option value="" disabled>Presets...</option>
                            {CATEGORY_PRESETS.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        {/* Rate ($ USD) Input */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-mono font-bold text-slate-400 text-xs">$</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={item.rate}
                            onChange={(e) => handleUpdateDeliverableField(item.id, 'rate', e.target.value)}
                            className="w-20 px-1.5 py-1 text-xs text-right font-mono font-bold border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Expand Details & Delete buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setExpandedDeliverableId(isExpanded ? null : item.id)}
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1 ${
                              isExpanded 
                                ? 'bg-emerald-600 text-white border-emerald-700' 
                                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                            title={isExpanded ? 'Collapse scope details' : 'Edit full technical scope & Khmer title'}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span className="text-[10px] hidden sm:inline">{isExpanded ? 'Close' : 'Scope'}</span>
                          </button>

                          {deliverables.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDeliverable(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Delete deliverable"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Technical Scope & Khmer Details */}
                      {isExpanded && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 space-y-2 animate-in fade-in-50 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              Feature Title (Khmer) / <span className="font-khmer font-normal">ឈ្មោះមុខងារជាភាសាខ្មែរ</span>
                            </label>
                            <input
                              type="text"
                              value={item.moduleKm}
                              onChange={(e) => handleUpdateDeliverableField(item.id, 'moduleKm', e.target.value)}
                              placeholder="ឈ្មោះមុខងារជាភាសាខ្មែរ..."
                              className="w-full px-2.5 py-1 font-khmer text-xs border border-slate-300 rounded-lg bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                                Technical Deliverable Scope (English)
                              </label>
                              <textarea
                                rows={2}
                                value={item.deliverableScope}
                                onChange={(e) => handleUpdateDeliverableField(item.id, 'deliverableScope', e.target.value)}
                                placeholder="Describe technical deliverable scope in English..."
                                className="w-full p-2 text-[11px] border border-slate-300 rounded-lg bg-white leading-relaxed"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-0.5 font-khmer">
                                វិសាលភាពបច្ចេកទេស (Khmer Scope)
                              </label>
                              <textarea
                                rows={2}
                                value={item.deliverableScopeKm}
                                onChange={(e) => handleUpdateDeliverableField(item.id, 'deliverableScopeKm', e.target.value)}
                                placeholder="ការពិពណ៌នាវិសាលភាពបច្ចេកទេសជាភាសាខ្មែរ..."
                                className="w-full p-2 text-[11px] font-khmer border border-slate-300 rounded-lg bg-white leading-relaxed"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-emerald-950">Calculated Deliverables Subtotal:</span>
                <span className="text-base font-black text-emerald-900">
                  ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: DISCOUNT, DEPOSIT / PAID ADVANCE & QUOTATION NUMBER */}
          {activeCustomizerTab === 'financials' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Quotation Number *</label>
                <input
                  type="text"
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Quotation Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Valid Until Date</label>
                <input
                  type="date"
                  value={validUntilDate}
                  onChange={(e) => setValidUntilDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Package Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold"
                />
              </div>

              {/* Deposit / Paid Advance Input Field */}
              <div className="sm:col-span-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <label className="text-[11px] font-extrabold text-blue-950 block mb-1">
                  Deposit / Paid Advance / <span className="font-khmer font-normal">ប្រាក់កក់ / បានបង់មុន ($ USD)</span> *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-blue-700">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 border border-blue-300 rounded-lg bg-white font-mono font-extrabold text-blue-900 text-sm focus:ring-2 focus:ring-blue-500/20"
                    placeholder="2000"
                  />
                </div>
                <span className="text-[10px] text-blue-700 mt-1 block">
                  This deposit amount will be deducted directly below Package Discount as "Deposit / Paid Advance:".
                </span>
              </div>

              <div className="sm:col-span-2 p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-slate-500 block">Remaining Balance Due:</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-khmer">អត្រាប្តូរប្រាក់ ៤,១០០ KHR</span>
                  <span className="font-bold text-slate-700 font-mono text-xs">
                    ≈ ៛{balanceDueKhr.toLocaleString('en-US')} KHR
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENT REMITTANCE & ATTACH QR CODE */}
          {activeCustomizerTab === 'payment' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={remitBankName}
                  onChange={(e) => setRemitBankName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Account Name</label>
                <input
                  type="text"
                  value={remitAccountName}
                  onChange={(e) => setRemitAccountName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold uppercase"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Account Number</label>
                <input
                  type="text"
                  value={remitAccountNumber}
                  onChange={(e) => setRemitAccountNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">SWIFT Code</label>
                <input
                  type="text"
                  value={remitSwift}
                  onChange={(e) => setRemitSwift(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Bank Branch</label>
                <input
                  type="text"
                  value={remitBranch}
                  onChange={(e) => setRemitBranch(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Remittance Currency</label>
                <input
                  type="text"
                  value={remitCurrency}
                  onChange={(e) => setRemitCurrency(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              {/* Attached QR Code Section */}
              <div className="sm:col-span-3 p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-slate-900 rounded-lg p-1.5 flex items-center justify-center shrink-0 border border-slate-200">
                    {customQrUrl ? (
                      <img src={customQrUrl} alt="Attached QR" className="w-full h-full object-contain rounded bg-white" />
                    ) : (
                      <QrCode className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      {customQrUrl ? 'Attached Bank QR Code (Active)' : 'Default Simulated KHQR Code'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-khmer mt-0.5">
                      ភ្ជាប់រូបភាព QR Code ធនាគារ ABA / Bakong / KHQR ដើម្បីឱ្យអ្នកទិញស្កេនទូទាត់ប្រាក់កក់ដោយផ្ទាល់
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={qrFileInputRef}
                    onChange={handleQrUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => qrFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Attach QR Code Image</span>
                  </button>

                  {customQrUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomQrUrl(null)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      title="Reset to default QR"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Payment Instructions / Notes</label>
                <input
                  type="text"
                  value={remitNotes}
                  onChange={(e) => setRemitNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 5: BRAND & LOGO */}
          {activeCustomizerTab === 'brand' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Brand Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                  placeholder="e.g. ONETECHNOLOGY"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Brand Subtitle (EN)</label>
                <input
                  type="text"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Brand Subtitle (Khmer)</label>
                <input
                  type="text"
                  value={brandTaglineKm}
                  onChange={(e) => setBrandTaglineKm(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-khmer"
                />
              </div>

              <div className="sm:col-span-3 p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="rounded-xl border border-slate-200 p-1 bg-white flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ width: '56px', height: '56px', minWidth: '56px', maxWidth: '56px', minHeight: '56px', maxHeight: '56px' }}
                  >
                    {customLogoUrl ? (
                      <img src={customLogoUrl} alt="Custom Logo" className="w-full h-full object-contain" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <OneTechnologyLogo className="w-full h-full" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      {customLogoUrl ? 'Custom Attached Logo' : 'ONETECHNOLOGY High-Tech Vector Logo (Active)'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Upload your logo file (PNG, JPG, SVG) to replace the default emblem.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo File</span>
                  </button>

                  {customLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomLogoUrl(null)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      title="Reset to default logo"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ISSUED BY */}
          {activeCustomizerTab === 'issued' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  value={issuerCompany}
                  onChange={(e) => setIssuerCompany(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Company Name (Khmer)</label>
                <input
                  type="text"
                  value={issuerCompanyKm}
                  onChange={(e) => setIssuerCompanyKm(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-khmer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Tax ID / VAT TIN</label>
                <input
                  type="text"
                  value={issuerTaxId}
                  onChange={(e) => setIssuerTaxId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Issuer Address</label>
                <input
                  type="text"
                  value={issuerAddress}
                  onChange={(e) => setIssuerAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={issuerEmail}
                  onChange={(e) => setIssuerEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={issuerPhone}
                  onChange={(e) => setIssuerPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Authorized Signer Name</label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Signer Title</label>
                <input
                  type="text"
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 7: BILL TO */}
          {activeCustomizerTab === 'billed' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Client Company Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Client Name (Khmer)</label>
                <input
                  type="text"
                  value={clientNameKm}
                  onChange={(e) => setClientNameKm(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-khmer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Attention / Person</label>
                <input
                  type="text"
                  value={clientAttention}
                  onChange={(e) => setClientAttention(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Facility / Farm Location</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Client VAT TIN</label>
                <input
                  type="text"
                  value={clientTaxId}
                  onChange={(e) => setClientTaxId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Project Ref / SOW</label>
                <input
                  type="text"
                  value={projectRef}
                  onChange={(e) => setProjectRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Client Contact Details</label>
                <input
                  type="text"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success notification if exported to Google Docs */}
      {exportedGDocUrl && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Google Doc created successfully in your Drive!</span>
          </div>
          <a
            href={exportedGDocUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-bold text-emerald-900 underline"
          >
            <span>Open Google Doc</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. A4 PAPER SHEET CONTAINER (EXACT 210mm x 297mm PROPORTIONS)    */}
      {/* ================================================================= */}
      <div className="w-full flex justify-center py-2 sm:py-6 overflow-x-auto">
        <div 
          ref={printSheetRef}
          className="a4-print-sheet bg-white text-slate-900 border border-slate-300/80 shadow-xl rounded-none w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-9 flex flex-col justify-between relative selection:bg-emerald-100"
          style={{ boxSizing: 'border-box' }}
        >
          {/* TOP ACCENT LINE (Official Brand Strip) */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-slate-950 via-emerald-700 to-cyan-500" />

          <div>
            {/* QUOTATION HEADER ROW */}
            <div className="flex items-start justify-between border-b-2 border-slate-900/90 pb-3.5 mb-3.5">
              {/* Left Brand Lockup (ONETECHNOLOGY) */}
              <div className="flex items-center gap-3">
                {/* Strictly Constrained Logo Container - Guaranteed to Fit Header */}
                <div 
                  className="rounded-2xl border border-slate-200/90 bg-white p-1 shadow-xs flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ width: '60px', height: '60px', minWidth: '60px', maxWidth: '60px', minHeight: '60px', maxHeight: '60px' }}
                >
                  {customLogoUrl ? (
                    <img 
                      src={customLogoUrl} 
                      alt={brandName} 
                      className="w-full h-full object-contain"
                      style={{ maxWidth: '100%', maxHeight: '100%', width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <OneTechnologyLogo className="w-full h-full" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-slate-950 uppercase">
                      {brandName}
                    </span>
                    <span className="text-[9px] font-bold tracking-widest uppercase bg-slate-900 text-white px-2 py-0.5 rounded font-mono">
                      TECH SOLUTIONS
                    </span>
                  </div>
                  <p className="text-[11.5px] font-extrabold text-slate-800 tracking-wide mt-0.5">
                    {brandTagline}
                  </p>
                  <p className="text-[10.5px] text-slate-500 font-khmer mt-0.5 leading-tight">
                    {brandTaglineKm}
                  </p>
                </div>
              </div>

              {/* Right: QUOTATION Classification & Number */}
              <div className="text-right shrink-0">
                <div className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  QUOTATION
                </div>
                <div className="text-[11px] font-bold text-slate-500 font-khmer mt-0.5">
                  លិខិតសម្រង់តម្លៃ / QUOTATION
                </div>
                <div className="mt-1.5 inline-block text-right">
                  <div className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                    {quotationNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* METADATA GRID: From, To, Dates, Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/90 text-xs mb-3.5">
              {/* Left: Issued By (ONETECHNOLOGY) */}
              <div>
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">
                  ISSUED BY / អ្នកផ្តល់សេវា
                </span>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                  {issuerCompany}
                </div>
                {issuerCompanyKm && (
                  <div className="text-[10.5px] text-slate-600 font-khmer mt-0.5">
                    {issuerCompanyKm}
                  </div>
                )}
                <p className="text-slate-600 mt-0.5 leading-snug text-[10.5px]">
                  {issuerAddress}
                </p>
                <div className="mt-1 font-mono text-[10.5px] text-slate-600 space-y-0.5">
                  <div>VAT TIN: <strong className="text-slate-900 font-bold">{issuerTaxId}</strong></div>
                  <div>Email: {issuerEmail} | Tel: {issuerPhone}</div>
                </div>
              </div>

              {/* Right: Billed To (Client Enterprise) */}
              <div>
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">
                  BILLED TO / អតិថិជន
                </span>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                  {clientName}
                </div>
                {clientNameKm && (
                  <div className="text-[10.5px] text-slate-600 font-khmer mt-0.5">
                    {clientNameKm}
                  </div>
                )}
                <p className="text-slate-600 mt-0.5 leading-snug text-[10.5px]">
                  {clientAttention} · {clientAddress}
                </p>
                <div className="mt-1 font-mono text-[10.5px] text-slate-600 space-y-0.5">
                  <div>{clientTaxId}</div>
                  <div>Project Ref: <strong className="text-slate-900 font-bold">{projectRef}</strong></div>
                  {clientContact && <div>Contact: {clientContact}</div>}
                </div>
              </div>

              {/* 4-Item Date & Terms Grid */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center sm:text-left font-mono text-[10.5px]">
                <div>
                  <span className="text-[9.5px] text-slate-400 uppercase block font-sans font-semibold">Quotation Date</span>
                  <span className="font-bold text-slate-900">{issueDate}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 uppercase block font-sans font-semibold">Valid Until</span>
                  <span className="font-bold text-slate-900">{validUntilDate} ({termsValidityDays}d)</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 uppercase block font-sans font-semibold">Payment Terms</span>
                  <span className="font-bold text-emerald-800">{paymentTerms}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 uppercase block font-sans font-semibold">Currency</span>
                  <span className="font-bold text-slate-900">USD ($) / KHR (៛)</span>
                </div>
              </div>
            </div>

            {/* SCOPE STATEMENT */}
            <div className="mb-3 text-[10.5px] leading-snug text-slate-600 border-l-3 border-slate-900 pl-2.5 py-0.5">
              <strong className="text-slate-900 font-semibold">Quotation Scope & SOW: </strong>
              Complete engineering, deployment, and configuration of the Smart Farm Operating System across Commercial Greenhouses, including phenological botanical stage timeline, Google Satellite GIS polygons, CamGAP compliance logbooks, commercial inventory ERP, and bilingual Khmer/English localization.
            </div>

            {/* DELIVERABLES & FEATURES TABLE (With Editable Features, Categories & Amounts) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-3.5">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[9.5px] font-bold uppercase tracking-wider">
                    <th className="py-1.5 px-2.5 w-9 text-center">No.</th>
                    <th className="py-1.5 px-2.5">
                      <span>Main Feature & Technical Deliverable</span>
                      {isInlineEditingAmounts && <span className="text-amber-300 text-[8.5px] ml-1.5 font-mono">(EDITABLE)</span>}
                    </th>
                    <th className="py-1.5 px-2.5 w-24">
                      <span>Category</span>
                      {isInlineEditingAmounts && <span className="text-amber-300 text-[8.5px] ml-1 font-mono">(EDIT)</span>}
                    </th>
                    <th className="py-1.5 px-2.5 w-24 text-right">
                      <span>Amount (USD)</span>
                      {isInlineEditingAmounts && <span className="text-amber-300 text-[8.5px] block font-mono">(EDIT)</span>}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[10.5px]">
                  {deliverables.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                    >
                      {/* No */}
                      <td className="py-1 px-2.5 text-center font-mono font-bold text-slate-500 text-[10px]">
                        {item.itemNo}
                      </td>

                      {/* Main Feature & Technical Deliverable (Editable) */}
                      <td className="py-1 px-2.5">
                        {isInlineEditingAmounts ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={item.moduleEn}
                              onChange={(e) => handleUpdateDeliverableField(item.id, 'moduleEn', e.target.value)}
                              placeholder="Feature Title (EN)"
                              className="w-full font-bold text-slate-900 border border-amber-300 rounded px-1.5 py-0.5 bg-amber-50/70 text-[11px] focus:bg-white"
                            />
                            <input
                              type="text"
                              value={item.moduleKm}
                              onChange={(e) => handleUpdateDeliverableField(item.id, 'moduleKm', e.target.value)}
                              placeholder="ឈ្មោះមុខងារ (ខ្មែរ)"
                              className="w-full font-khmer text-slate-700 border border-amber-300 rounded px-1.5 py-0.5 bg-amber-50/70 text-[10px] focus:bg-white"
                            />
                            <textarea
                              rows={2}
                              value={displayLang === 'km' ? item.deliverableScopeKm : item.deliverableScope}
                              onChange={(e) => handleUpdateDeliverableField(item.id, displayLang === 'km' ? 'deliverableScopeKm' : 'deliverableScope', e.target.value)}
                              placeholder="Technical deliverable scope..."
                              className="w-full text-[9.5px] border border-slate-300 rounded p-1 bg-white leading-tight focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-slate-900 leading-tight text-[11px]">
                              {displayLang === 'km' ? item.moduleKm : item.moduleEn}
                            </div>
                            {displayLang === 'dual' && (
                              <div className="text-[9.5px] text-slate-500 font-khmer leading-snug">
                                {item.moduleKm}
                              </div>
                            )}
                            <p className="text-[9.5px] text-slate-500 leading-tight">
                              {displayLang === 'km' ? item.deliverableScopeKm : item.deliverableScope}
                            </p>
                          </>
                        )}
                      </td>

                      {/* Category Badge / Editable Category */}
                      <td className="py-1 px-2.5">
                        {isInlineEditingAmounts ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="text"
                              value={item.category}
                              onChange={(e) => handleUpdateDeliverableField(item.id, 'category', e.target.value)}
                              placeholder="Category"
                              className="w-full text-[8.5px] font-mono border border-amber-300 rounded px-1 py-0.5 bg-amber-50/70 font-bold text-slate-800"
                            />
                            <select
                              value={CATEGORY_PRESETS.includes(item.category) ? item.category : ''}
                              onChange={(e) => {
                                if (e.target.value) handleUpdateDeliverableField(item.id, 'category', e.target.value);
                              }}
                              className="w-full text-[8px] border border-slate-300 rounded bg-white text-slate-600 px-0.5 py-0.5"
                            >
                              <option value="" disabled>Presets...</option>
                              {CATEGORY_PRESETS.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="inline-block text-[8.5px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            {item.category}
                          </span>
                        )}
                      </td>

                      {/* Editable Rate Amount */}
                      <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {isInlineEditingAmounts ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400 text-[10px]">$</span>
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={item.rate}
                              onChange={(e) => handleUpdateDeliverableField(item.id, 'rate', e.target.value)}
                              className="w-18 px-1 py-0.5 text-right font-mono font-bold text-slate-900 border border-amber-400 rounded bg-amber-50/60 focus:outline-none focus:ring-1 focus:ring-amber-500 text-[10px]"
                            />
                          </div>
                        ) : (
                          <span 
                            onClick={() => setIsInlineEditingAmounts(true)}
                            className="cursor-pointer hover:text-emerald-700 hover:underline"
                            title="Click to edit deliverables"
                          >
                            ${item.rate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FINANCIAL SUMMARY & BANKING REMITTANCE ROW (With Attached QR Code, Deposit Below Package Discount) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start mb-3.5">
              {/* Left: Banking Remittance Details & Attached QR Code (7 cols) */}
              <div className="sm:col-span-7 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Payment Remittance / ការទូទាត់ប្រាក់</span>
                  </div>
                  <span className="text-[9.5px] font-mono text-slate-800 font-bold bg-slate-200 px-2 py-0.5 rounded">
                    {remitBankName.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                  {/* Account Text Specs */}
                  <div className="sm:col-span-2 space-y-0.5 font-mono text-[10.5px] text-slate-700 leading-snug">
                    <div>Bank Name: <strong className="text-slate-900 font-sans font-bold">{remitBankName}</strong></div>
                    <div>Account Name: <strong className="text-slate-900 font-sans font-bold">{remitAccountName}</strong></div>
                    <div>Account No.: <strong className="text-[#164e22] text-xs font-black">{remitAccountNumber}</strong> ({remitCurrency})</div>
                    <div>SWIFT Code: <strong className="text-slate-900">{remitSwift}</strong></div>
                    {remitBranch && <div>Branch: <span className="text-slate-600">{remitBranch}</span></div>}
                    <p className="text-[9.5px] font-khmer text-slate-500 pt-1 border-t border-slate-200 leading-tight">
                      {remitNotes}
                    </p>
                  </div>

                  {/* Attached QR Code or Default KHQR */}
                  <div className="flex flex-col items-center justify-center p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs relative group">
                    <div 
                      className="bg-slate-900 p-1 rounded flex items-center justify-center text-white overflow-hidden shrink-0"
                      style={{ width: '64px', height: '64px', minWidth: '64px', maxWidth: '64px', minHeight: '64px', maxHeight: '64px' }}
                    >
                      {customQrUrl ? (
                        <img 
                          src={customQrUrl} 
                          alt="Attached Payment QR" 
                          className="w-full h-full object-contain bg-white rounded" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <QrCode className="w-12 h-12" />
                      )}
                    </div>
                    <span className="text-[8.5px] font-bold font-mono text-slate-800 mt-0.5">
                      {customQrUrl ? 'SCAN TO PAY' : 'KHQR SCAN'}
                    </span>

                    {/* Quick Attach QR button in non-print mode */}
                    <button
                      onClick={() => qrFileInputRef.current?.click()}
                      className="no-print opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center text-white text-[9.5px] font-bold p-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 mb-0.5" />
                      <span>Attach QR</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Totals Calculation Table with DEPOSIT BELOW PACKAGE DISCOUNT */}
              <div className="sm:col-span-5 bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                {/* 1. Subtotal */}
                <div className="flex justify-between text-slate-600 font-mono text-[11px]">
                  <span>Deliverables Subtotal:</span>
                  <span className="font-bold text-slate-900">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* 2. Package Discount */}
                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-700 font-mono text-[11px]">
                    <span>Package Discount ({discountPercent}%):</span>
                    <span className="font-bold">-${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {/* 3. Deposit / Paid Advance: (Directly below Package Discount) */}
                {safeDeposit > 0 && (
                  <div className="flex justify-between text-blue-800 font-mono bg-blue-50/70 p-1.5 rounded-lg border border-blue-200 text-[11px]">
                    <div className="flex flex-col">
                      <span className="font-bold text-blue-900">Deposit / Paid Advance:</span>
                      <span className="text-[9.5px] text-blue-600 font-khmer">ប្រាក់កក់ / បានបង់មុន</span>
                    </div>
                    <span className="font-bold text-blue-900 text-sm">-${safeDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {/* 4. TOTAL BALANCE DUE (Remaining Payable) */}
                <div className="pt-1.5 border-t-2 border-slate-900 mt-1">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-[11px] font-black uppercase text-slate-900 tracking-tight block">TOTAL BALANCE DUE:</span>
                      <span className="text-[9.5px] text-slate-500 font-khmer">ទឹកប្រាក់នៅសល់ត្រូវទូទាត់</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-950 font-mono tabular-nums leading-none">
                        ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">
                        ≈ ៛{balanceDueKhr.toLocaleString('en-US')} KHR
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER: QUOTATION TERMS & SUPPORT (CUSTOMIZABLE) & SIGN-OFF BLOCKS */}
          <div className="pt-3 border-t-2 border-slate-200">
            {/* Terms Statement (Fully Customizable) */}
            <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-[9.5px] text-slate-600 leading-relaxed mb-3.5 font-khmer">
              <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>លក្ខខណ្ឌសម្រង់តម្លៃ & ការធានា (Quotation Terms & Support)</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[8.5px] text-slate-500">
                  <span className="bg-emerald-100/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                    VALIDITY: {termsValidityDays} DAYS
                  </span>
                  <span className="bg-blue-100/80 text-blue-900 px-1.5 py-0.5 rounded font-bold">
                    SLA SUPPORT: {termsWarrantyMonths} MONTHS
                  </span>
                </div>
              </div>

              {/* Render User's Custom Terms Text */}
              <p className="whitespace-pre-line leading-relaxed">
                {termsNote}
              </p>

              {termsMilestoneSchedule && (
                <div className="mt-1 pt-1 border-t border-slate-200/60 font-sans text-[9.5px] text-slate-700">
                  <strong>Milestone Schedule: </strong>
                  <span>{termsMilestoneSchedule}</span>
                </div>
              )}
            </div>

            {/* Two Signature Authorization Columns */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              {/* Left: Authorized Vendor (Meng Luk) */}
              <div className="flex flex-col items-center">
                <div className="w-40 h-10 flex items-center justify-center">
                  {/* Digital Signature for Meng Luk */}
                  <div className="font-serif italic text-2xl text-slate-900 font-black -rotate-3 tracking-wide">
                    {signatoryName}
                  </div>
                </div>
                <div className="w-full border-t border-slate-400 pt-1">
                  <div className="font-bold text-slate-900 text-[11px]">Authorized Signature & Stamp</div>
                  <div className="text-[9.5px] font-semibold text-slate-600">{signatoryName} · {signatoryTitle}</div>
                  <div className="text-[8.5px] text-slate-400">{issuerCompany}</div>
                </div>
              </div>

              {/* Right: Client Acceptance */}
              <div className="flex flex-col items-center">
                <div className="w-40 h-10 flex items-center justify-center">
                  <div className="text-[9.5px] text-slate-300 border border-dashed border-slate-300 px-3 py-0.5 rounded">
                    Client Stamp / Sign Here
                  </div>
                </div>
                <div className="w-full border-t border-slate-400 pt-1">
                  <div className="font-bold text-slate-900 text-[11px]">Client Acceptance Sign-Off</div>
                  <div className="text-[9.5px] text-slate-500">{clientName}</div>
                  <div className="text-[8.5px] text-slate-400">Date: ________________________</div>
                </div>
              </div>
            </div>

            {/* Official Bottom Security Footnote */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[8.5px] font-mono text-slate-400">
              <span>{brandName} Enterprise Software Solutions · Phnom Penh, Cambodia</span>
              <span>Document Ref: {quotationNumber} · Page 1 of 1</span>
              <span>Generated on {issueDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Doc Export Modal Backup */}
      <GoogleDocExportModal
        isOpen={showGoogleDocModal}
        onClose={() => setShowGoogleDocModal(false)}
      />
    </div>
  );
};
