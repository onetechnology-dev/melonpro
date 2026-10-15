-- MelonPro V1 Database Schema
-- Database: melonpro_v1

CREATE DATABASE IF NOT EXISTS `melonpro_v1` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `melonpro_v1`;

-- 0. Farms Table
CREATE TABLE IF NOT EXISTS `farms` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `nameKm` VARCHAR(255) DEFAULT '',
  `code` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) NOT NULL DEFAULT '',
  `leadAgronomist` VARCHAR(255) DEFAULT '',
  `contactPhone` VARCHAR(100) DEFAULT '',
  `totalAreaHa` DOUBLE NOT NULL DEFAULT 0,
  `description` TEXT DEFAULT NULL,
  `descriptionKm` TEXT DEFAULT NULL,
  `center` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`center`)),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1. Plots Table
CREATE TABLE IF NOT EXISTS `plots` (
  `id` VARCHAR(128) NOT NULL,
  `farmId` VARCHAR(128) NOT NULL DEFAULT 'farm-1',
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(255) NOT NULL,
  `areaHa` DOUBLE NOT NULL DEFAULT 0,
  `facilityType` VARCHAR(100) NOT NULL DEFAULT 'net_house',
  `facilityTypes` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`facilityTypes`)),
  `melonVarietyEn` VARCHAR(255) NOT NULL DEFAULT '',
  `melonVarietyKm` VARCHAR(255) NOT NULL DEFAULT '',
  `melonType` VARCHAR(100) NOT NULL DEFAULT 'honeydew',
  `plantCount` INT NOT NULL DEFAULT 0,
  `sowingDate` VARCHAR(50) NOT NULL DEFAULT '',
  `transplantingDate` VARCHAR(50) NOT NULL DEFAULT '',
  `expectedHarvestDate` VARCHAR(50) NOT NULL DEFAULT '',
  `currentStage` VARCHAR(100) NOT NULL DEFAULT 'seedling',
  `healthScore` DOUBLE NOT NULL DEFAULT 100,
  `healthStatus` VARCHAR(100) NOT NULL DEFAULT 'optimal',
  `soilMoisture` DOUBLE NOT NULL DEFAULT 0,
  `soilEc` DOUBLE NOT NULL DEFAULT 0,
  `soilPh` DOUBLE NOT NULL DEFAULT 0,
  `ambientTemp` DOUBLE NOT NULL DEFAULT 0,
  `humidity` DOUBLE NOT NULL DEFAULT 0,
  `irrigationStatus` VARCHAR(50) NOT NULL DEFAULT 'off',
  `nextIrrigationTime` VARCHAR(50) NOT NULL DEFAULT '',
  `qrCodeId` VARCHAR(255) NOT NULL DEFAULT '',
  `color` VARCHAR(50) DEFAULT '#16A34A',
  `center` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`center`)),
  `polygonCoords` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`polygonCoords`)),
  `shapes` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`shapes`)),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Crop Cycles Table
CREATE TABLE IF NOT EXISTS `crop_cycles` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `batchNumber` VARCHAR(255) NOT NULL,
  `plotId` VARCHAR(128) NOT NULL,
  `variety` VARCHAR(255) NOT NULL DEFAULT '',
  `sowingDate` VARCHAR(50) NOT NULL DEFAULT '',
  `transplantDate` VARCHAR(50) NOT NULL DEFAULT '',
  `harvestWindowStart` VARCHAR(50) NOT NULL DEFAULT '',
  `harvestWindowEnd` VARCHAR(50) NOT NULL DEFAULT '',
  `stages` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`stages`)),
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `targetYieldTons` DOUBLE DEFAULT NULL,
  `assignedAgronomist` VARCHAR(255) DEFAULT NULL,
  `currentStageKey` VARCHAR(100) DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_plotId` (`plotId`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Crop Varieties Presets Table
CREATE TABLE IF NOT EXISTS `crop_varieties` (
  `id` VARCHAR(128) NOT NULL,
  `nameEn` VARCHAR(255) NOT NULL,
  `nameKm` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'honeydew',
  `daysToMaturity` INT NOT NULL DEFAULT 75,
  `seedlingDays` INT NOT NULL DEFAULT 7,
  `transplantDays` INT NOT NULL DEFAULT 7,
  `vineGrowthDays` INT NOT NULL DEFAULT 20,
  `floweringDays` INT NOT NULL DEFAULT 12,
  `pollinationDays` INT NOT NULL DEFAULT 14,
  `fruitDevDays` INT NOT NULL DEFAULT 20,
  `harvestDays` INT NOT NULL DEFAULT 10,
  `targetBrix` DOUBLE NOT NULL DEFAULT 14.0,
  `idealEc` DOUBLE NOT NULL DEFAULT 1.8,
  `idealPh` DOUBLE NOT NULL DEFAULT 6.4,
  `plantSpacingCm` DOUBLE NOT NULL DEFAULT 40,
  `expectedYieldKgPerPlant` DOUBLE NOT NULL DEFAULT 1.8,
  `nettingRequired` TINYINT(1) NOT NULL DEFAULT 0,
  `color` VARCHAR(50) NOT NULL DEFAULT '#EAB308',
  `descriptionEn` TEXT DEFAULT NULL,
  `descriptionKm` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(128) NOT NULL,
  `titleEn` VARCHAR(255) NOT NULL,
  `titleKm` VARCHAR(255) NOT NULL,
  `type` VARCHAR(100) NOT NULL DEFAULT 'watering',
  `date` VARCHAR(50) NOT NULL,
  `time` VARCHAR(50) DEFAULT NULL,
  `plotId` VARCHAR(128) NOT NULL,
  `batchId` VARCHAR(255) NOT NULL DEFAULT '',
  `stageKey` VARCHAR(100) NOT NULL DEFAULT 'vine_growth',
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `assignedWorker` VARCHAR(255) NOT NULL DEFAULT '',
  `priority` VARCHAR(50) NOT NULL DEFAULT 'medium',
  `dosageOrVolume` VARCHAR(255) DEFAULT NULL,
  `notesEn` TEXT DEFAULT NULL,
  `notesKm` TEXT DEFAULT NULL,
  `isRecurring` TINYINT(1) DEFAULT 0,
  `recurringFrequency` VARCHAR(50) DEFAULT NULL,
  `completedAt` VARCHAR(50) DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_plotId` (`plotId`),
  KEY `idx_date` (`date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Monitoring Records Table
CREATE TABLE IF NOT EXISTS `monitoring_records` (
  `id` VARCHAR(128) NOT NULL,
  `plotId` VARCHAR(128) NOT NULL,
  `recordedAt` VARCHAR(100) NOT NULL,
  `recordedBy` VARCHAR(255) NOT NULL DEFAULT '',
  `source` VARCHAR(50) NOT NULL DEFAULT 'manual',
  `soilMoisture` DOUBLE NOT NULL DEFAULT 0,
  `temperature` DOUBLE NOT NULL DEFAULT 0,
  `humidity` DOUBLE NOT NULL DEFAULT 0,
  `irrigationVolumeLiters` DOUBLE DEFAULT NULL,
  `plantHealthRating` DOUBLE NOT NULL DEFAULT 5,
  `pestObservationEn` TEXT DEFAULT NULL,
  `pestObservationKm` TEXT DEFAULT NULL,
  `pestSeverity` VARCHAR(50) NOT NULL DEFAULT 'none',
  `photoUrl` LONGTEXT DEFAULT NULL,
  `photoCaption` TEXT DEFAULT NULL,
  `notesEn` TEXT DEFAULT NULL,
  `notesKm` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_plotId` (`plotId`),
  KEY `idx_recordedAt` (`recordedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Harvest Records Table
CREATE TABLE IF NOT EXISTS `harvest_records` (
  `id` VARCHAR(128) NOT NULL,
  `plotId` VARCHAR(128) NOT NULL,
  `batchId` VARCHAR(255) NOT NULL DEFAULT '',
  `harvestDate` VARCHAR(50) NOT NULL,
  `totalWeightKg` DOUBLE NOT NULL DEFAULT 0,
  `fruitCount` INT NOT NULL DEFAULT 0,
  `averageWeightKg` DOUBLE NOT NULL DEFAULT 0,
  `brixSugarDegree` DOUBLE NOT NULL DEFAULT 0,
  `gradeA_Percent` DOUBLE NOT NULL DEFAULT 0,
  `gradeB_Percent` DOUBLE NOT NULL DEFAULT 0,
  `gradeC_Percent` DOUBLE NOT NULL DEFAULT 0,
  `actualYieldTonsPerHa` DOUBLE NOT NULL DEFAULT 0,
  `targetYieldTonsPerHa` DOUBLE NOT NULL DEFAULT 0,
  `recordedBy` VARCHAR(255) NOT NULL DEFAULT '',
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_plotId` (`plotId`),
  KEY `idx_harvestDate` (`harvestDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. AI Recommendations Table
CREATE TABLE IF NOT EXISTS `recommendations` (
  `id` VARCHAR(128) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'irrigation',
  `titleEn` VARCHAR(255) NOT NULL,
  `titleKm` VARCHAR(255) NOT NULL,
  `valueEn` VARCHAR(255) NOT NULL,
  `valueKm` VARCHAR(255) NOT NULL,
  `detailEn` TEXT NOT NULL,
  `detailKm` TEXT NOT NULL,
  `riskLevel` VARCHAR(50) NOT NULL DEFAULT 'info',
  `supportedByRecords` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`supportedByRecords`)),
  `suggestedAction` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`suggestedAction`)),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Farm Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(128) NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'reminder',
  `titleEn` VARCHAR(255) NOT NULL,
  `titleKm` VARCHAR(255) NOT NULL,
  `messageEn` TEXT NOT NULL,
  `messageKm` TEXT NOT NULL,
  `timestamp` VARCHAR(100) NOT NULL,
  `isRead` TINYINT(1) NOT NULL DEFAULT 0,
  `actionUrl` VARCHAR(255) DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Stock Items Table
CREATE TABLE IF NOT EXISTS `stock_items` (
  `id` VARCHAR(128) NOT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `barcode` VARCHAR(100) DEFAULT NULL,
  `nameEn` VARCHAR(255) NOT NULL,
  `nameKm` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'seeds',
  `unit` VARCHAR(100) NOT NULL DEFAULT 'pcs',
  `quantity` DOUBLE NOT NULL DEFAULT 0,
  `minThreshold` DOUBLE NOT NULL DEFAULT 0,
  `maxThreshold` DOUBLE DEFAULT NULL,
  `unitCost` DOUBLE NOT NULL DEFAULT 0,
  `sellingPrice` DOUBLE DEFAULT NULL,
  `location` VARCHAR(255) NOT NULL DEFAULT '',
  `status` VARCHAR(50) NOT NULL DEFAULT 'in_stock',
  `supplierId` VARCHAR(128) DEFAULT NULL,
  `supplierName` VARCHAR(255) DEFAULT NULL,
  `dosageOrUsage` TEXT DEFAULT NULL,
  `brand` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `isSaleItem` TINYINT(1) DEFAULT 0,
  `lastUpdated` VARCHAR(100) NOT NULL DEFAULT '',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sku` (`sku`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Purchase Orders Table
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` VARCHAR(128) NOT NULL,
  `poNumber` VARCHAR(100) NOT NULL,
  `supplierId` VARCHAR(128) NOT NULL,
  `supplierName` VARCHAR(255) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `expectedDate` VARCHAR(50) DEFAULT NULL,
  `items` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `totalAmount` DOUBLE NOT NULL DEFAULT 0,
  `paidAmount` DOUBLE NOT NULL DEFAULT 0,
  `paymentStatus` VARCHAR(50) NOT NULL DEFAULT 'unpaid',
  `orderStatus` VARCHAR(50) NOT NULL DEFAULT 'ordered',
  `paymentMethod` VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_poNumber` (`poNumber`),
  KEY `idx_supplierId` (`supplierId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Sales Orders Table
CREATE TABLE IF NOT EXISTS `sales_orders` (
  `id` VARCHAR(128) NOT NULL,
  `invoiceNumber` VARCHAR(100) NOT NULL,
  `customerId` VARCHAR(128) NOT NULL,
  `customerName` VARCHAR(255) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `items` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `totalAmount` DOUBLE NOT NULL DEFAULT 0,
  `paidAmount` DOUBLE NOT NULL DEFAULT 0,
  `paymentStatus` VARCHAR(50) NOT NULL DEFAULT 'unpaid',
  `deliveryStatus` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `paymentMethod` VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  `plotOriginId` VARCHAR(128) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invoiceNumber` (`invoiceNumber`),
  KEY `idx_customerId` (`customerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Farmers Table
CREATE TABLE IF NOT EXISTS `farmers` (
  `id` VARCHAR(128) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `nameEn` VARCHAR(255) NOT NULL,
  `nameKm` VARCHAR(255) NOT NULL,
  `role` VARCHAR(100) NOT NULL DEFAULT '',
  `phone` VARCHAR(100) NOT NULL DEFAULT '',
  `email` VARCHAR(255) DEFAULT NULL,
  `assignedPlotIds` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`assignedPlotIds`)),
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `monthlySalary` DOUBLE NOT NULL DEFAULT 0,
  `experienceYears` DOUBLE NOT NULL DEFAULT 0,
  `joinDate` VARCHAR(50) NOT NULL DEFAULT '',
  `specialty` VARCHAR(255) NOT NULL DEFAULT '',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Customers Table
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(128) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `companyName` VARCHAR(255) DEFAULT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'wholesale',
  `phone` VARCHAR(100) NOT NULL DEFAULT '',
  `email` VARCHAR(255) NOT NULL DEFAULT '',
  `address` TEXT NOT NULL,
  `city` VARCHAR(100) NOT NULL DEFAULT '',
  `totalPurchased` DOUBLE NOT NULL DEFAULT 0,
  `balanceDue` DOUBLE NOT NULL DEFAULT 0,
  `paymentTerms` VARCHAR(100) NOT NULL DEFAULT 'Net 30',
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Suppliers Table
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` VARCHAR(128) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'general',
  `contactPerson` VARCHAR(255) NOT NULL DEFAULT '',
  `phone` VARCHAR(100) NOT NULL DEFAULT '',
  `email` VARCHAR(255) NOT NULL DEFAULT '',
  `address` TEXT NOT NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'Cambodia',
  `totalPurchases` DOUBLE NOT NULL DEFAULT 0,
  `currentPayable` DOUBLE NOT NULL DEFAULT 0,
  `rating` DOUBLE NOT NULL DEFAULT 5.0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Financial Accounts Table
CREATE TABLE IF NOT EXISTS `financial_accounts` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'bank',
  `accountNumber` VARCHAR(100) DEFAULT NULL,
  `institution` VARCHAR(255) DEFAULT NULL,
  `balance` DOUBLE NOT NULL DEFAULT 0,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Account Transactions Table
CREATE TABLE IF NOT EXISTS `account_transactions` (
  `id` VARCHAR(128) NOT NULL,
  `transactionNumber` VARCHAR(100) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'expense',
  `category` VARCHAR(100) NOT NULL DEFAULT 'other',
  `amount` DOUBLE NOT NULL DEFAULT 0,
  `accountId` VARCHAR(128) NOT NULL,
  `accountName` VARCHAR(255) NOT NULL,
  `referenceId` VARCHAR(128) DEFAULT NULL,
  `descriptionEn` TEXT NOT NULL,
  `descriptionKm` TEXT NOT NULL,
  `recordedBy` VARCHAR(255) NOT NULL DEFAULT '',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_transactionNumber` (`transactionNumber`),
  KEY `idx_accountId` (`accountId`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Farm Settings Table
CREATE TABLE IF NOT EXISTS `farm_settings` (
  `id` VARCHAR(128) NOT NULL DEFAULT 'default',
  `language` VARCHAR(50) NOT NULL DEFAULT 'en',
  `farmName` VARCHAR(255) NOT NULL DEFAULT 'MelonPro Tech Farm',
  `agronomist` VARCHAR(255) NOT NULL DEFAULT 'Channarith (Lead Agronomist)',
  `location` VARCHAR(255) NOT NULL DEFAULT 'Kandal Province, Cambodia',
  `units` VARCHAR(50) NOT NULL DEFAULT 'metric',
  `notificationsEnabled` TINYINT(1) NOT NULL DEFAULT 1,
  `smartAgEnabled` TINYINT(1) NOT NULL DEFAULT 1,
  `autoDripValveSync` TINYINT(1) NOT NULL DEFAULT 1,
  `weatherLocationId` VARCHAR(100) NOT NULL DEFAULT 'phnom_penh',
  `mapProvider` VARCHAR(50) NOT NULL DEFAULT 'google',
  `googleApiKey` VARCHAR(255) DEFAULT NULL,
  `arcgisApiKey` TEXT DEFAULT NULL,
  `loginBgUrl` LONGTEXT DEFAULT NULL,
  `customStages` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `shapePresets` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`shapePresets`)),
  `projectName` VARCHAR(255) NOT NULL DEFAULT 'MelonPro',
  `footTag` TEXT DEFAULT NULL,
  `showDemoAccounts` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
