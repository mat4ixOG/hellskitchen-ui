/**
 * The categorical palette, and the rules that keep it honest.
 *
 * These eight hues and their *order* were validated with the data-viz
 * validator in both light and dark: the ordering is the colour-blind-safety
 * mechanism, not a cosmetic choice. Adjacent pairs clear the CVD separation
 * gate (ΔE ≥ 8, OKLab ×100) and the normal-vision floor (ΔE ≥ 15).
 *
 * It is the reference order rotated so the brand red leads — every original
 * adjacency is preserved and only red↔blue is new, which is why it still
 * passes. Reordering it further is not safe without re-running the validator:
 * green beside orange, for instance, collapses to ΔE 3.2 under protanopia.
 *
 * Three light-mode slots sit below 3:1 contrast on a light surface, so the
 * charts ship visible labels and a table view — that relief is required, not
 * optional.
 */

export const HK_SERIES_LIGHT = [
  '#dc2626', // 1 red — brand
  '#2a78d6', // 2 blue
  '#eb6834', // 3 orange
  '#1baf7a', // 4 aqua
  '#eda100', // 5 yellow
  '#e87ba4', // 6 magenta
  '#008300', // 7 green
  '#4a3aa7'  // 8 violet
] as const;

/** The same eight hues stepped for a dark surface, validated as a set. */
export const HK_SERIES_DARK = [
  '#dc2626',
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9'
] as const;

/** Sequential ramp for magnitude: one hue, light to dark. Never a rainbow. */
export const HK_SEQUENTIAL = [
  '#fee2e2',
  '#fca5a5',
  '#f87171',
  '#ef4444',
  '#dc2626',
  '#b91c1c',
  '#7f1d1d'
] as const;

/**
 * Reserved for state. Never reused as "series 9", and always shipped with an
 * icon or label rather than colour alone.
 */
export const HK_STATUS = {
  good: '#008300',
  warning: '#eda100',
  serious: '#eb6834',
  critical: '#dc2626'
} as const;

export const HK_MAX_SERIES = HK_SERIES_LIGHT.length;

/**
 * Colour for a slot. Past the eighth the palette is *not* cycled — a generated
 * ninth hue is indistinguishable from an existing slot under CVD. Callers fold
 * the tail into "Other" instead; this returns a neutral for that bucket.
 */
export function seriesColor(index: number, dark = false): string {
  const palette = dark ? HK_SERIES_DARK : HK_SERIES_LIGHT;
  return index < palette.length ? palette[index] : dark ? '#8a8a94' : '#6b7280';
}
