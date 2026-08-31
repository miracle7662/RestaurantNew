export type ThermalPrinterLayout = {
  paperWidth: number
  leftMargin: number
  rightMargin: number
}

export const DEFAULT_THERMAL_PRINTER_LAYOUT: ThermalPrinterLayout = {
  paperWidth: 80,
  leftMargin: 2,
  rightMargin: 2,
}

const parseNonNegative = (value: unknown, fallback: number): number => {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

const parseWidthFromSize = (size: unknown): number | null => {
  const match = String(size ?? '').match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Resolve per-outlet thermal layout from bill_printer_settings (or defaults). */
export const resolveThermalPrinterLayout = (
  data?: {
    paper_width?: number | string | null
    size?: string | null
    left_margin?: number | string | null
    right_margin?: number | string | null
  } | null,
): ThermalPrinterLayout => {
  const fromPaperWidth = data?.paper_width != null && data.paper_width !== ''
    ? Number(data.paper_width)
    : NaN
  const fromSize = parseWidthFromSize(data?.size)
  const paperWidth = Number.isFinite(fromPaperWidth) && fromPaperWidth > 0
    ? fromPaperWidth
    : (fromSize ?? DEFAULT_THERMAL_PRINTER_LAYOUT.paperWidth)

  return {
    paperWidth,
    leftMargin: parseNonNegative(data?.left_margin, DEFAULT_THERMAL_PRINTER_LAYOUT.leftMargin),
    rightMargin: parseNonNegative(data?.right_margin, DEFAULT_THERMAL_PRINTER_LAYOUT.rightMargin),
  }
}

export const getThermalContentWidth = (layout: ThermalPrinterLayout): number =>
  Math.max(layout.paperWidth - layout.leftMargin - layout.rightMargin, 1)

export const mm = (value: number): string => `${value}mm`
