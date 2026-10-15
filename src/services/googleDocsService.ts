import { getAccessToken } from './googleAuth';

export interface GoogleDocExportResult {
  documentId: string;
  documentUrl: string;
  title: string;
}

export const createInvoiceGoogleDoc = async (): Promise<GoogleDocExportResult> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in with Google first.');
  }

  const docTitle = `MelonPro - Complete Feature List & Invoice Scope (${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })})`;

  // 1. Create the new Google Doc
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: docTitle,
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create Google Doc (Status: ${createRes.status})`);
  }

  const newDoc = await createRes.json();
  const documentId = newDoc.documentId;

  // 2. Prepare comprehensive documentation content for invoice and feature specification
  const docBody = `
MELONPRO SMART FARM MANAGEMENT SYSTEM
PROJECT DELIVERABLES & INVOICE BREAKDOWN
================================================================================
Generated Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Application: MelonPro Smart Farm & Crop Calendar
Platform: Responsive Multi-Device Web Application (Desktop, Tablet, Mobile)
Localization: Dual-Language Architecture (English & Khmer / ភាសាខ្មែរ)
Client: Smart Agriculture Farm Management Project
================================================================================

EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
MelonPro is an enterprise-grade smart farm management and melon crop calendar application engineered for precision greenhouse melon cultivation. The platform integrates real-time agrometeorological forecasting, GIS interactive greenhouse spatial mapping, stage-based lifecycle tracking with custom botanical vector graphics, microclimate sensor telemetry, GAP compliance logging, harvest yield grading, and end-to-end QR code packaging traceability.

--------------------------------------------------------------------------------
DETAILED FEATURE SPECIFICATION & INVOICE LINE ITEMS
--------------------------------------------------------------------------------

MODULE 1: EXECUTIVE DASHBOARD & BOTANICAL CROP CALENDAR BAR
- 1.1 Executive KPI Metrics Cards:
  * Active Crop Cycles count with variety distribution.
  * Real-time DAT (Days After Transplanting) counter with progress gauge.
  * Current Phenological Stage indicator and active phase badge.
  * Target Harvest Date countdown and estimated days remaining.
  * Projected Yield metrics calculated in total metric tonnes and commercial crates.
  * Field Health Score calculation based on pest alerts, temperature, and moisture.

- 1.2 Interactive Melon Crop Calendar Bar (Visual Lifecycle Pipeline):
  * 8-Stage milestone pipeline mapped to melon physiology:
    1. Seedling (Germination & Cotyledon development)
    2. Transplanting (Nursery potted seedling bed establishment)
    3. Vine Growth (Vegetative branching with spiral tendrils)
    4. Flowering (Staminate & Pistillate blossom clusters)
    5. Pollination (Honeybee activity & manual pollination window)
    6. Fertilizing (Kraft pouch nutrition & soluble NPK/Ca micro-dosing)
    7. Pest Inspection (Ladybug & spider mite monitoring on foliage)
    8. Harvest (Golden netted cantaloupe with sliced ripe wedge)
  * Real-time stage progress bar with animated active pulse and milestone badges.
  * Bilingual stage names and DAT duration indicators.

- 1.3 Agrometeorology Live Weather Integration:
  * Integrated Open-Meteo API for real-time farm coordinates.
  * Live temperature, relative humidity, UV index, wind speed, and precipitation chance.
  * 7-day agricultural weather forecast for spray and pollination planning.

- 1.4 Dashboard Mini-Calendar & AI Recommendations:
  * High-density agenda calendar with task categories.
  * AI-assisted yield projection card with agronomy tips.


MODULE 2: CROP PLANNING & VARIETY MANAGEMENT
- 2.1 Crop Cycle Provisioning Engine:
  * Configuration of new crop seasons and greenhouse batch assignments.
  * Melon variety selector (Japanese Musk Melon, Golden Emerald, Honey Globe, Rockmelon).
- 2.2 Planting Density & Geometry Calculator:
  * Greenhouse dimension input with row count and inter-plant spacing (cm).
  * Automated plant count and nursery seedling quantity calculation.
- 2.3 Substrate & Growing Method Configuration:
  * Substrate classification: Coco Peat Growbags, Hydroponic Drip Slabs, or Raised Soil Beds.
- 2.4 Automated Lifecycle Milestone Generation:
  * Automatic scheduling of flowering, pollination window, fruit thinning, and harvest based on transplanting date.


MODULE 3: CROP CALENDAR & WORKFLOW SCHEDULER
- 3.1 Multi-View Crop Calendar:
  * Month, week, and lifecycle stage agenda views.
  * Color-coded category tags (Irrigation, Fertilizer, Spray, Pollination, Harvest).
- 3.2 Stage Milestone Bands:
  * Visual duration overlays for critical farm interventions (e.g., pollination window, sugar accumulation).
- 3.3 Interactive Task Scheduling:
  * Click-to-add tasks directly from specific dates on the calendar.


MODULE 4: WORK ORDER & FARM TASK MANAGEMENT
- 4.1 Kanban Board & Tabular List Workflows:
  * 3-Column Kanban tracking: To Do, In Progress, Completed.
  * Interactive Task Modal with Priority (Low, Medium, High, Urgent), Assignee, Due Date, and Notes.
- 4.2 Mobile Quick-Action Task Bar:
  * Floating action button for instant field task creation on mobile smartphones.


MODULE 5: GIS INTERACTIVE FIELD & GREENHOUSE MAPPING
- 5.1 Google Maps Platform Integration:
  * Satellite & Hybrid topographic base map centered on farm coordinates.
  * Greenhouse polygon boundary overlays with active stage color indicators.
- 5.2 Plot Shape & Coordinate Editor Modal:
  * Interactive vertex editing for custom greenhouse polygons.
  * Surface area calculation (m² and hectares) and GPS coordinate management.
- 5.3 Greenhouse Telemetry Drawer:
  * Microclimate sensor inspector (Temperature, Humidity, VPD, EC, pH).


MODULE 6: CROP HEALTH, SCOUTING & BRIX MONITORING
- 6.1 Daily Field Scouting Log:
  * Pest pressure and disease symptom tracking with severity ratings.
- 6.2 Refractometer Brix (°Bx) Sugar Accumulation Log:
  * Sugar concentration curves benchmarked against premium export standards (12°Bx - 16°Bx).
- 6.3 Microclimate Environmental Logging:
  * Historical trends for vapor pressure deficit (VPD) and fertigation electrical conductivity (EC).


MODULE 7: HARVEST, YIELD & PACKAGING TRACEABILITY
- 7.1 Harvest Batch Weight & Grading:
  * Grade A (Export/Premium), Grade B (Local Market), and Grade C (Processing).
  * Netting quality scoring and individual fruit weight distribution (kg).
- 7.2 Traceability QR Code Generator:
  * Batch-specific QR code generator for crate labels and retail packaging.
  * Consumer verification modal for farm-to-table origin transparency.


MODULE 8: FARM RECORDS & GAP COMPLIANCE LOGBOOK
- 8.1 Chemical & Spray Compliance Logbook:
  * Regulatory record-keeping: Active ingredients, target pest, dosage, Pre-Harvest Interval (PHI), and Re-Entry Interval (REI).
- 8.2 Fertigation & Fertilizer Formulation Log:
  * Stock solution ratios (A & B tanks, N-P-K-Ca-Mg ratios).
- 8.3 CamGAP / GlobalGAP Inspection Readiness:
  * Export-ready audit logs conforming to Good Agricultural Practices.


MODULE 9: AGRICULTURAL ANALYTICS & FINANCIAL REPORTING
- 9.1 Greenhouse Yield Comparison:
  * Historical performance comparison across greenhouses and planting seasons.
- 9.2 Input Efficiency & Profitability Calculator:
  * Water, fertilizer, and labor allocation efficiency metrics per greenhouse.
  * Estimated gross revenue based on fruit grades and market prices.


MODULE 10: LOCALIZATION, SYSTEM PREFERENCES & ASSETS
- 10.1 Full Bilingual Localization:
  * Seamless English & Khmer (ភាសាខ្មែរ) translation engine with Kantumruy Pro Khmer typography.
- 10.2 Farm System Settings:
  * Farm branding, GPS coordinates, currency ($ USD / ៛ KHR), and metric unit preferences.
- 10.3 Custom Botanical Vector Illustrations:
  * 8 handcrafted SVG botanical illustrations matching realistic melon agronomy.
  * Custom project branding logo with netted melon and sliced wedge.
- 10.4 Mobile Responsive Design:
  * Fluid desktop sidebar, tablet layouts, and smartphone bottom navigation.


MODULE 11: STOCK & INVENTORY MANAGEMENT
- 11.1 Multi-Category Agricultural Warehouse Tracking:
  * Real-time tracking of Seeds & Genetics, Soluble Fertilizers, Bio-Pesticides, Packaging Materials, and Cold-Storage Melon Harvests.
  * SKU code management, minimum safety thresholds, unit costs, and warehouse locations.
- 11.2 Stock Quantity Reconciliation:
  * Manual inventory adjustments (±) with audit notes and automated low-stock warnings.


MODULE 12: PURCHASE STOCK & SUPPLIER PROCUREMENT
- 12.1 Purchase Order (PO) Management:
  * Direct procurement tracking from verified agricultural input suppliers.
  * Multi-item order creation with unit price, total valuation, and payment terms.
- 12.2 Automated Stock & Ledger Synchronization:
  * One-click "Receive Stock" workflow that instantly increments inventory counts and registers expenses in the accounting ledger.


MODULE 13: SALES INVOICING & PRODUCE COMMERCIALIZATION
- 13.1 Commercial Sales Invoicing:
  * Commercial invoices for Supermarket chains, wholesale fruit traders, and retail boutiques.
  * Product grade breakdown (Grade A, Grade B, Grade C, Premium Gift Boxes).
- 13.2 Automated Inventory Deduction & Revenue Recording:
  * Automatic produce stock reduction and revenue credit to ABA Bank/Cash accounts upon invoice settlement.
- 13.3 Printable Commercial Receipts:
  * Standardized export receipts with farm branding, customer bill-to details, payment terms, and totals.


MODULE 14: FARMER & AGRONOMY TEAM DIRECTORY
- 14.1 Farm Operations Personnel Management:
  * Directory of Senior Agronomists, Fertigation Technicians, Pollination Leads, and Harvest Crew.
  * Monthly base wage, years of protected cultivation experience, and contact details.
- 14.2 Greenhouse Plot Assignment:
  * Dynamic mapping of team members to specific greenhouse plots (Plots A, B, C, D).


MODULE 15: CUSTOMER & BUYER CRM
- 15.1 B2B Buyer Accounts:
  * Profile management for supermarket chains (AEON, Chip Mong, Lucky), wholesale distributors, and fruit boutiques.
- 15.2 Commercial Credit & Receivables Tracking:
  * Payment terms (Net 15 Days, COD, Advance) and cumulative purchase volume monitoring.


MODULE 16: SUPPLIER & VENDOR DIRECTORY
- 16.1 Certified Input Vendors:
  * Vendor profiles for international seed breeders (Japan, Thailand), fertigation chemical manufacturers (Israel), and local packaging suppliers.
- 16.2 Accounts Payable & Quality Rating:
  * Vendor payables balance tracking and quality rating (1 to 5 stars).


MODULE 17: FINANCIAL ACCOUNTS & GENERAL LEDGER (P&L)
- 17.1 Multi-Account Asset Monitoring:
  * ABA Bank corporate operating account, farm cash vault / petty cash, accounts receivable, and accounts payable.
- 17.2 Farm Cash Flow & General Ledger:
  * Real-time transaction ledger categorized by produce sales, seed purchases, fertilizers, wages, and EDC utilities.
- 17.3 Profit & Loss (P&L) Performance Analytics:
  * Net operating profit calculation, gross inflows, and cost outflows.
- 17.4 Internal Fund Transfer Engine:
  * Immediate balance rebalancing between bank accounts and farm petty cash safe.

================================================================================
INVOICE LINE-ITEM COST SUMMARY (PROPOSAL / SOW)
================================================================================
No.  | Deliverable Module                                      | Scope Category
--------------------------------------------------------------------------------
01.  | Core Dashboard, KPI Widgets & Botanical Stage Pipeline  | Core UI / UX
02.  | Crop Planning, Variety Database & Geometry Calculator   | Agronomy Engine
03.  | Crop Calendar & Milestone Scheduler                     | Planning System
04.  | Farm Work Order & Task Management (Kanban/List)         | Operations
05.  | GIS Interactive Field Mapping & Polygon Plot Editor     | GIS / Spatial
06.  | Crop Health, Brix Sugar Tracker & Microclimate Sensors  | Quality Control
07.  | Harvest Yield Grading & Batch QR Traceability           | Post-Harvest
08.  | Chemical, Fertigation & GAP Compliance Logbook          | Compliance
09.  | Agrometeorology Live Weather & Financial Analytics      | Reporting & APIs
10.  | Bilingual Localization (Khmer/EN) & Responsive Layout   | Platform & i18n
11.  | Stock & Inventory Management (Multi-Warehouse)          | ERP / Inventory
12.  | Purchase Stock & Supplier Procurement Engine            | ERP / Procurement
13.  | Sales Invoicing, Fruit Distribution & Official Receipts | ERP / Commercial
14.  | Farmer & Agronomy Team Operations Management            | ERP / HR
15.  | Customer & Supermarket Buyer CRM                        | ERP / CRM
16.  | Supplier & Agri-Input Vendor Directory                  | ERP / Vendors
17.  | Financial Accounts, Cash Flow Ledger & P&L Engine       | ERP / Accounting
--------------------------------------------------------------------------------

================================================================================
INVOICE FINANCIAL SUMMARY
================================================================================
Issued by: ONETECHNOLOGY CO., LTD.
Authorized Signatory: Meng Luk (Managing Director)
Tax ID: K002-902188410
Bank Remittance: ABA Bank Ltd. (A/C: 001 892 473 - USD)
================================================================================
DOCUMENT INFORMATION
Exported by: ONETECHNOLOGY Enterprise AgTech Systems
Google Docs Integration: Authorized via Google Docs API
Document ID: ${documentId}
================================================================================
`;

  // 3. Insert the text into the document using batchUpdate
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: {
              index: 1,
            },
            text: docBody,
          },
        },
      ],
    }),
  });

  if (!updateRes.ok) {
    const errorData = await updateRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to populate Google Doc content (Status: ${updateRes.status})`);
  }

  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  return {
    documentId,
    documentUrl,
    title: docTitle,
  };
};
