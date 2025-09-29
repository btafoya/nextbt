// /lib/mantis-enums.ts
import { appConfig } from "@/config/app.config";

/**
 * Parse MantisBT enum string format: "10:label1,20:label2,30:label3"
 * Returns a Map of value -> label
 */
function parseEnumString(enumString: string): Map<number, string> {
  const map = new Map<number, string>();
  const pairs = enumString.split(',');

  for (const pair of pairs) {
    const [valueStr, label] = pair.split(':');
    const value = parseInt(valueStr, 10);
    if (!isNaN(value) && label) {
      map.set(value, label);
    }
  }

  return map;
}

// Parse severity enum from config
const severityMap = parseEnumString(appConfig.severityEnum);

/**
 * Get severity label for a given severity value
 */
export function getSeverityLabel(severity: number): string {
  return severityMap.get(severity) || `Unknown (${severity})`;
}

/**
 * Get all severity options for forms/filters
 */
export function getAllSeverities(): Array<{ value: number; label: string }> {
  return Array.from(severityMap.entries()).map(([value, label]) => ({
    value,
    label: label.charAt(0).toUpperCase() + label.slice(1)
  }));
}