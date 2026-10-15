const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'melonpro_v1',
    port: Number(process.env.DB_PORT) || 3306,
  });

  console.log('1. Cleaning sample tasks from 2025...');
  const [res1] = await conn.query("DELETE FROM tasks WHERE plotId IN ('plot-a', 'plot-b') OR batchId = 'cycle-2025-m2' OR date LIKE '2025%'");
  console.log('Deleted sample tasks:', res1.affectedRows);

  console.log('2. Cleaning duplicate / legacy testing tasks for plot-1791709016912...');
  const [res2] = await conn.query("DELETE FROM tasks WHERE plotId = 'plot-1791709016912'");
  console.log('Cleared test tasks:', res2.affectedRows);

  console.log('3. Inserting clean, realistic tasks for Plot A planted crop...');
  const cleanTasks = [
    {
      id: 'task-plota-1-seeding',
      titleEn: 'Nursery Seeding & Peat Moss Hydration for Golden Honeydew (Inthanon F1)',
      titleKm: 'សាបគ្រាប់កូនដំណាំ & ស្រោចជីកំប៉ុស សម្រាប់ត្រសក់ផ្អែមមាស (Inthanon F1)',
      type: 'seeding',
      date: '2026-10-13',
      time: '08:00',
      plotId: 'plot-1791709016912',
      batchId: 'cycle-plot-a-2026-m1',
      stageKey: 'seedling',
      status: 'completed',
      assignedWorker: 'Samban Srey',
      priority: 'high',
      dosageOrVolume: '2,304 Seeds in 104-cell plug trays',
      notesEn: 'Seeded in nursery at 30°C. 98% expected germination rate.',
      notesKm: 'សាបក្នុងរោងបណ្តុះសីតុណ្ហភាព ៣០°C។ អត្រាដុះរំពឹងទុក ៩៨%។'
    },
    {
      id: 'task-plota-2-today',
      titleEn: 'Nursery Seeding & Peat Moss Hydration for Golden Honeydew (Inthanon F1)',
      titleKm: 'ពិនិត្យសំណើមថាសបណ្តុះ និងសីតុណ្ហភាពកូនដំណាំដុះពន្លក',
      type: 'watering',
      date: '2026-10-14',
      time: '07:30',
      plotId: 'plot-1791709016912',
      batchId: 'cycle-plot-a-2026-m1',
      stageKey: 'seedling',
      status: 'pending',
      assignedWorker: 'Samban Srey',
      priority: 'high',
      dosageOrVolume: 'Fine mist spray 2.5L / min',
      notesEn: 'Maintain 75-80% relative humidity. Check radicle emergence on Day 2.',
      notesKm: 'រក្សាសំណើម ៧៥-៨០%។ ពិនិត្យមើលឫសតូចៗដែលចាប់ផ្តើមដុះនៅថ្ងៃទី ២។'
    },
    {
      id: 'task-plota-3-transplant',
      titleEn: 'Transplant to Cocopeat Grow Bags & Connect Drip Line',
      titleKm: 'ស្ទូងកូនដំណាំចូលថង់ស្រកីដូង & ភ្ជាប់ទុយោដំណក់ទឹក',
      type: 'transplanting',
      date: '2026-10-20',
      time: '07:30',
      plotId: 'plot-1791709016912',
      batchId: 'cycle-plot-a-2026-m1',
      stageKey: 'transplanting',
      status: 'pending',
      assignedWorker: 'Field Agronomy Team',
      priority: 'high',
      dosageOrVolume: '2,304 bags in 7 Net Houses (CKL-001 to KCL-007)',
      notesEn: 'Transplant at 2 true leaf stage into cocopeat grow bags with 40cm spacing.',
      notesKm: 'ប្តូរកូនពេលមានស្លឹកពិត ២ សន្លឹក ក្នុងថង់ស្រកីដូងគម្លាត ៤០ សង់ទីម៉ែត្រ។'
    },
    {
      id: 'task-plota-4-trellis',
      titleEn: 'Vertical Trellis Stringing & Lateral Shoot Pruning Below Node 10',
      titleKm: 'ចងដើមឡើងត្រង់តាមខ្សែ & កាត់ខ្នែងក្រោមថ្នាំងទី ១០',
      type: 'vine_maintenance',
      date: '2026-10-27',
      time: '08:30',
      plotId: 'plot-1791709016912',
      batchId: 'cycle-plot-a-2026-m1',
      stageKey: 'vine_growth',
      status: 'pending',
      assignedWorker: 'Samban Srey',
      priority: 'medium',
      dosageOrVolume: 'Row 1 to 28 across Net Houses',
      notesEn: 'Train vertical vine clips, prune bottom side shoots for air circulation.',
      notesKm: 'ចងគៀបខ្សែឡើងត្រង់ កាត់ខ្នែងខាងក្រោមចោលដើម្បីឱ្យខ្យល់ចេញចូលល្អ។'
    },
    {
      id: 'task-plota-5-pollinate',
      titleEn: 'Manual Hand Pollination & Tagging Date for Nodes 11–13',
      titleKm: 'បង្កាត់លម្អងផ្កាដោយដៃ & ចងស្លាកកាលបរិច្ឆេទ ថ្នាំងទី ១១-១៣',
      type: 'flowering_pollination',
      date: '2026-11-28',
      time: '06:30',
      plotId: 'plot-1791709016912',
      batchId: 'cycle-plot-a-2026-m1',
      stageKey: 'pollination',
      status: 'pending',
      assignedWorker: 'Pollination Specialists',
      priority: 'high',
      dosageOrVolume: 'All female flowers nodes 11-13',
      notesEn: 'Morning hand pollination (6:30-10:00 AM). Attach colored date tag to record fruit age.',
      notesKm: 'បង្កាត់ដោយដៃពេលព្រឹក (៦:៣០-១០:០០ ព្រឹក)។ ចងស្លាកពណ៌ដើម្បីដឹងអាយុផ្លែ។'
    },
    {
      id: 'task-plota-6-fruit',
      titleEn: 'Fruit Selection & Net String Hanging (15.5° Brix Target)',
      titleKm: 'ជ្រើសរើសផ្លែស្អាត ១ គ្រាប់ & ចងព្យួរខ្សែសំណាញ់ (គោលដៅ ១៥.៥° Brix)',
      type: 'fruit_maintenance',
      date: '2026-12-12',
      time: '08:00',
      plotId: 'plot-1791709016912',
      batchId: 'cycle-plot-a-2026-m1',
      stageKey: 'fruit_development',
      status: 'pending',
      assignedWorker: 'Samban Srey',
      priority: 'high',
      dosageOrVolume: 'Retain 1 prime fruit per vine',
      notesEn: 'Retain best oval shaped fruit per plant. Hang with melon string. Elevate potassium feed.',
      notesKm: 'ទុកផ្លែរាងពងក្រពើល្អបំផុត ១ ក្នុងមួយដើម។ ចងព្យួរខ្សែ។ បន្ថែមជីប៉ូតាស្យូម។'
    },
    {
      id: 'task-plota-7-harvest',
      titleEn: 'Refractometer Sugar Brix Test & Harvest Quality Sorting',
      titleKm: 'វាស់កម្រិតជាតិស្ករ Brix & ប្រមូលផលផ្លែត្រសក់ផ្អែមមាស',
      type: 'harvest',
      date: '2027-01-02',
      time: '06:00',
      plotId: 'plot-1791709016912',
      batchId: 'cycle-plot-a-2026-m1',
      stageKey: 'harvest',
      status: 'pending',
      assignedWorker: 'Harvest Crew & Lead Agronomist',
      priority: 'high',
      dosageOrVolume: 'Target 4,147 kg (4.15 tons)',
      notesEn: 'Cut with T-stem when sugar reaches 15.5° Brix. Grade A sorting & QR packaging.',
      notesKm: 'កាត់ទងរាងអក្សរ T ពេលជាតិស្ករឡើងដល់ ១៥.៥° Brix។ ញែកផ្លែប្រភេទ A និងបិទ QR កូដ។'
    }
  ];

  for (const t of cleanTasks) {
    await conn.query(
      `INSERT INTO tasks (
        id, titleEn, titleKm, type, date, time, plotId, batchId, stageKey,
        status, assignedWorker, priority, dosageOrVolume, notesEn, notesKm,
        isRecurring
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        t.id, t.titleEn, t.titleKm, t.type, t.date, t.time, t.plotId, t.batchId, t.stageKey,
        t.status, t.assignedWorker, t.priority, t.dosageOrVolume, t.notesEn, t.notesKm
      ]
    );
  }
  console.log('Inserted clean tasks for Plot A:', cleanTasks.length);

  console.log('4. Creating active Botanical Standard CropCycle for Plot A...');
  const botanicalStages = [
    {
      id: 'stg-plota-1',
      key: 'seedling',
      nameEn: 'Seedling & Germination',
      nameKm: 'កូនដុះពន្លក & សាបកូន',
      startDate: '2026-10-13',
      endDate: '2026-10-19',
      targetDays: 7,
      status: 'current',
      progress: 25,
      notesEn: 'Germination trays at 28-32°C. Morning sunlight on Day 3. Mild nutrient feed.',
      notesKm: 'រក្សាសីតុណ្ហភាព ២៨-៣២°C។ ហាលថ្ងៃព្រឹកនៅថ្ងៃទី ៣។ ស្រោចជីកម្លាំងស្រាល។'
    },
    {
      id: 'stg-plota-2',
      key: 'transplanting',
      nameEn: 'Transplanting & Rooting',
      nameKm: 'ស្ទូងកូនដំណាំ & ចាក់ឫស',
      startDate: '2026-10-20',
      endDate: '2026-10-26',
      targetDays: 7,
      status: 'upcoming',
      progress: 0,
      notesEn: 'Hardening seedlings 2 days prior. Transplant in late afternoon. Root stimulator application.',
      notesKm: 'បង្ហាត់កូនដំណាំ ២ ថ្ងៃមុនស្ទូង។ ស្ទូងពេលរសៀលត្រជាក់។ បញ្ចូលថ្នាំជំនួយឫស។'
    },
    {
      id: 'stg-plota-3',
      key: 'vine_growth',
      nameEn: 'Vine & Foliage Growth',
      nameKm: 'ការលូតលាស់ដើម & ស្លឹក',
      startDate: '2026-10-27',
      endDate: '2026-11-15',
      targetDays: 20,
      status: 'upcoming',
      progress: 0,
      notesEn: 'Vertical vine trellising with clips. Lateral shoot pruning below node 8. High-N balanced fertigation.',
      notesKm: 'ចងដើមឡើងត្រង់តាមខ្សែ។ កាត់ខ្នែងចំហៀងក្រោមថ្នាំងទី ៨ ចេញ។ បញ្ចូលជីអាសូត និងប៉ូតាស្យូម។'
    },
    {
      id: 'stg-plota-4',
      key: 'flowering',
      nameEn: 'Flowering & Budding',
      nameKm: 'ចេញផ្កា & ក្តិប',
      startDate: '2026-11-16',
      endDate: '2026-11-27',
      targetDays: 12,
      status: 'upcoming',
      progress: 0,
      notesEn: 'Select flower nodes 9 to 13 for retention. Clean walkways and ventilate. Foliar spray Boron + Calcium.',
      notesKm: 'ជ្រើសរើសផ្កាថ្នាំងទី ៩ ដល់ ១៣ ទុកបង្កាត់។ សម្អាតផ្ទះសំណាញ់ និងបើកខ្យល់។ បាញ់ជីបំប៉នបូរ៉ុន + កាល់ស្យូម។'
    },
    {
      id: 'stg-plota-5',
      key: 'pollination',
      nameEn: 'Artificial Pollination',
      nameKm: 'ការបង្កាត់លម្អងផ្កា',
      startDate: '2026-11-28',
      endDate: '2026-12-11',
      targetDays: 14,
      status: 'upcoming',
      progress: 0,
      notesEn: 'Hand pollination 06:30 AM - 10:30 AM. Pollinate 2-3 female flowers per vine. Attach colored date tags.',
      notesKm: 'បង្កាត់ដោយដៃ ០៦:៣០ - ១០:៣០ ព្រឹក។ បង្កាត់ផ្កាញី ២-៣ ក្នុងមួយដើម។ ចងស្លាកពណ៌កត់ត្រាកាលបរិច្ឆេទ។'
    },
    {
      id: 'stg-plota-6',
      key: 'fruit_development',
      nameEn: 'Fruit Expansion & Netting',
      nameKm: 'ពង្រីកផ្លែ & បង្កើតក្រឡា',
      startDate: '2026-12-12',
      endDate: '2026-12-31',
      targetDays: 20,
      status: 'upcoming',
      progress: 0,
      notesEn: 'Fruit thinning: retain single prime melon per plant. Hang fruit with melon rope or mesh hammock. Elevated Potassium & Calcium.',
      notesKm: 'ជ្រើសរើសផ្លែស្អាត ១ គ្រាប់ក្នុងមួយដើម។ ចងព្យួរផ្លែដោយខ្សែចំណង ឬសំណាញ់។ បង្កើនជីប៉ូតាស្យូម និងកាល់ស្យូមបង្កើតក្រឡា។'
    },
    {
      id: 'stg-plota-7',
      key: 'harvest',
      nameEn: 'Ripening & Harvesting',
      nameKm: 'ទុំ & ប្រមូលផល',
      startDate: '2027-01-01',
      endDate: '2027-01-10',
      targetDays: 10,
      status: 'upcoming',
      progress: 0,
      notesEn: 'Brix refractometer sampling. Aroma and stem slip inspection. T-stem cutting in cool early morning.',
      notesKm: 'វាស់កម្រិតផ្អែម Brix។ ពិនិត្យក្លិនក្រអូប និងស្នាមប្រេះទង។ កាត់ទងផ្លែរាងអក្សរ T នៅពេលព្រលឹមត្រជាក់។'
    }
  ];

  await conn.query('DELETE FROM crop_cycles');
  await conn.query(
    `INSERT INTO crop_cycles (
      id, name, batchNumber, plotId, variety, sowingDate, transplantDate,
      harvestWindowStart, harvestWindowEnd, stages, status, targetYieldTons,
      assignedAgronomist, currentStageKey
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'cycle-plot-a-2026-m1',
      'Golden Honeydew Batch 2026-M1',
      'BATCH-2026-M1',
      'plot-1791709016912',
      'Golden Honeydew (Inthanon F1)',
      '2026-10-13',
      '2026-10-20',
      '2027-01-01',
      '2027-01-12',
      JSON.stringify(botanicalStages),
      'active',
      4.15,
      'Samban Srey',
      'seedling'
    ]
  );
  console.log('Inserted active Botanical Standard CropCycle for Plot A!');

  await conn.end();
  console.log('Done!');
}

run().catch(console.error);
