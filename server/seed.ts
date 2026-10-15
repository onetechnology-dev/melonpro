import { pool, query, execute } from './db.ts';
import { 
  INITIAL_FARMS,
  INITIAL_PLOTS, 
  INITIAL_CROP_CYCLES, 
  INITIAL_TASKS, 
  INITIAL_MONITORING_RECORDS, 
  INITIAL_HARVEST_RECORDS, 
  INITIAL_AI_RECOMMENDATIONS, 
  INITIAL_NOTIFICATIONS 
} from '../src/data/initialData.ts';
import { 
  INITIAL_STOCK_ITEMS, 
  INITIAL_PURCHASE_ORDERS, 
  INITIAL_SALES_ORDERS, 
  INITIAL_FARMERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SUPPLIERS, 
  INITIAL_FINANCIAL_ACCOUNTS, 
  INITIAL_ACCOUNT_TRANSACTIONS 
} from '../src/data/erpInitialData.ts';
import { CROP_VARIETIES_PRESETS } from '../src/data/cropVarieties.ts';

export async function seedDatabaseIfEmpty() {
  try {
    // Check if plots table has data
    const plotCount = await query<any[]>('SELECT COUNT(*) as count FROM plots');
    if (plotCount[0]?.count > 0) {
      console.log('[MelonPro DB] Tables already contain data, skipping initial seed.');
      return;
    }

    console.log('[MelonPro DB] Seeding initial data into melonpro_v1...');

    // 0. Farms
    for (const f of INITIAL_FARMS) {
      await execute(
        `INSERT INTO farms (
          id, name, nameKm, code, location, leadAgronomist, contactPhone, totalAreaHa, description, descriptionKm, center
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [
          f.id, f.name, f.nameKm || '', f.code, f.location || '', f.leadAgronomist || '', f.contactPhone || '',
          f.totalAreaHa || 0, f.description || '', f.descriptionKm || '',
          f.center ? JSON.stringify(f.center) : null
        ]
      );
    }

    // 1. Plots
    for (const p of INITIAL_PLOTS) {
      await execute(
        `INSERT INTO plots (
          id, farmId, name, code, areaHa, facilityType, facilityTypes, melonVarietyEn, melonVarietyKm, melonType,
          plantCount, sowingDate, transplantingDate, expectedHarvestDate, currentStage,
          healthScore, healthStatus, soilMoisture, soilEc, soilPh, ambientTemp, humidity,
          irrigationStatus, nextIrrigationTime, qrCodeId, color, center, polygonCoords, shapes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [
          p.id, p.farmId || 'farm-1', p.name, p.code, p.areaHa || 0, p.facilityType, JSON.stringify(p.facilityTypes || [p.facilityType]),
          p.melonVarietyEn || '', p.melonVarietyKm || '', p.melonType || 'honeydew',
          p.plantCount || 0, p.sowingDate || '', p.transplantingDate || '', p.expectedHarvestDate || '', p.currentStage || 'seedling',
          p.healthScore || 100, p.healthStatus || 'optimal', p.soilMoisture || 0, p.soilEc || 0, p.soilPh || 0, p.ambientTemp || 0, p.humidity || 0,
          p.irrigationStatus || 'off', p.nextIrrigationTime || '', p.qrCodeId || '', p.color || '#16A34A',
          p.center ? JSON.stringify(p.center) : null,
          p.polygonCoords ? JSON.stringify(p.polygonCoords) : null,
          (p as any).shapes ? JSON.stringify((p as any).shapes) : null,
        ]
      );
    }

    // 2. Crop Cycles
    for (const c of INITIAL_CROP_CYCLES) {
      await execute(
        `INSERT INTO crop_cycles (
          id, name, batchNumber, plotId, variety, sowingDate, transplantDate,
          harvestWindowStart, harvestWindowEnd, stages, status, targetYieldTons,
          assignedAgronomist, currentStageKey
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [
          c.id, c.name, c.batchNumber, c.plotId, c.variety || '', c.sowingDate || '', c.transplantDate || '',
          c.harvestWindowStart || '', c.harvestWindowEnd || '',
          c.stages ? JSON.stringify(c.stages) : null,
          c.status || 'active', c.targetYieldTons || null, c.assignedAgronomist || null, c.currentStageKey || null
        ]
      );
    }

    // 3. Crop Varieties
    for (const v of CROP_VARIETIES_PRESETS) {
      await execute(
        `INSERT INTO crop_varieties (
          id, nameEn, nameKm, category, daysToMaturity, seedlingDays, transplantDays,
          vineGrowthDays, floweringDays, pollinationDays, fruitDevDays, harvestDays,
          targetBrix, idealEc, idealPh, plantSpacingCm, expectedYieldKgPerPlant,
          nettingRequired, color, descriptionEn, descriptionKm
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE nameEn=VALUES(nameEn)`,
        [
          v.id, v.nameEn, v.nameKm, v.category, v.daysToMaturity || 75, v.seedlingDays || 7, v.transplantDays || 7,
          v.vineGrowthDays || 20, v.floweringDays || 12, v.pollinationDays || 14, v.fruitDevDays || 20, v.harvestDays || 10,
          v.targetBrix || 14, v.idealEc || 1.8, v.idealPh || 6.4, v.plantSpacingCm || 40, v.expectedYieldKgPerPlant || 1.8,
          v.nettingRequired ? 1 : 0, v.color || '#EAB308', v.descriptionEn || null, v.descriptionKm || null
        ]
      );
    }

    // 4. Tasks
    for (const t of INITIAL_TASKS) {
      await execute(
        `INSERT INTO tasks (
          id, titleEn, titleKm, type, date, time, plotId, batchId, stageKey,
          status, assignedWorker, priority, dosageOrVolume, notesEn, notesKm,
          isRecurring, recurringFrequency, completedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE titleEn=VALUES(titleEn)`,
        [
          t.id, t.titleEn, t.titleKm, t.type, t.date, t.time || null, t.plotId, t.batchId || '', t.stageKey || 'vine_growth',
          t.status || 'pending', t.assignedWorker || '', t.priority || 'medium', t.dosageOrVolume || null,
          t.notesEn || null, t.notesKm || null, t.isRecurring ? 1 : 0, t.recurringFrequency || null, t.completedAt || null
        ]
      );
    }

    // 5. Monitoring Records
    for (const m of INITIAL_MONITORING_RECORDS) {
      await execute(
        `INSERT INTO monitoring_records (
          id, plotId, recordedAt, recordedBy, source, soilMoisture, temperature,
          humidity, irrigationVolumeLiters, plantHealthRating, pestObservationEn,
          pestObservationKm, pestSeverity, photoUrl, photoCaption, notesEn, notesKm
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE recordedAt=VALUES(recordedAt)`,
        [
          m.id, m.plotId, m.recordedAt, m.recordedBy || '', m.source || 'manual', m.soilMoisture || 0, m.temperature || 0,
          m.humidity || 0, m.irrigationVolumeLiters || null, m.plantHealthRating || 5, m.pestObservationEn || null,
          m.pestObservationKm || null, m.pestSeverity || 'none', m.photoUrl || null, m.photoCaption || null,
          m.notesEn || null, m.notesKm || null
        ]
      );
    }

    // 6. Harvest Records
    for (const h of INITIAL_HARVEST_RECORDS) {
      await execute(
        `INSERT INTO harvest_records (
          id, plotId, batchId, harvestDate, totalWeightKg, fruitCount, averageWeightKg,
          brixSugarDegree, gradeA_Percent, gradeB_Percent, gradeC_Percent,
          actualYieldTonsPerHa, targetYieldTonsPerHa, recordedBy, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE harvestDate=VALUES(harvestDate)`,
        [
          h.id, h.plotId, h.batchId || '', h.harvestDate, h.totalWeightKg || 0, h.fruitCount || 0, h.averageWeightKg || 0,
          h.brixSugarDegree || 0, h.gradeA_Percent || 0, h.gradeB_Percent || 0, h.gradeC_Percent || 0,
          h.actualYieldTonsPerHa || 0, h.targetYieldTonsPerHa || 0, h.recordedBy || '', h.notes || null
        ]
      );
    }

    // 7. AI Recommendations
    for (const r of INITIAL_AI_RECOMMENDATIONS) {
      await execute(
        `INSERT INTO recommendations (
          id, category, titleEn, titleKm, valueEn, valueKm, detailEn, detailKm,
          riskLevel, supportedByRecords, suggestedAction
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE titleEn=VALUES(titleEn)`,
        [
          r.id, r.category, r.titleEn, r.titleKm, r.valueEn, r.valueKm, r.detailEn, r.detailKm,
          r.riskLevel || 'info',
          JSON.stringify(r.supportedByRecords || []),
          r.suggestedAction ? JSON.stringify(r.suggestedAction) : null
        ]
      );
    }

    // 8. Notifications
    for (const n of INITIAL_NOTIFICATIONS) {
      await execute(
        `INSERT INTO notifications (
          id, type, titleEn, titleKm, messageEn, messageKm, timestamp, isRead, actionUrl
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE titleEn=VALUES(titleEn)`,
        [
          n.id, n.type, n.titleEn, n.titleKm, n.messageEn, n.messageKm, n.timestamp,
          n.isRead ? 1 : 0, n.actionUrl || null
        ]
      );
    }

    // 9. Stock Items
    for (const s of INITIAL_STOCK_ITEMS) {
      await execute(
        `INSERT INTO stock_items (
          id, sku, barcode, nameEn, nameKm, category, unit, quantity, minThreshold,
          maxThreshold, unitCost, sellingPrice, location, status, supplierId,
          supplierName, dosageOrUsage, brand, notes, isSaleItem, lastUpdated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE nameEn=VALUES(nameEn)`,
        [
          s.id, s.sku, s.barcode || null, s.nameEn, s.nameKm, s.category, s.unit,
          s.quantity || 0, s.minThreshold || 0, s.maxThreshold || null, s.unitCost || 0,
          s.sellingPrice || null, s.location || '', s.status || 'in_stock', s.supplierId || null,
          s.supplierName || null, s.dosageOrUsage || null, s.brand || null, s.notes || null,
          s.isSaleItem ? 1 : 0, s.lastUpdated || ''
        ]
      );
    }

    // 10. Purchase Orders
    for (const po of INITIAL_PURCHASE_ORDERS) {
      await execute(
        `INSERT INTO purchase_orders (
          id, poNumber, supplierId, supplierName, date, expectedDate, items,
          totalAmount, paidAmount, paymentStatus, orderStatus, paymentMethod, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE poNumber=VALUES(poNumber)`,
        [
          po.id, po.poNumber, po.supplierId, po.supplierName, po.date, po.expectedDate || null,
          JSON.stringify(po.items || []), po.totalAmount || 0, po.paidAmount || 0,
          po.paymentStatus || 'unpaid', po.orderStatus || 'ordered', po.paymentMethod || 'bank_transfer',
          po.notes || null
        ]
      );
    }

    // 11. Sales Orders
    for (const so of INITIAL_SALES_ORDERS) {
      await execute(
        `INSERT INTO sales_orders (
          id, invoiceNumber, customerId, customerName, date, items, totalAmount,
          paidAmount, paymentStatus, deliveryStatus, paymentMethod, plotOriginId, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE invoiceNumber=VALUES(invoiceNumber)`,
        [
          so.id, so.invoiceNumber, so.customerId, so.customerName, so.date,
          JSON.stringify(so.items || []), so.totalAmount || 0, so.paidAmount || 0,
          so.paymentStatus || 'unpaid', so.deliveryStatus || 'pending', so.paymentMethod || 'bank_transfer',
          so.plotOriginId || null, so.notes || null
        ]
      );
    }

    // 12. Farmers
    for (const f of INITIAL_FARMERS) {
      await execute(
        `INSERT INTO farmers (
          id, code, nameEn, nameKm, role, phone, email, assignedPlotIds,
          status, monthlySalary, experienceYears, joinDate, specialty
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE nameEn=VALUES(nameEn)`,
        [
          f.id, f.code, f.nameEn, f.nameKm, f.role || '', f.phone || '', f.email || null,
          JSON.stringify(f.assignedPlotIds || []), f.status || 'active', f.monthlySalary || 0,
          f.experienceYears || 0, f.joinDate || '', f.specialty || ''
        ]
      );
    }

    // 13. Customers
    for (const c of INITIAL_CUSTOMERS) {
      await execute(
        `INSERT INTO customers (
          id, code, name, companyName, type, phone, email, address, city,
          totalPurchased, balanceDue, paymentTerms, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [
          c.id, c.code, c.name, c.companyName || null, c.type || 'wholesale', c.phone || '',
          c.email || '', c.address || '', c.city || '', c.totalPurchased || 0,
          c.balanceDue || 0, c.paymentTerms || 'Net 30', c.status || 'active'
        ]
      );
    }

    // 14. Suppliers
    for (const sp of INITIAL_SUPPLIERS) {
      await execute(
        `INSERT INTO suppliers (
          id, code, name, category, contactPerson, phone, email, address,
          country, totalPurchases, currentPayable, rating
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [
          sp.id, sp.code, sp.name, sp.category || 'general', sp.contactPerson || '',
          sp.phone || '', sp.email || '', sp.address || '', sp.country || 'Cambodia',
          sp.totalPurchases || 0, sp.currentPayable || 0, sp.rating || 5.0
        ]
      );
    }

    // 15. Financial Accounts
    for (const fa of INITIAL_FINANCIAL_ACCOUNTS) {
      await execute(
        `INSERT INTO financial_accounts (
          id, name, type, accountNumber, institution, balance, currency
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [
          fa.id, fa.name, fa.type, fa.accountNumber || null, fa.institution || null,
          fa.balance || 0, fa.currency || 'USD'
        ]
      );
    }

    // 16. Account Transactions
    for (const at of INITIAL_ACCOUNT_TRANSACTIONS) {
      await execute(
        `INSERT INTO account_transactions (
          id, transactionNumber, date, type, category, amount, accountId,
          accountName, referenceId, descriptionEn, descriptionKm, recordedBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE transactionNumber=VALUES(transactionNumber)`,
        [
          at.id, at.transactionNumber, at.date, at.type, at.category, at.amount || 0,
          at.accountId, at.accountName, at.referenceId || null, at.descriptionEn,
          at.descriptionKm, at.recordedBy || ''
        ]
      );
    }

    // 17. Farm Settings
    try {
      await execute('ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS loginBgUrl LONGTEXT DEFAULT NULL');
      await execute('ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS customStages LONGTEXT DEFAULT NULL');
      await execute('ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS projectName VARCHAR(255) DEFAULT "MelonPro"');
      await execute('ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS footTag TEXT DEFAULT NULL');
      await execute('ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS showDemoAccounts TINYINT(1) DEFAULT 1');
    } catch {
      // Column may already exist
    }

    await execute(
      `INSERT INTO farm_settings (
        id, language, farmName, agronomist, location, units,
        notificationsEnabled, smartAgEnabled, autoDripValveSync, weatherLocationId, mapProvider,
        googleApiKey, arcgisApiKey, loginBgUrl, projectName, footTag, showDemoAccounts
      ) VALUES (
        'default', 'en', 'MelonPro Tech Farm', 'Channarith (Lead Agronomist)', 'Kandal Province, Cambodia', 'metric',
        1, 1, 1, 'phnom_penh', 'google',
        'AIzaSyDhJoeKPt_mCq7_ohdDV-3sfzUv43NxScI',
        'AAPTa3Hqy5Co-o8CwwxDA02Ga3g..iTswZDboe0yi9lBXA4FHN_LCRRHPzeMsuu2zbhhfkHMRpMdXMTSqobDD_QsEZTpWA7Xpx7fqRy1ZwctIZM59XM550Nl_vqqv79Qa9mCjnIFysy-K5Dl55nF6ZAJvUlEqXKMwdwL33knPcifOPqnZjuQCxubnA0iAhu1-SQBgLqz3_JLDU-oJP-YLs1e-T_o5eu6iVXR0Bgn08Jx01AxpbsXGAOn_au24IDKGzmshtJYwufCerT2XKfNxISw.AT1_gsBSONW4',
        NULL, 'MelonPro', 'MelonPro ERP & Farm Operations — Smart Farming Together', 1
      )
      ON DUPLICATE KEY UPDATE farmName=VALUES(farmName)`
    );

    console.log('[MelonPro DB] Successfully seeded all 17 tables in melonpro_v1!');
  } catch (err) {
    console.error('[MelonPro DB] Error during database seeding:', err);
  }
}
