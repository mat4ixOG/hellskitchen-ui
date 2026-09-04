import { Type } from '@angular/core';

/**
 * Every catalogue entry maps to a live demo, loaded on demand.
 *
 * The docs page and the homepage showcase both render through this map, so a
 * component can never be documented without something running next to it —
 * and the homepage still only pays for the one demo it is showing.
 */
export const DEMOS: Record<string, () => Promise<Type<unknown>>> = {
  // Forms
  switch: () => import('./switch-demo/switch-demo.component').then((m) => m.SwitchDemoComponent),
  rating: () => import('./rating-demo/rating-demo.component').then((m) => m.RatingDemoComponent),
  input: () => import('./input-demo/input-demo.component').then((m) => m.InputDemoComponent),
  textarea: () => import('./textarea-demo/textarea-demo.component').then((m) => m.TextareaDemoComponent),
  select: () => import('./select-demo/select-demo.component').then((m) => m.SelectDemoComponent),
  'multi-select': () => import('./multi-select-demo/multi-select-demo.component').then((m) => m.MultiSelectDemoComponent),
  combobox: () => import('./combobox-demo/combobox-demo.component').then((m) => m.ComboboxDemoComponent),
  checkbox: () => import('./checkbox-demo/checkbox-demo.component').then((m) => m.CheckboxDemoComponent),
  'radio-group': () => import('./radio-group-demo/radio-group-demo.component').then((m) => m.RadioGroupDemoComponent),
  slider: () => import('./slider-demo/slider-demo.component').then((m) => m.SliderDemoComponent),
  'date-picker': () => import('./date-picker-demo/date-picker-demo.component').then((m) => m.DatePickerDemoComponent),
  'file-drop': () => import('./file-drop-demo/file-drop-demo.component').then((m) => m.FileDropDemoComponent),
  'pin-input': () => import('./pin-input-demo/pin-input-demo.component').then((m) => m.PinInputDemoComponent),
  'form-field': () => import('./form-field-demo/form-field-demo.component').then((m) => m.FormFieldDemoComponent),
  password: () => import('./password-demo/password-demo.component').then((m) => m.PasswordDemoComponent),
  'signup-form': () => import('./signup-form-demo/signup-form-demo.component').then((m) => m.SignupFormDemoComponent),

  // Navigation
  navbar: () => import('./navbar-demo/navbar-demo.component').then((m) => m.NavbarDemoComponent),
  tabs: () => import('./tabs-demo/tabs-demo.component').then((m) => m.TabsDemoComponent),
  stepper: () => import('./stepper-demo/stepper-demo.component').then((m) => m.StepperDemoComponent),
  breadcrumb: () => import('./breadcrumb-demo/breadcrumb-demo.component').then((m) => m.BreadcrumbDemoComponent),
  pagination: () => import('./pagination-demo/pagination-demo.component').then((m) => m.PaginationDemoComponent),
  menu: () => import('./menu-demo/menu-demo.component').then((m) => m.MenuDemoComponent),
  'sidebar-nav': () => import('./sidebar-nav-demo/sidebar-nav-demo.component').then((m) => m.SidebarNavDemoComponent),
  'command-palette': () => import('./command-palette-demo/command-palette-demo.component').then((m) => m.CommandPaletteDemoComponent),

  // Feedback
  toast: () => import('./toast-demo/toast-demo.component').then((m) => m.ToastDemoComponent),
  accordion: () => import('./accordion-demo/accordion-demo.component').then((m) => m.AccordionDemoComponent),
  alert: () => import('./alert-demo/alert-demo.component').then((m) => m.AlertDemoComponent),
  progress: () => import('./progress-demo/progress-demo.component').then((m) => m.ProgressDemoComponent),
  skeleton: () => import('./skeleton-demo/skeleton-demo.component').then((m) => m.SkeletonDemoComponent),
  spinner: () => import('./spinner-demo/spinner-demo.component').then((m) => m.SpinnerDemoComponent),
  'empty-state': () => import('./empty-state-demo/empty-state-demo.component').then((m) => m.EmptyStateDemoComponent),

  // Overlay
  dialog: () => import('./dialog-demo/dialog-demo.component').then((m) => m.DialogDemoComponent),
  drawer: () => import('./drawer-demo/drawer-demo.component').then((m) => m.DrawerDemoComponent),
  popover: () => import('./popover-demo/popover-demo.component').then((m) => m.PopoverDemoComponent),
  tooltip: () => import('./tooltip-demo/tooltip-demo.component').then((m) => m.TooltipDemoComponent),
  confirm: () => import('./confirm-demo/confirm-demo.component').then((m) => m.ConfirmDemoComponent),
  'context-menu': () => import('./context-menu-demo/context-menu-demo.component').then((m) => m.ContextMenuDemoComponent),

  // Layout
  card: () => import('./card-demo/card-demo.component').then((m) => m.CardDemoComponent),
  divider: () => import('./divider-demo/divider-demo.component').then((m) => m.DividerDemoComponent),
  'split-pane': () => import('./split-pane-demo/split-pane-demo.component').then((m) => m.SplitPaneDemoComponent),
  'scroll-area': () => import('./scroll-area-demo/scroll-area-demo.component').then((m) => m.ScrollAreaDemoComponent),
  stack: () => import('./stack-demo/stack-demo.component').then((m) => m.StackDemoComponent),
  'app-shell': () => import('./app-shell-demo/app-shell-demo.component').then((m) => m.AppShellDemoComponent),
  carousel: () => import('./carousel-demo/carousel-demo.component').then((m) => m.CarouselDemoComponent),

  // AI
  chatbot: () => import('./chatbot-demo/chatbot-demo.component').then((m) => m.ChatbotDemoComponent),

  // Data
  table: () => import('./table-demo/table-demo.component').then((m) => m.TableDemoComponent),
  tree: () => import('./tree-demo/tree-demo.component').then((m) => m.TreeDemoComponent),
  tag: () => import('./tag-demo/tag-demo.component').then((m) => m.TagDemoComponent),
  badge: () => import('./badge-demo/badge-demo.component').then((m) => m.BadgeDemoComponent),
  avatar: () => import('./avatar-demo/avatar-demo.component').then((m) => m.AvatarDemoComponent),
  timeline: () => import('./timeline-demo/timeline-demo.component').then((m) => m.TimelineDemoComponent),
  stat: () => import('./stat-demo/stat-demo.component').then((m) => m.StatDemoComponent),

  button: () => import('./button-demo/button-demo.component').then((m) => m.ButtonDemoComponent),

  // Charts — one stage component serves every chart type.
  'line-chart': () => import('./charts-demo/charts-demo.component').then((m) => m.ChartsDemoComponent),
  'bar-chart': () => import('./charts-demo/charts-demo.component').then((m) => m.ChartsDemoComponent),

  // Backgrounds — one stage component serves all eight.
  aurora: () => import('./backgrounds-demo/backgrounds-demo.component').then((m) => m.BackgroundsDemoComponent),
  'particle-field': () => import('./backgrounds-demo/backgrounds-demo.component').then((m) => m.BackgroundsDemoComponent),
  beams: () => import('./backgrounds-demo/backgrounds-demo.component').then((m) => m.BackgroundsDemoComponent),
  waves: () => import('./backgrounds-demo/backgrounds-demo.component').then((m) => m.BackgroundsDemoComponent),
  'dot-matrix': () => import('./backgrounds-demo/backgrounds-demo.component').then((m) => m.BackgroundsDemoComponent),
  'grid-motion': () => import('./backgrounds-demo/backgrounds-demo.component').then((m) => m.BackgroundsDemoComponent),
  dither: () => import('./backgrounds-demo/backgrounds-demo.component').then((m) => m.BackgroundsDemoComponent),
  spotlight: () => import('./backgrounds-demo/backgrounds-demo.component').then((m) => m.BackgroundsDemoComponent),

  // Utility
  reveal: () => import('./reveal-demo/reveal-demo.component').then((m) => m.RevealDemoComponent),
  'count-up': () => import('./count-up-demo/count-up-demo.component').then((m) => m.CountUpDemoComponent),
  clipboard: () => import('./clipboard-demo/clipboard-demo.component').then((m) => m.ClipboardDemoComponent),
  hotkey: () => import('./hotkey-demo/hotkey-demo.component').then((m) => m.HotkeyDemoComponent),
  theme: () => import('./theme-demo/theme-demo.component').then((m) => m.ThemeDemoComponent),
  intersect: () => import('./intersect-demo/intersect-demo.component').then((m) => m.IntersectDemoComponent)
};

/**
 * Demos that need more room than the docs prose column. The docs page is
 * capped at `max-w-3xl` for readability, which is too narrow for a data grid
 * or a shell layout — these break out into the space to the right.
 */
export const WIDE_DEMOS = new Set([
  'table', 'tree', 'app-shell', 'sidebar-nav', 'command-palette', 'navbar', 'chatbot',
  'aurora', 'particle-field', 'beams', 'waves', 'dot-matrix', 'grid-motion', 'dither', 'spotlight',
  'line-chart', 'bar-chart', 'button'
]);

export function isWideDemo(slug: string): boolean {
  return WIDE_DEMOS.has(slug);
}

/** The handful the homepage workbench cycles through. */
export const FEATURED_DEMOS = [
  'table', 'chatbot', 'line-chart', 'button', 'carousel', 'navbar', 'aurora', 'switch', 'tabs', 'command-palette'
];

export function hasDemo(slug: string): boolean {
  return slug in DEMOS;
}
