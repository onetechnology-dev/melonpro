import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { query, execute, checkConnection } from './db.ts';
import { seedDatabaseIfEmpty } from './seed.ts';

export const apiRouter = Router();

// Helper to safely parse JSON column if needed
function parseJson(val: any, fallback: any = null) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Format row objects from DB to frontend types
function formatFarm(row: any) {
  return {
    ...row,
    center: parseJson(row.center),
  };
}

function formatPlot(row: any) {
  const pTypes = parseJson(row.facilityTypes, null);
  const facilityType = row.facilityType === 'greenhouse' ? 'net_house' : (row.facilityType || 'net_house');
  return {
    ...row,
    facilityType,
    facilityTypes: pTypes || [facilityType],
    center: parseJson(row.center),
    polygonCoords: parseJson(row.polygonCoords),
    shapes: parseJson(row.shapes),
  };
}

function formatCycle(row: any) {
  return {
    ...row,
    stages: parseJson(row.stages, []),
  };
}

function formatRecommendation(row: any) {
  return {
    ...row,
    supportedByRecords: parseJson(row.supportedByRecords, []),
    suggestedAction: parseJson(row.suggestedAction),
  };
}

function formatFarmer(row: any) {
  return {
    ...row,
    assignedPlotIds: parseJson(row.assignedPlotIds, []),
  };
}

function formatPurchaseOrder(row: any) {
  return {
    ...row,
    items: parseJson(row.items, []),
  };
}

function formatSaleOrder(row: any) {
  return {
    ...row,
    items: parseJson(row.items, []),
  };
}

// ----------------------------------------------------
// Health Check
// ----------------------------------------------------
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const status = await checkConnection();
  res.json({
    status: status.ok ? 'connected' : 'error',
    database: 'melonpro_v1',
    tablesCount: status.tables,
    message: status.message,
    timestamp: new Date().toISOString()
  });
});

// ----------------------------------------------------
// Full Sync Endpoint (GET /api/sync/all)
// Single roundtrip to fetch all state on initial app load
// ----------------------------------------------------
apiRouter.get('/sync/all', async (_req: Request, res: Response) => {
  try {
    await seedDatabaseIfEmpty();

    const [
      rawFarms,
      rawPlots,
      rawCycles,
      rawVarieties,
      rawTasks,
      rawMonitoring,
      rawHarvests,
      rawRecommendations,
      rawNotifications,
      rawStock,
      rawPurchases,
      rawSales,
      rawFarmers,
      rawCustomers,
      rawSuppliers,
      rawAccounts,
      rawTransactions,
      rawSettings
    ] = await Promise.all([
      query<any[]>('SELECT * FROM farms ORDER BY id ASC').catch(() => []),
      query<any[]>('SELECT * FROM plots ORDER BY id ASC'),
      query<any[]>('SELECT * FROM crop_cycles ORDER BY id ASC'),
      query<any[]>('SELECT * FROM crop_varieties ORDER BY id ASC'),
      query<any[]>('SELECT * FROM tasks ORDER BY date ASC, time ASC'),
      query<any[]>('SELECT * FROM monitoring_records ORDER BY recordedAt DESC'),
      query<any[]>('SELECT * FROM harvest_records ORDER BY harvestDate DESC'),
      query<any[]>('SELECT * FROM recommendations ORDER BY id ASC'),
      query<any[]>('SELECT * FROM notifications ORDER BY timestamp DESC'),
      query<any[]>('SELECT * FROM stock_items ORDER BY nameEn ASC'),
      query<any[]>('SELECT * FROM purchase_orders ORDER BY date DESC'),
      query<any[]>('SELECT * FROM sales_orders ORDER BY date DESC'),
      query<any[]>('SELECT * FROM farmers ORDER BY code ASC'),
      query<any[]>('SELECT * FROM customers ORDER BY code ASC'),
      query<any[]>('SELECT * FROM suppliers ORDER BY code ASC'),
      query<any[]>('SELECT * FROM financial_accounts ORDER BY id ASC'),
      query<any[]>('SELECT * FROM account_transactions ORDER BY date DESC'),
      query<any[]>('SELECT * FROM farm_settings LIMIT 1')
    ]);

    res.json({
      success: true,
      data: {
        farms: (rawFarms || []).map(formatFarm),
        plots: rawPlots.map(formatPlot),
        cropCycles: rawCycles.map(formatCycle),
        cropVarieties: rawVarieties.map((v) => ({ ...v, nettingRequired: Boolean(v.nettingRequired) })),
        tasks: rawTasks.map((t) => ({ ...t, isRecurring: Boolean(t.isRecurring) })),
        monitoringRecords: rawMonitoring,
        harvestRecords: rawHarvests,
        recommendations: rawRecommendations.map(formatRecommendation),
        notifications: rawNotifications.map((n) => ({ ...n, isRead: Boolean(n.isRead) })),
        stockItems: rawStock.map((s) => ({ ...s, isSaleItem: Boolean(s.isSaleItem) })),
        purchaseOrders: rawPurchases.map(formatPurchaseOrder),
        salesOrders: rawSales.map(formatSaleOrder),
        farmers: rawFarmers.map(formatFarmer),
        customers: rawCustomers,
        suppliers: rawSuppliers,
        financialAccounts: rawAccounts,
        accountTransactions: rawTransactions,
        farmSettings: rawSettings[0] ? { ...rawSettings[0], shapePresets: parseJson(rawSettings[0].shapePresets) } : null
      }
    });
  } catch (err: any) {
    console.error('Error in /api/sync/all:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to sync data' });
  }
});

// ----------------------------------------------------
// Reset Database to Seed Defaults (POST /api/reset)
// ----------------------------------------------------
apiRouter.post('/reset', async (_req: Request, res: Response) => {
  try {
    await execute('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'plots', 'crop_cycles', 'crop_varieties', 'tasks', 'monitoring_records',
      'harvest_records', 'recommendations', 'notifications', 'stock_items',
      'purchase_orders', 'sales_orders', 'farmers', 'customers', 'suppliers',
      'financial_accounts', 'account_transactions', 'farm_settings'
    ];
    for (const t of tables) {
      await execute(`TRUNCATE TABLE \`${t}\``);
    }
    await execute('SET FOREIGN_KEY_CHECKS = 1');
    await seedDatabaseIfEmpty();
    res.json({ success: true, message: 'Database reset to default seeds successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 0. Farms API
// ----------------------------------------------------
apiRouter.get('/farms', async (_req: Request, res: Response) => {
  try {
    const rows = await query<any[]>('SELECT * FROM farms ORDER BY id ASC');
    res.json(rows.map(formatFarm));
  } catch {
    res.json([]);
  }
});

apiRouter.post('/farms', async (req: Request, res: Response) => {
  try {
    const f = req.body;
    await execute(
      `INSERT INTO farms (
        id, name, nameKm, code, location, leadAgronomist, contactPhone, totalAreaHa, description, descriptionKm, center
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), nameKm=VALUES(nameKm), code=VALUES(code), location=VALUES(location),
        leadAgronomist=VALUES(leadAgronomist), contactPhone=VALUES(contactPhone),
        totalAreaHa=VALUES(totalAreaHa), description=VALUES(description), descriptionKm=VALUES(descriptionKm),
        center=VALUES(center)`,
      [
        f.id, f.name, f.nameKm || '', f.code, f.location || '', f.leadAgronomist || '', f.contactPhone || '',
        f.totalAreaHa || 0, f.description || '', f.descriptionKm || '',
        f.center ? JSON.stringify(f.center) : null
      ]
    );
    res.json({ success: true, farm: f });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.delete('/farms/:id', async (req: Request, res: Response) => {
  try {
    await execute('DELETE FROM farms WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 1. Plots API
// ----------------------------------------------------
apiRouter.get('/plots', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM plots ORDER BY id ASC');
  res.json(rows.map(formatPlot));
});

apiRouter.post('/plots', async (req: Request, res: Response) => {
  try {
    const p = req.body;
    await execute(
      `INSERT INTO plots (
        id, name, code, areaHa, facilityType, melonVarietyEn, melonVarietyKm, melonType,
        plantCount, sowingDate, transplantingDate, expectedHarvestDate, currentStage,
        healthScore, healthStatus, soilMoisture, soilEc, soilPh, ambientTemp, humidity,
        irrigationStatus, nextIrrigationTime, qrCodeId, color, center, polygonCoords, shapes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), code=VALUES(code), areaHa=VALUES(areaHa), facilityType=VALUES(facilityType),
        melonVarietyEn=VALUES(melonVarietyEn), melonVarietyKm=VALUES(melonVarietyKm), melonType=VALUES(melonType),
        plantCount=VALUES(plantCount), sowingDate=VALUES(sowingDate), transplantingDate=VALUES(transplantingDate),
        expectedHarvestDate=VALUES(expectedHarvestDate), currentStage=VALUES(currentStage),
        healthScore=VALUES(healthScore), healthStatus=VALUES(healthStatus), soilMoisture=VALUES(soilMoisture),
        soilEc=VALUES(soilEc), soilPh=VALUES(soilPh), ambientTemp=VALUES(ambientTemp), humidity=VALUES(humidity),
        irrigationStatus=VALUES(irrigationStatus), nextIrrigationTime=VALUES(nextIrrigationTime),
        qrCodeId=VALUES(qrCodeId), color=VALUES(color), center=VALUES(center),
        polygonCoords=VALUES(polygonCoords), shapes=VALUES(shapes)`,
      [
        p.id, p.name, p.code, p.areaHa || 0, p.facilityType || 'greenhouse', p.melonVarietyEn || '', p.melonVarietyKm || '',
        p.melonType || 'honeydew', p.plantCount || 0, p.sowingDate || '', p.transplantingDate || '', p.expectedHarvestDate || '',
        p.currentStage || 'seedling', p.healthScore || 100, p.healthStatus || 'optimal', p.soilMoisture || 0, p.soilEc || 0,
        p.soilPh || 0, p.ambientTemp || 0, p.humidity || 0, p.irrigationStatus || 'off', p.nextIrrigationTime || '',
        p.qrCodeId || '', p.color || '#16A34A',
        p.center ? JSON.stringify(p.center) : null,
        p.polygonCoords ? JSON.stringify(p.polygonCoords) : null,
        p.shapes ? JSON.stringify(p.shapes) : null
      ]
    );
    res.json({ success: true, plot: p });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.put('/plots/:id', async (req: Request, res: Response) => {
  try {
    const p = { ...req.body, id: req.params.id };
    await execute(
      `UPDATE plots SET
        name=?, code=?, areaHa=?, facilityType=?, melonVarietyEn=?, melonVarietyKm=?, melonType=?,
        plantCount=?, sowingDate=?, transplantingDate=?, expectedHarvestDate=?, currentStage=?,
        healthScore=?, healthStatus=?, soilMoisture=?, soilEc=?, soilPh=?, ambientTemp=?, humidity=?,
        irrigationStatus=?, nextIrrigationTime=?, qrCodeId=?, color=?, center=?, polygonCoords=?, shapes=?
      WHERE id=?`,
      [
        p.name, p.code, p.areaHa || 0, p.facilityType || 'greenhouse', p.melonVarietyEn || '', p.melonVarietyKm || '',
        p.melonType || 'honeydew', p.plantCount || 0, p.sowingDate || '', p.transplantingDate || '', p.expectedHarvestDate || '',
        p.currentStage || 'seedling', p.healthScore || 100, p.healthStatus || 'optimal', p.soilMoisture || 0, p.soilEc || 0,
        p.soilPh || 0, p.ambientTemp || 0, p.humidity || 0, p.irrigationStatus || 'off', p.nextIrrigationTime || '',
        p.qrCodeId || '', p.color || '#16A34A',
        p.center ? JSON.stringify(p.center) : null,
        p.polygonCoords ? JSON.stringify(p.polygonCoords) : null,
        p.shapes ? JSON.stringify(p.shapes) : null,
        p.id
      ]
    );
    res.json({ success: true, plot: p });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.delete('/plots/:id', async (req: Request, res: Response) => {
  try {
    await execute('DELETE FROM plots WHERE id=?', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 2. Crop Cycles API
// ----------------------------------------------------
apiRouter.get('/crop-cycles', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM crop_cycles ORDER BY id ASC');
  res.json(rows.map(formatCycle));
});

apiRouter.post('/crop-cycles', async (req: Request, res: Response) => {
  try {
    const c = req.body;
    await execute(
      `INSERT INTO crop_cycles (
        id, name, batchNumber, plotId, facilityId, facilityName, variety, sowingDate, transplantDate,
        harvestWindowStart, harvestWindowEnd, stages, status, targetYieldTons,
        assignedAgronomist, currentStageKey
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), batchNumber=VALUES(batchNumber), plotId=VALUES(plotId),
        facilityId=VALUES(facilityId), facilityName=VALUES(facilityName),
        variety=VALUES(variety), sowingDate=VALUES(sowingDate), transplantDate=VALUES(transplantDate),
        harvestWindowStart=VALUES(harvestWindowStart), harvestWindowEnd=VALUES(harvestWindowEnd),
        stages=VALUES(stages), status=VALUES(status), targetYieldTons=VALUES(targetYieldTons),
        assignedAgronomist=VALUES(assignedAgronomist), currentStageKey=VALUES(currentStageKey)`,
      [
        c.id, c.name, c.batchNumber, c.plotId, c.facilityId || null, c.facilityName || null,
        c.variety || '', c.sowingDate || '', c.transplantDate || '',
        c.harvestWindowStart || '', c.harvestWindowEnd || '',
        c.stages ? JSON.stringify(c.stages) : null,
        c.status || 'active', c.targetYieldTons || null, c.assignedAgronomist || null, c.currentStageKey || null
      ]
    );
    res.json({ success: true, cycle: c });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.put('/crop-cycles/:id', async (req: Request, res: Response) => {
  try {
    const c = { ...req.body, id: req.params.id };
    await execute(
      `UPDATE crop_cycles SET
        name=?, batchNumber=?, plotId=?, facilityId=?, facilityName=?, variety=?, sowingDate=?, transplantDate=?,
        harvestWindowStart=?, harvestWindowEnd=?, stages=?, status=?, targetYieldTons=?,
        assignedAgronomist=?, currentStageKey=?
      WHERE id=?`,
      [
        c.name, c.batchNumber, c.plotId, c.facilityId || null, c.facilityName || null,
        c.variety || '', c.sowingDate || '', c.transplantDate || '',
        c.harvestWindowStart || '', c.harvestWindowEnd || '',
        c.stages ? JSON.stringify(c.stages) : null,
        c.status || 'active', c.targetYieldTons || null, c.assignedAgronomist || null, c.currentStageKey || null,
        c.id
      ]
    );
    res.json({ success: true, cycle: c });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.delete('/crop-cycles', async (_req: Request, res: Response) => {
  try {
    await execute('DELETE FROM crop_cycles');
    await execute(`
      UPDATE plots SET
        melonVarietyEn='',
        melonVarietyKm='',
        plantCount=0,
        sowingDate='',
        transplantingDate='',
        expectedHarvestDate=''
    `);
    res.json({ success: true, message: 'All crop cycles deleted and plots cleared to empty' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.delete('/crop-cycles/:id', async (req: Request, res: Response) => {
  try {
    const cycleRows = await query<any[]>('SELECT plotId FROM crop_cycles WHERE id=?', [req.params.id]);
    const plotId = cycleRows[0]?.plotId;

    await execute('DELETE FROM crop_cycles WHERE id=?', [req.params.id]);

    if (plotId) {
      const remaining = await query<any[]>(
        "SELECT id FROM crop_cycles WHERE plotId=? AND (status='active' OR status='planned')",
        [plotId]
      );
      if (remaining.length === 0) {
        await execute(
          `UPDATE plots SET
            melonVarietyEn='',
            melonVarietyKm='',
            plantCount=0,
            sowingDate='',
            transplantingDate='',
            expectedHarvestDate=''
          WHERE id=?`,
          [plotId]
        );
      }
    }

    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 3. Crop Varieties API
// ----------------------------------------------------
apiRouter.get('/crop-varieties', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM crop_varieties ORDER BY id ASC');
  res.json(rows.map((v) => ({ ...v, nettingRequired: Boolean(v.nettingRequired) })));
});

apiRouter.post('/crop-varieties', async (req: Request, res: Response) => {
  try {
    const v = req.body;
    await execute(
      `INSERT INTO crop_varieties (
        id, nameEn, nameKm, category, daysToMaturity, seedlingDays, transplantDays,
        vineGrowthDays, floweringDays, pollinationDays, fruitDevDays, harvestDays,
        targetBrix, idealEc, idealPh, plantSpacingCm, expectedYieldKgPerPlant,
        nettingRequired, color, descriptionEn, descriptionKm
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nameEn=VALUES(nameEn),
        nameKm=VALUES(nameKm),
        category=VALUES(category),
        daysToMaturity=VALUES(daysToMaturity),
        seedlingDays=VALUES(seedlingDays),
        transplantDays=VALUES(transplantDays),
        vineGrowthDays=VALUES(vineGrowthDays),
        floweringDays=VALUES(floweringDays),
        pollinationDays=VALUES(pollinationDays),
        fruitDevDays=VALUES(fruitDevDays),
        harvestDays=VALUES(harvestDays),
        targetBrix=VALUES(targetBrix),
        idealEc=VALUES(idealEc),
        idealPh=VALUES(idealPh),
        plantSpacingCm=VALUES(plantSpacingCm),
        expectedYieldKgPerPlant=VALUES(expectedYieldKgPerPlant),
        nettingRequired=VALUES(nettingRequired),
        color=VALUES(color),
        descriptionEn=VALUES(descriptionEn),
        descriptionKm=VALUES(descriptionKm)`,
      [
        v.id, v.nameEn, v.nameKm, v.category || 'honeydew', v.daysToMaturity || 75, v.seedlingDays || 7,
        v.transplantDays || 7, v.vineGrowthDays || 20, v.floweringDays || 12, v.pollinationDays || 14,
        v.fruitDevDays || 20, v.harvestDays || 10, v.targetBrix || 14, v.idealEc || 1.8, v.idealPh || 6.4,
        v.plantSpacingCm || 40, v.expectedYieldKgPerPlant || 1.8, v.nettingRequired ? 1 : 0,
        v.color || '#EAB308', v.descriptionEn || null, v.descriptionKm || null
      ]
    );
    res.json({ success: true, variety: v });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.delete('/crop-varieties/:id', async (req: Request, res: Response) => {
  try {
    await execute('DELETE FROM crop_varieties WHERE id=?', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 4. Tasks API
// ----------------------------------------------------
apiRouter.get('/tasks', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM tasks ORDER BY date ASC, time ASC');
  res.json(rows.map((t) => ({ ...t, isRecurring: Boolean(t.isRecurring) })));
});

apiRouter.post('/tasks', async (req: Request, res: Response) => {
  try {
    const t = req.body;
    await execute(
      `INSERT INTO tasks (
        id, titleEn, titleKm, type, date, time, plotId, batchId, stageKey,
        status, assignedWorker, priority, dosageOrVolume, notesEn, notesKm,
        isRecurring, recurringFrequency, completedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        titleEn=VALUES(titleEn), titleKm=VALUES(titleKm), type=VALUES(type),
        date=VALUES(date), time=VALUES(time), plotId=VALUES(plotId),
        status=VALUES(status), assignedWorker=VALUES(assignedWorker),
        priority=VALUES(priority), dosageOrVolume=VALUES(dosageOrVolume),
        notesEn=VALUES(notesEn), notesKm=VALUES(notesKm), completedAt=VALUES(completedAt)`,
      [
        t.id, t.titleEn, t.titleKm, t.type || 'watering', t.date, t.time || null, t.plotId, t.batchId || '',
        t.stageKey || 'vine_growth', t.status || 'pending', t.assignedWorker || '', t.priority || 'medium',
        t.dosageOrVolume || null, t.notesEn || null, t.notesKm || null, t.isRecurring ? 1 : 0,
        t.recurringFrequency || null, t.completedAt || null
      ]
    );
    res.json({ success: true, task: t });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const t = { ...req.body, id: req.params.id };
    await execute(
      `UPDATE tasks SET
        titleEn=?, titleKm=?, type=?, date=?, time=?, plotId=?, batchId=?, stageKey=?,
        status=?, assignedWorker=?, priority=?, dosageOrVolume=?, notesEn=?, notesKm=?,
        isRecurring=?, recurringFrequency=?, completedAt=?
      WHERE id=?`,
      [
        t.titleEn, t.titleKm, t.type, t.date, t.time || null, t.plotId, t.batchId || '',
        t.stageKey || 'vine_growth', t.status, t.assignedWorker || '', t.priority || 'medium',
        t.dosageOrVolume || null, t.notesEn || null, t.notesKm || null, t.isRecurring ? 1 : 0,
        t.recurringFrequency || null, t.completedAt || null,
        t.id
      ]
    );
    res.json({ success: true, task: t });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    await execute('DELETE FROM tasks WHERE id=?', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 5. Monitoring Records API
// ----------------------------------------------------
apiRouter.get('/monitoring', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM monitoring_records ORDER BY recordedAt DESC');
  res.json(rows);
});

apiRouter.post('/monitoring', async (req: Request, res: Response) => {
  try {
    const m = req.body;
    await execute(
      `INSERT INTO monitoring_records (
        id, plotId, recordedAt, recordedBy, source, soilMoisture, temperature,
        humidity, irrigationVolumeLiters, plantHealthRating, pestObservationEn,
        pestObservationKm, pestSeverity, photoUrl, photoCaption, notesEn, notesKm
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE recordedAt=VALUES(recordedAt), plantHealthRating=VALUES(plantHealthRating)`,
      [
        m.id, m.plotId, m.recordedAt, m.recordedBy || '', m.source || 'manual', m.soilMoisture || 0,
        m.temperature || 0, m.humidity || 0, m.irrigationVolumeLiters || null, m.plantHealthRating || 5,
        m.pestObservationEn || null, m.pestObservationKm || null, m.pestSeverity || 'none',
        m.photoUrl || null, m.photoCaption || null, m.notesEn || null, m.notesKm || null
      ]
    );
    res.json({ success: true, record: m });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.delete('/monitoring/:id', async (req: Request, res: Response) => {
  try {
    await execute('DELETE FROM monitoring_records WHERE id=?', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 6. Harvest Records API
// ----------------------------------------------------
apiRouter.get('/harvests', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM harvest_records ORDER BY harvestDate DESC');
  res.json(rows);
});

apiRouter.post('/harvests', async (req: Request, res: Response) => {
  try {
    const h = req.body;
    await execute(
      `INSERT INTO harvest_records (
        id, plotId, batchId, harvestDate, totalWeightKg, fruitCount, averageWeightKg,
        brixSugarDegree, gradeA_Percent, gradeB_Percent, gradeC_Percent,
        actualYieldTonsPerHa, targetYieldTonsPerHa, recordedBy, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE totalWeightKg=VALUES(totalWeightKg), brixSugarDegree=VALUES(brixSugarDegree)`,
      [
        h.id, h.plotId, h.batchId || '', h.harvestDate, h.totalWeightKg || 0, h.fruitCount || 0,
        h.averageWeightKg || 0, h.brixSugarDegree || 0, h.gradeA_Percent || 0, h.gradeB_Percent || 0,
        h.gradeC_Percent || 0, h.actualYieldTonsPerHa || 0, h.targetYieldTonsPerHa || 0,
        h.recordedBy || '', h.notes || null
      ]
    );
    res.json({ success: true, record: h });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.delete('/harvests/:id', async (req: Request, res: Response) => {
  try {
    await execute('DELETE FROM harvest_records WHERE id=?', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 7. Stock Items API (ERP)
// ----------------------------------------------------
apiRouter.get('/stock-items', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM stock_items ORDER BY nameEn ASC');
  res.json(rows.map((s) => ({ ...s, isSaleItem: Boolean(s.isSaleItem) })));
});

apiRouter.post('/stock-items', async (req: Request, res: Response) => {
  try {
    const s = req.body;
    await execute(
      `INSERT INTO stock_items (
        id, sku, barcode, nameEn, nameKm, category, unit, quantity, minThreshold,
        maxThreshold, unitCost, sellingPrice, location, status, supplierId,
        supplierName, dosageOrUsage, brand, notes, isSaleItem, lastUpdated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        sku=VALUES(sku), nameEn=VALUES(nameEn), nameKm=VALUES(nameKm), category=VALUES(category),
        quantity=VALUES(quantity), minThreshold=VALUES(minThreshold), unitCost=VALUES(unitCost),
        sellingPrice=VALUES(sellingPrice), location=VALUES(location), status=VALUES(status),
        lastUpdated=VALUES(lastUpdated)`,
      [
        s.id, s.sku, s.barcode || null, s.nameEn, s.nameKm, s.category || 'seeds', s.unit || 'pcs',
        s.quantity || 0, s.minThreshold || 0, s.maxThreshold || null, s.unitCost || 0,
        s.sellingPrice || null, s.location || '', s.status || 'in_stock', s.supplierId || null,
        s.supplierName || null, s.dosageOrUsage || null, s.brand || null, s.notes || null,
        s.isSaleItem ? 1 : 0, s.lastUpdated || new Date().toISOString().split('T')[0]
      ]
    );
    res.json({ success: true, item: s });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.put('/stock-items/:id', async (req: Request, res: Response) => {
  try {
    const s = { ...req.body, id: req.params.id };
    await execute(
      `UPDATE stock_items SET
        sku=?, barcode=?, nameEn=?, nameKm=?, category=?, unit=?, quantity=?, minThreshold=?,
        maxThreshold=?, unitCost=?, sellingPrice=?, location=?, status=?, supplierId=?,
        supplierName=?, dosageOrUsage=?, brand=?, notes=?, isSaleItem=?, lastUpdated=?
      WHERE id=?`,
      [
        s.sku, s.barcode || null, s.nameEn, s.nameKm, s.category || 'seeds', s.unit || 'pcs',
        s.quantity || 0, s.minThreshold || 0, s.maxThreshold || null, s.unitCost || 0,
        s.sellingPrice || null, s.location || '', s.status || 'in_stock', s.supplierId || null,
        s.supplierName || null, s.dosageOrUsage || null, s.brand || null, s.notes || null,
        s.isSaleItem ? 1 : 0, s.lastUpdated || new Date().toISOString().split('T')[0],
        s.id
      ]
    );
    res.json({ success: true, item: s });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.delete('/stock-items/:id', async (req: Request, res: Response) => {
  try {
    await execute('DELETE FROM stock_items WHERE id=?', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 8. Purchase Orders API (ERP)
// ----------------------------------------------------
apiRouter.get('/purchase-orders', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM purchase_orders ORDER BY date DESC');
  res.json(rows.map(formatPurchaseOrder));
});

apiRouter.post('/purchase-orders', async (req: Request, res: Response) => {
  try {
    const po = req.body;
    await execute(
      `INSERT INTO purchase_orders (
        id, poNumber, supplierId, supplierName, date, expectedDate, items,
        totalAmount, paidAmount, paymentStatus, orderStatus, paymentMethod, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        orderStatus=VALUES(orderStatus), paymentStatus=VALUES(paymentStatus), paidAmount=VALUES(paidAmount)`,
      [
        po.id, po.poNumber, po.supplierId, po.supplierName, po.date, po.expectedDate || null,
        JSON.stringify(po.items || []), po.totalAmount || 0, po.paidAmount || 0,
        po.paymentStatus || 'unpaid', po.orderStatus || 'ordered', po.paymentMethod || 'bank_transfer',
        po.notes || null
      ]
    );
    res.json({ success: true, order: po });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.put('/purchase-orders/:id', async (req: Request, res: Response) => {
  try {
    const po = { ...req.body, id: req.params.id };
    await execute(
      `UPDATE purchase_orders SET
        supplierId=?, supplierName=?, date=?, expectedDate=?, items=?,
        totalAmount=?, paidAmount=?, paymentStatus=?, orderStatus=?, paymentMethod=?, notes=?
      WHERE id=?`,
      [
        po.supplierId, po.supplierName, po.date, po.expectedDate || null,
        JSON.stringify(po.items || []), po.totalAmount || 0, po.paidAmount || 0,
        po.paymentStatus || 'unpaid', po.orderStatus || 'ordered', po.paymentMethod || 'bank_transfer',
        po.notes || null, po.id
      ]
    );
    res.json({ success: true, order: po });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 9. Sales Orders API (ERP)
// ----------------------------------------------------
apiRouter.get('/sales-orders', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM sales_orders ORDER BY date DESC');
  res.json(rows.map(formatSaleOrder));
});

apiRouter.post('/sales-orders', async (req: Request, res: Response) => {
  try {
    const so = req.body;
    await execute(
      `INSERT INTO sales_orders (
        id, invoiceNumber, customerId, customerName, date, items, totalAmount,
        paidAmount, paymentStatus, deliveryStatus, paymentMethod, plotOriginId, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        paymentStatus=VALUES(paymentStatus), deliveryStatus=VALUES(deliveryStatus), paidAmount=VALUES(paidAmount)`,
      [
        so.id, so.invoiceNumber, so.customerId, so.customerName, so.date,
        JSON.stringify(so.items || []), so.totalAmount || 0, so.paidAmount || 0,
        so.paymentStatus || 'unpaid', so.deliveryStatus || 'pending', so.paymentMethod || 'bank_transfer',
        so.plotOriginId || null, so.notes || null
      ]
    );
    res.json({ success: true, order: so });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.put('/sales-orders/:id', async (req: Request, res: Response) => {
  try {
    const so = { ...req.body, id: req.params.id };
    await execute(
      `UPDATE sales_orders SET
        customerId=?, customerName=?, date=?, items=?, totalAmount=?,
        paidAmount=?, paymentStatus=?, deliveryStatus=?, paymentMethod=?, plotOriginId=?, notes=?
      WHERE id=?`,
      [
        so.customerId, so.customerName, so.date, JSON.stringify(so.items || []),
        so.totalAmount || 0, so.paidAmount || 0, so.paymentStatus || 'unpaid',
        so.deliveryStatus || 'pending', so.paymentMethod || 'bank_transfer',
        so.plotOriginId || null, so.notes || null, so.id
      ]
    );
    res.json({ success: true, order: so });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 10. Farmers API
// ----------------------------------------------------
apiRouter.get('/farmers', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM farmers ORDER BY code ASC');
  res.json(rows.map(formatFarmer));
});

apiRouter.post('/farmers', async (req: Request, res: Response) => {
  try {
    const f = req.body;
    await execute(
      `INSERT INTO farmers (
        id, code, nameEn, nameKm, role, phone, email, assignedPlotIds,
        status, monthlySalary, experienceYears, joinDate, specialty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nameEn=VALUES(nameEn), nameKm=VALUES(nameKm), role=VALUES(role),
        phone=VALUES(phone), email=VALUES(email), assignedPlotIds=VALUES(assignedPlotIds),
        status=VALUES(status), monthlySalary=VALUES(monthlySalary)`,
      [
        f.id, f.code, f.nameEn, f.nameKm, f.role || '', f.phone || '', f.email || null,
        JSON.stringify(f.assignedPlotIds || []), f.status || 'active', f.monthlySalary || 0,
        f.experienceYears || 0, f.joinDate || '', f.specialty || ''
      ]
    );
    res.json({ success: true, farmer: f });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.delete('/farmers/:id', async (req: Request, res: Response) => {
  try {
    await execute('DELETE FROM farmers WHERE id=?', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 11. Customers API
// ----------------------------------------------------
apiRouter.get('/customers', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM customers ORDER BY code ASC');
  res.json(rows);
});

apiRouter.post('/customers', async (req: Request, res: Response) => {
  try {
    const c = req.body;
    await execute(
      `INSERT INTO customers (
        id, code, name, companyName, type, phone, email, address, city,
        totalPurchased, balanceDue, paymentTerms, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), phone=VALUES(phone), email=VALUES(email),
        totalPurchased=VALUES(totalPurchased), balanceDue=VALUES(balanceDue)`,
      [
        c.id, c.code, c.name, c.companyName || null, c.type || 'wholesale', c.phone || '',
        c.email || '', c.address || '', c.city || '', c.totalPurchased || 0,
        c.balanceDue || 0, c.paymentTerms || 'Net 30', c.status || 'active'
      ]
    );
    res.json({ success: true, customer: c });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.delete('/customers/:id', async (req: Request, res: Response) => {
  try {
    await execute('DELETE FROM customers WHERE id=?', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 12. Suppliers API
// ----------------------------------------------------
apiRouter.get('/suppliers', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM suppliers ORDER BY code ASC');
  res.json(rows);
});

apiRouter.post('/suppliers', async (req: Request, res: Response) => {
  try {
    const sp = req.body;
    await execute(
      `INSERT INTO suppliers (
        id, code, name, category, contactPerson, phone, email, address,
        country, totalPurchases, currentPayable, rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), contactPerson=VALUES(contactPerson), phone=VALUES(phone),
        totalPurchases=VALUES(totalPurchases), currentPayable=VALUES(currentPayable)`,
      [
        sp.id, sp.code, sp.name, sp.category || 'general', sp.contactPerson || '',
        sp.phone || '', sp.email || '', sp.address || '', sp.country || 'Cambodia',
        sp.totalPurchases || 0, sp.currentPayable || 0, sp.rating || 5.0
      ]
    );
    res.json({ success: true, supplier: sp });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.delete('/suppliers/:id', async (req: Request, res: Response) => {
  try {
    await execute('DELETE FROM suppliers WHERE id=?', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 13. Financial Accounts API
// ----------------------------------------------------
apiRouter.get('/financial-accounts', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM financial_accounts ORDER BY id ASC');
  res.json(rows);
});

apiRouter.put('/financial-accounts/:id', async (req: Request, res: Response) => {
  try {
    const fa = req.body;
    await execute('UPDATE financial_accounts SET balance=? WHERE id=?', [fa.balance, req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 14. Account Transactions API
// ----------------------------------------------------
apiRouter.get('/account-transactions', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM account_transactions ORDER BY date DESC');
  res.json(rows);
});

apiRouter.post('/account-transactions', async (req: Request, res: Response) => {
  try {
    const at = req.body;
    await execute(
      `INSERT INTO account_transactions (
        id, transactionNumber, date, type, category, amount, accountId,
        accountName, referenceId, descriptionEn, descriptionKm, recordedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE amount=VALUES(amount), date=VALUES(date)`,
      [
        at.id, at.transactionNumber, at.date, at.type, at.category, at.amount || 0,
        at.accountId, at.accountName, at.referenceId || null, at.descriptionEn,
        at.descriptionKm, at.recordedBy || ''
      ]
    );
    res.json({ success: true, transaction: at });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 15. Notifications API
// ----------------------------------------------------
apiRouter.get('/notifications', async (_req: Request, res: Response) => {
  const rows = await query<any[]>('SELECT * FROM notifications ORDER BY timestamp DESC');
  res.json(rows.map((n) => ({ ...n, isRead: Boolean(n.isRead) })));
});

apiRouter.put('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    await execute('UPDATE notifications SET isRead=1 WHERE id=?', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.put('/notifications/read-all', async (_req: Request, res: Response) => {
  try {
    await execute('UPDATE notifications SET isRead=1');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ----------------------------------------------------
// 16. Farm & Map Settings API
// ----------------------------------------------------
apiRouter.get('/settings', async (_req: Request, res: Response) => {
  try {
    const rows = await query<any[]>('SELECT * FROM farm_settings LIMIT 1');
    if (!rows || rows.length === 0) {
      return res.json({
        id: 'default',
        mapProvider: 'google',
        projectName: 'MelonPro',
        footTag: 'MelonPro ERP & Farm Operations — Smart Farming Together',
        showDemoAccounts: true,
        loginBgUrl: null,
        googleApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDhJoeKPt_mCq7_ohdDV-3sfzUv43NxScI',
        arcgisApiKey: process.env.VITE_ARCGIS_API_KEY || 'AAPTa3Hqy5Co-o8CwwxDA02Ga3g..iTswZDboe0yi9lBXA4FHN_LCRRHPzeMsuu2zbhhfkHMRpMdXMTSqobDD_QsEZTpWA7Xpx7fqRy1ZwctIZM59XM550Nl_vqqv79Qa9mCjnIFysy-K5Dl55nF6ZAJvUlEqXKMwdwL33knPcifOPqnZjuQCxubnA0iAhu1-SQBgLqz3_JLDU-oJP-YLs1e-T_o5eu6iVXR0Bgn08Jx01AxpbsXGAOn_au24IDKGzmshtJYwufCerT2XKfNxISw.AT1_gsBSONW4',
      });
    }
    const s = rows[0];
    res.json({
      ...s,
      projectName: s.projectName || 'MelonPro',
      footTag: s.footTag ?? 'MelonPro ERP & Farm Operations — Smart Farming Together',
      showDemoAccounts: s.showDemoAccounts !== undefined ? Boolean(s.showDemoAccounts) : true,
      loginBgUrl: s.loginBgUrl || null,
      customStages: parseJson(s.customStages, null),
      googleApiKey: s.googleApiKey || process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDhJoeKPt_mCq7_ohdDV-3sfzUv43NxScI',
      arcgisApiKey: s.arcgisApiKey || process.env.VITE_ARCGIS_API_KEY || 'AAPTa3Hqy5Co-o8CwwxDA02Ga3g..iTswZDboe0yi9lBXA4FHN_LCRRHPzeMsuu2zbhhfkHMRpMdXMTSqobDD_QsEZTpWA7Xpx7fqRy1ZwctIZM59XM550Nl_vqqv79Qa9mCjnIFysy-K5Dl55nF6ZAJvUlEqXKMwdwL33knPcifOPqnZjuQCxubnA0iAhu1-SQBgLqz3_JLDU-oJP-YLs1e-T_o5eu6iVXR0Bgn08Jx01AxpbsXGAOn_au24IDKGzmshtJYwufCerT2XKfNxISw.AT1_gsBSONW4',
      shapePresets: parseJson(s.shapePresets)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const s = req.body;
    const hasLoginBg = s.loginBgUrl !== undefined;
    const hasCustomStages = s.customStages !== undefined;
    const hasProjectName = s.projectName !== undefined;
    const hasFootTag = s.footTag !== undefined;
    const hasShowDemoAccounts = s.showDemoAccounts !== undefined;

    try {
      await execute('ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS projectName VARCHAR(255) DEFAULT "MelonPro"');
      await execute('ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS footTag TEXT DEFAULT NULL');
      await execute('ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS showDemoAccounts TINYINT(1) DEFAULT 1');
    } catch {
      // Column may already exist
    }

    await execute(
      `INSERT INTO farm_settings (
        id, language, farmName, agronomist, location, units,
        notificationsEnabled, smartAgEnabled, autoDripValveSync,
        weatherLocationId, mapProvider, googleApiKey, arcgisApiKey, loginBgUrl, customStages,
        projectName, footTag, showDemoAccounts
      ) VALUES (
        'default', ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?
      )
      ON DUPLICATE KEY UPDATE
        language=COALESCE(VALUES(language), language),
        farmName=COALESCE(VALUES(farmName), farmName),
        agronomist=COALESCE(VALUES(agronomist), agronomist),
        location=COALESCE(VALUES(location), location),
        units=COALESCE(VALUES(units), units),
        notificationsEnabled=COALESCE(VALUES(notificationsEnabled), notificationsEnabled),
        smartAgEnabled=COALESCE(VALUES(smartAgEnabled), smartAgEnabled),
        autoDripValveSync=COALESCE(VALUES(autoDripValveSync), autoDripValveSync),
        weatherLocationId=COALESCE(VALUES(weatherLocationId), weatherLocationId),
        mapProvider=COALESCE(VALUES(mapProvider), mapProvider),
        googleApiKey=COALESCE(VALUES(googleApiKey), googleApiKey),
        arcgisApiKey=COALESCE(VALUES(arcgisApiKey), arcgisApiKey),
        loginBgUrl=IF(? = 1, VALUES(loginBgUrl), loginBgUrl),
        customStages=IF(? = 1, VALUES(customStages), customStages),
        projectName=IF(? = 1, VALUES(projectName), projectName),
        footTag=IF(? = 1, VALUES(footTag), footTag),
        showDemoAccounts=IF(? = 1, VALUES(showDemoAccounts), showDemoAccounts)`,
      [
        s.language || 'en',
        s.farmName || 'MelonPro Tech Farm',
        s.agronomist || 'Channarith (Lead Agronomist)',
        s.location || 'Kandal Province, Cambodia',
        s.units || 'metric',
        s.notificationsEnabled !== undefined ? (s.notificationsEnabled ? 1 : 0) : 1,
        s.smartAgEnabled !== undefined ? (s.smartAgEnabled ? 1 : 0) : 1,
        s.autoDripValveSync !== undefined ? (s.autoDripValveSync ? 1 : 0) : 1,
        s.weatherLocationId || 'phnom_penh',
        s.mapProvider || 'google',
        s.googleApiKey || null,
        s.arcgisApiKey || null,
        hasLoginBg ? s.loginBgUrl : null,
        hasCustomStages ? (typeof s.customStages === 'string' ? s.customStages : JSON.stringify(s.customStages)) : null,
        s.projectName || 'MelonPro',
        s.footTag ?? 'MelonPro ERP & Farm Operations — Smart Farming Together',
        s.showDemoAccounts !== undefined ? (s.showDemoAccounts ? 1 : 0) : 1,
        hasLoginBg ? 1 : 0,
        hasCustomStages ? 1 : 0,
        hasProjectName ? 1 : 0,
        hasFootTag ? 1 : 0,
        hasShowDemoAccounts ? 1 : 0
      ]
    );
    res.json({ success: true, settings: s });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Upload custom login background image
apiRouter.post('/settings/upload-bg', async (req: Request, res: Response) => {
  try {
    const { imageBase64, extension = 'jpg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const extClean = (extension || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const filename = `login-bg-${Date.now()}.${extClean}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});
