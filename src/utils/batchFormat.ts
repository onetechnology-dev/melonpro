/**
 * Batch Formatting Utilities for MelonPro
 * Standard format:
 *   Batch Name: Cultivar_name-Sowing_Date-plot_namexx (e.g. Mel 2777-20260920-A01)
 *   Batch Code: sowing_date-plot_namexx (e.g. 20260920-A01)
 */

/**
 * Format sowing date into 8-digit YYYYMMDD
 * Example: "2026-09-20" -> "20260920"
 */
export const formatSowingDate = (sowingDate?: string | Date): string => {
  if (!sowingDate) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  if (typeof sowingDate === 'string') {
    const cleaned = sowingDate.trim();
    // If format is YYYY-MM-DD or YYYY/MM/DD
    const parts = cleaned.split(/[-/]/);
    if (parts.length === 3 && parts[0].length === 4) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].slice(0, 2).padStart(2, '0');
      return `${y}${m}${d}`;
    }
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length >= 8) {
      return digits.slice(0, 8);
    }
  }

  const d = new Date(sowingDate);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${dt}`;
  }

  return '20260920';
};

/**
 * Format plot and facility into plot_namexx
 * Examples:
 *   - Plot A (Zone 1) + Net House 1 -> "A01"
 *   - Plot A (Zone 1) + Net House 2 -> "A02"
 *   - Plot B (Zone 2) + Net House 1 -> "B01"
 *   - Plot H + Facility 1           -> "H01"
 */
export const formatPlotCode = (
  plotNameOrCode?: string,
  facilityName?: string,
  facilityIndex?: number
): string => {
  // 1. Determine plot identifier letter/code
  let plotLetter = 'A';
  if (plotNameOrCode) {
    const trimmed = plotNameOrCode.trim();
    // Match "Plot A", "Plot B", "Plot H", etc.
    const plotMatch = trimmed.match(/Plot\s*([A-Za-z0-9]+)/i);
    if (plotMatch && plotMatch[1]) {
      plotLetter = plotMatch[1].toUpperCase();
    } else {
      // Check code like PL-01 or PL-A
      const codeMatch = trimmed.match(/PL-?([A-Za-z0-9]+)/i);
      if (codeMatch && codeMatch[1]) {
        // If code is PL-01, check if we can infer letter (01->A, 02->B, etc.)
        const parsedNum = parseInt(codeMatch[1], 10);
        if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 26) {
          plotLetter = String.fromCharCode(64 + parsedNum);
        } else {
          plotLetter = codeMatch[1].toUpperCase();
        }
      } else {
        const cleanAlpha = trimmed.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanAlpha) {
          plotLetter = cleanAlpha.slice(0, 2).toUpperCase();
        }
      }
    }
  }

  // 2. Determine 2-digit number (xx)
  let numStr = '01';
  if (facilityIndex !== undefined && facilityIndex >= 0) {
    numStr = String(facilityIndex + 1).padStart(2, '0');
  } else if (facilityName) {
    // Check for digits in facility name (including Khmer numeral characters)
    const khmerDigits: Record<string, string> = {
      '០': '0', '១': '1', '២': '2', '៣': '3', '៤': '4',
      '៥': '5', '៦': '6', '៧': '7', '៨': '8', '៩': '9'
    };
    let normalized = facilityName;
    for (const [k, v] of Object.entries(khmerDigits)) {
      normalized = normalized.replaceAll(k, v);
    }
    const matchNum = normalized.match(/(\d+)/);
    if (matchNum && matchNum[1]) {
      numStr = String(parseInt(matchNum[1], 10)).padStart(2, '0');
    }
  }

  return `${plotLetter}${numStr}`;
};

/**
 * Format cultivar name from variety string or preset name
 * Examples:
 *   - "Mel 2777" -> "Mel 2777"
 *   - "Golden Honeydew (Inthanon F1)" -> "Inthanon F1"
 *   - "Japanese Crown Melon (Aruse)" -> "Aruse"
 *   - "Sweet Cantaloupe (Sun Jewel)" -> "Sun Jewel"
 *   - "Hami Melon (Honey Crisp)"     -> "Honey Crisp"
 *   - "Pearl White Melon (Snow Ball)"-> "Snow Ball"
 */
export const formatCultivarName = (varietyOrPresetName?: string): string => {
  if (!varietyOrPresetName || !varietyOrPresetName.trim()) {
    return 'Mel 2777';
  }

  const trimmed = varietyOrPresetName.trim();

  // If already "Mel 2777" or starts with "Mel "
  if (/^mel\s+\d+/i.test(trimmed)) {
    return trimmed;
  }

  // If contains parenthesized cultivar code (e.g. Inthanon F1)
  const parenMatch = trimmed.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1].trim()) {
    return parenMatch[1].trim();
  }

  // If no parenthesis, return trimmed name
  return trimmed;
};

/**
 * Generate Batch Code: sowing_date-plot_namexx
 * Example: 20260920-A01
 */
export const generateBatchCode = (
  sowingDate?: string | Date,
  plotNameOrCode?: string,
  facilityName?: string,
  facilityIndex?: number
): string => {
  const datePart = formatSowingDate(sowingDate);
  const plotPart = formatPlotCode(plotNameOrCode, facilityName, facilityIndex);
  return `${datePart}-${plotPart}`;
};

/**
 * Generate Batch Name: Cultivar_name-Sowing_Date-plot_namexx
 * Example: Mel 2777-20260920-A01
 */
export const generateBatchName = (
  cultivarName?: string,
  sowingDate?: string | Date,
  plotNameOrCode?: string,
  facilityName?: string,
  facilityIndex?: number
): string => {
  const cultivarPart = formatCultivarName(cultivarName);
  const codePart = generateBatchCode(sowingDate, plotNameOrCode, facilityName, facilityIndex);
  return `${cultivarPart}-${codePart}`;
};
