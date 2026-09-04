/**
 * Public type surface for the `hk-*-chart` family.
 *
 * Charts here are plain SVG built from TypeScript maths — no charting
 * dependency. That keeps them themeable with the same token layer as every
 * other component, tree-shakeable, and inspectable in devtools as real DOM.
 */

export interface HkPoint {
  /** Category or time position. Strings are treated as ordinal categories. */
  x: string | number | Date;
  /** Measured value. `null` breaks the line rather than drawing through zero. */
  y: number | null;
}

export interface HkSeries {
  /** Identity. Colour follows this, never the series' current rank. */
  id: string;
  label: string;
  data: HkPoint[];
  /** Overrides the palette slot. Use sparingly — the slot order is CVD-safe. */
  color?: string;
  /** Draws the area wash under a line. */
  area?: boolean;
  /** Renders dashed. A secondary channel, for when colour alone is not enough. */
  dashed?: boolean;
}

export type HkAxisFormat = (value: number) => string;

export interface HkAxisConfig {
  label?: string;
  /** Force the domain. Otherwise derived from the data, extended to nice ticks. */
  min?: number;
  max?: number;
  /** Approximate tick count. The real count is rounded to human numbers. */
  ticks?: number;
  format?: HkAxisFormat;
  /** Hide the axis line and labels but keep the space. */
  hidden?: boolean;
}

/** A resolved tick: its value and where it sits in pixels. */
export interface HkTick {
  value: number;
  position: number;
  label: string;
}

/** Plot geometry after margins are subtracted. */
export interface HkPlotArea {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface HkChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** One entry in the hover readout. */
export interface HkTooltipRow {
  id: string;
  label: string;
  color: string;
  value: number | null;
  formatted: string;
}

export interface HkTooltipState {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  rows: HkTooltipRow[];
}

export type HkBarLayout = 'grouped' | 'stacked';
export type HkBarOrientation = 'vertical' | 'horizontal';

/** Emitted when a mark is activated. */
export interface HkChartPointEvent {
  seriesId: string;
  index: number;
  point: HkPoint;
}
