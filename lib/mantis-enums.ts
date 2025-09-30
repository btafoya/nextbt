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

// Parse enums from config
const statusMap = parseEnumString(appConfig.statusEnum);
const priorityMap = parseEnumString(appConfig.priorityEnum);
const severityMap = parseEnumString(appConfig.severityEnum);
const reproducibilityMap = parseEnumString(appConfig.reproducibilityEnum);

// Status helpers
export function getStatusLabel(status: number): string {
  return statusMap.get(status) || `Unknown (${status})`;
}

export function getAllStatuses(): Array<{ value: number; label: string }> {
  return Array.from(statusMap.entries()).map(([value, label]) => ({
    value,
    label: label.charAt(0).toUpperCase() + label.slice(1).replace(/_/g, ' ')
  }));
}

// Priority helpers
export function getPriorityLabel(priority: number): string {
  return priorityMap.get(priority) || `Unknown (${priority})`;
}

export function getAllPriorities(): Array<{ value: number; label: string }> {
  return Array.from(priorityMap.entries()).map(([value, label]) => ({
    value,
    label: label.charAt(0).toUpperCase() + label.slice(1)
  }));
}

// Severity helpers
export function getSeverityLabel(severity: number): string {
  return severityMap.get(severity) || `Unknown (${severity})`;
}

export function getAllSeverities(): Array<{ value: number; label: string }> {
  return Array.from(severityMap.entries()).map(([value, label]) => ({
    value,
    label: label.charAt(0).toUpperCase() + label.slice(1)
  }));
}

// Reproducibility helpers
export function getReproducibilityLabel(reproducibility: number): string {
  return reproducibilityMap.get(reproducibility) || `Unknown (${reproducibility})`;
}

export function getAllReproducibilities(): Array<{ value: number; label: string }> {
  return Array.from(reproducibilityMap.entries()).map(([value, label]) => ({
    value,
    label: label.charAt(0).toUpperCase() + label.slice(1).replace(/_/g, ' ')
  }));
}