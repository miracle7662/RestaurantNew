export const boolToNumber = (value: boolean | number | undefined): number => {
  if (typeof value === 'boolean') return value ? 1 : 0
  return value ?? 0
}