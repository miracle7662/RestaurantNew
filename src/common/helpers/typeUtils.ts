/**
 * Utility functions for safe type extraction from API responses
 */

/**
 * Safely extracts a number from a value that might be undefined or null.
 * Returns a default value if the input is invalid.
 * 
 * @param value - The value to extract (may be number, undefined, or null)
 * @param defaultValue - The default value to return if extraction fails (defaults to 0)
 * @returns The extracted number or default value
 * 
 * @example
 * getNumber(undefined) // returns 0
 * getNumber(100) // returns 100
 * getNumber(null, 10) // returns 10
 * getNumber("50", 0) // returns 50 (parses string)
 * getNumber("invalid", 0) // returns 0 (falls back on parse failure)
 */
export function getNumber(value: number | undefined | null, defaultValue: number = 0): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  // If it's already a valid number, return it
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  return defaultValue;
}

/**
 * Safely extracts a number from an object property that might be undefined.
 * This is useful for API responses where fields are optional.
 * 
 * @param obj - The object to extract the value from
 * @param key - The property key to extract
 * @param defaultValue - The default value to return if extraction fails
 * @returns The extracted number or default value
 * 
 * @example
 * const header = { Amount: 100 };
 * getNumberProp(header, 'Amount') // returns 100
 * getNumberProp(header, 'Discount') // returns 0 (default)
 * getNumberProp(header, 'Discount', 10) // returns 10 (custom default)
 */
export function getNumberProp<T extends object>(
  obj: T, 
  key: keyof T, 
  defaultValue: number = 0
): number {
  const value = obj[key];
  return getNumber(value as number | undefined | null, defaultValue);
}

/**
 * Type guard to check if a value is a valid number
 * 
 * @param value - The value to check
 * @returns True if the value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Safely extracts a string from a value that might be undefined or null.
 * 
 * @param value - The value to extract (may be string, undefined, or null)
 * @param defaultValue - The default value to return if extraction fails (defaults to '')
 * @returns The extracted string or default value
 */
export function getString(value: string | undefined | null, defaultValue: string = ''): string {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return value;
}

/**
 * Safely extracts a boolean from a value that might be undefined or null.
 * 
 * @param value - The value to extract (may be boolean, undefined, or null)
 * @param defaultValue - The default value to return if extraction fails (defaults to false)
 * @returns The extracted boolean or default value
 */
export function getBoolean(value: boolean | undefined | null, defaultValue: boolean = false): boolean {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return value;
}
