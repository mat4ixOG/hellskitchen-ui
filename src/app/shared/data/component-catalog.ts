/**
 * Single source of truth for the component catalogue.
 * The /components grid and every /docs page read from here, so a component
 * can never appear in one place with a different API than in the other.
 */

export type Category =
  | 'Forms'
  | 'Navigation'
  | 'Feedback'
  | 'Overlay'
  | 'Layout'
  | 'Data'
  | 'Backgrounds'
  | 'Utility';

/**
 * `new` is a temporary badge on a recent addition, not a maturity level —
 * clear it once the component stops being news. Everything else is `stable`;
 * a catalogue that advertises half-finished work is worse than one that only
 * lists what it will stand behind.
 */
export type Status = 'stable' | 'new';

export interface ApiRow {
  kind: 'input' | 'output' | 'method';
  name: string;
  type: string;
  default: string;
  description: string;
}

export interface TokenRow {
  name: string;
  default: string;
  description: string;
}

export interface KeyRow {
  keys: string;
  action: string;
}

export interface ComponentEntry {
  slug: string;
  name: string;
  selector: string;
  category: Category;
  status: Status;
  /** One line for the catalogue card. */
  tagline: string;
  /** Longer intro for the docs page. */
  description?: string;
  size: number;
  tags: string[];
  usage?: string;
  api?: ApiRow[];
  tokens?: TokenRow[];
  keyboard?: KeyRow[];
  a11y?: string[];
}

export const CATEGORIES: Category[] = [
  'Forms',
  'Navigation',
  'Feedback',
  'Overlay',
  'Layout',
  'Data',
  'Backgrounds',
  'Utility'
];

/** Tokens every component inherits — documented once, referenced everywhere. */
export const GLOBAL_TOKENS: TokenRow[] = [
  { name: '--hk-accent', default: '#dc2626', description: 'Primary accent for fills, rails and focus rings.' },
  { name: '--hk-accent-soft', default: 'rgb(220 38 38 / 0.16)', description: 'Tinted background for subtle variants and chips.' },
  { name: '--hk-surface', default: '#0b0b0c', description: 'Component background.' },
  { name: '--hk-border', default: 'rgb(255 255 255 / 0.10)', description: 'Hairline borders and dividers.' },
  { name: '--hk-text', default: '#f5f5f5', description: 'Foreground text colour.' },
  { name: '--hk-radius', default: '12px', description: 'Corner radius scale. Every component derives from it.' },
  { name: '--hk-density', default: '1', description: 'Multiplier on internal padding. 0.7 is compact, 1.6 is roomy.' },
  { name: '--hk-motion', default: '200ms', description: 'Base transition duration. Set to 0 to disable animation.' }
];

export const COMPONENTS: ComponentEntry[] = [
  // ── Forms ───────────────────────────────────────────────────
  {
    slug: 'switch',
    name: 'Switch',
    selector: 'hk-switch',
    category: 'Forms',
    status: 'stable',
    size: 2.1,
    tagline: 'Two-way bound toggle with a spring-eased thumb.',
    description:
      'A checkbox that reads as an on/off control. Model-bound through a signal, so no ControlValueAccessor boilerplate unless you want reactive forms — in which case it implements one too.',
    tags: ['toggle', 'checkbox', 'boolean'],
    usage: `import { HkSwitch } from '@hellskitchen/ui';

@Component({
  imports: [HkSwitch],
  template: \`
    <hk-switch
      [(checked)]="notify"
      size="lg"
      accent="crimson"
      label="Email me on deploy"
      (changed)="persist($event)" />
  \`
})
export class SettingsComponent {
  notify = signal(true);
  persist(on: boolean) { /* … */ }
}`,
    api: [
      { kind: 'input', name: 'checked', type: 'boolean', default: 'false', description: 'Model value. Supports two-way binding via [(checked)].' },
      { kind: 'input', name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Track and thumb scale.' },
      { kind: 'input', name: 'accent', type: 'string', default: "'crimson'", description: 'Named accent, or any CSS colour.' },
      { kind: 'input', name: 'label', type: 'string', default: "''", description: 'Accessible label. Rendered visually unless labelHidden is set.' },
      { kind: 'input', name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks interaction and dims the track.' },
      { kind: 'output', name: 'changed', type: 'EventEmitter<boolean>', default: '—', description: 'Fires after the value settles.' }
    ],
    tokens: [
      { name: '--hk-switch-track', default: '#262626', description: 'Track colour when off.' },
      { name: '--hk-switch-thumb', default: '#ffffff', description: 'Thumb colour.' },
      { name: '--hk-switch-ease', default: 'cubic-bezier(.34,1.56,.64,1)', description: 'Thumb travel easing.' }
    ],
    keyboard: [
      { keys: 'Space / Enter', action: 'Toggles the value' },
      { keys: 'Tab', action: 'Moves focus in and out' }
    ],
    a11y: [
      'Renders role="switch" with aria-checked reflecting the model.',
      'Label is wired through aria-label or aria-labelledby, never left implicit.',
      'Thumb travel honours prefers-reduced-motion.'
    ]
  },
  {
    slug: 'rating',
    name: 'Rating',
    selector: 'hk-rating',
    category: 'Forms',
    status: 'stable',
    size: 1.8,
    tagline: 'Any icon, any count, half steps, keyboard driven.',
    description:
      'A radio group wearing stars. The icon is yours — pass any icon class or template, and the count is arbitrary.',
    tags: ['stars', 'score', 'input'],
    usage: `<hk-rating
  [(value)]="score"
  [count]="5"
  [half]="true"
  icon="pi pi-star-fill"
  accent="crimson" />`,
    api: [
      { kind: 'input', name: 'value', type: 'number', default: '0', description: 'Current score. Two-way bindable.' },
      { kind: 'input', name: 'count', type: 'number', default: '5', description: 'How many icons to render.' },
      { kind: 'input', name: 'half', type: 'boolean', default: 'false', description: 'Allows half-step selection.' },
      { kind: 'input', name: 'icon', type: 'string', default: "'pi pi-star-fill'", description: 'Icon class for each item.' },
      { kind: 'input', name: 'readonly', type: 'boolean', default: 'false', description: 'Display only — skips focus and pointer handling.' },
      { kind: 'output', name: 'valueChange', type: 'EventEmitter<number>', default: '—', description: 'Emits on selection.' }
    ],
    keyboard: [
      { keys: '← / →', action: 'Decrease / increase by one step' },
      { keys: 'Home / End', action: 'Jump to lowest / highest' },
      { keys: '0', action: 'Clear the rating' }
    ],
    a11y: [
      'Exposed as role="radiogroup" with one radio per item.',
      'Announces "3 of 5" rather than a bare number.'
    ]
  },
  {
    slug: 'input',
    name: 'Input',
    selector: 'hk-input',
    category: 'Forms',
    status: 'stable',
    size: 2.4,
    tagline: 'Prefix, suffix, hint, error — and attached buttons.',
    description:
      'A text field that owns its own chrome: prefix and suffix slots, a hint line that becomes the error line, and a clear button that appears once there is something to clear. Grouped with a button or an addon it stays one control with one border — the wrapper owns the border and the focus ring, so focus lights the whole group rather than a box inside a box.',
    tags: ['text', 'field'],
    usage: `<hk-input
  [(value)]="slug"
  label="Workspace URL"
  prefix="hk.dev/"
  hint="Lowercase letters, numbers and dashes."
  [error]="slugError()"
  [clearable]="true" />

<!-- An input group is one control with one border: the wrapper owns the
     border and the focus ring, so focus lights the whole group rather
     than a box inside a box. -->
<hk-input-group>
  <hk-input [(value)]="email" type="email" placeholder="you@team.com" />
  <button hkButton hkInputAddon [disabled]="!email()">Send</button>
</hk-input-group>

<!-- Addons on both sides -->
<hk-input-group>
  <button hkButton hkInputAddon (pressed)="step(-1)" aria-label="Fewer">−</button>
  <hk-input [(value)]="seats" type="number" />
  <button hkButton hkInputAddon (pressed)="step(1)" aria-label="More">+</button>
</hk-input-group>`,
    api: [
      { kind: 'input', name: 'value', type: 'string', default: '\'\'', description: 'Model value. Two-way bindable via [(value)].' },
      { kind: 'input', name: 'label', type: 'string', default: '\'\'', description: 'Visible label, wired to the control with a generated id.' },
      { kind: 'input', name: 'type', type: '\'text\' | \'email\' | \'password\' | \'number\' | \'search\'', default: '\'text\'', description: 'Native input type.' },
      { kind: 'input', name: 'prefix', type: 'string', default: '\'\'', description: 'Static text before the field — a scheme, a currency, a unit.' },
      { kind: 'input', name: 'suffix', type: 'string', default: '\'\'', description: 'Static text after the field.' },
      { kind: 'input', name: 'hint', type: 'string', default: '\'\'', description: 'Helper line under the field. Replaced by error when that is set.' },
      { kind: 'input', name: 'error', type: 'string', default: '\'\'', description: 'Error message. Sets aria-invalid and switches the field to the error skin.' },
      { kind: 'input', name: 'addonBefore', type: 'string', default: "''", description: 'Static addon panel before the field, on its own ground — a scheme, a currency, a unit. Unlike prefix, it is separated by a rule.' },
      { kind: 'input', name: 'addonAfter', type: 'string', default: "''", description: 'Static addon panel after the field.' },
      { kind: 'input', name: 'clearable', type: 'boolean', default: 'false', description: 'Shows a clear button once the field is non-empty.' },
      { kind: 'input', name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks interaction and dims the control.' },
      { kind: 'output', name: 'valueChange', type: 'EventEmitter<string>', default: '—', description: 'Emits on every keystroke.' },
      { kind: 'output', name: 'cleared', type: 'EventEmitter<void>', default: '—', description: 'Emits when the clear button is used.' },
    ],
    tokens: [
      { name: '--hk-input-bg', default: '#ffffff', description: 'Field background.' },
      { name: '--hk-input-border', default: '#e2e8f0', description: 'Resting border colour.' },
      { name: '--hk-input-border-focus', default: '#dc2626', description: 'Border colour while focused.' },
      { name: '--hk-input-error', default: '#b91c1c', description: 'Error text and border colour.' },
    ],
    keyboard: [
      { keys: 'Escape', action: 'Clears the field when [clearable] is set' },
    ],
    a11y: [
      'Label, hint and error are linked with aria-describedby, so a screen reader hears the constraint before the user types.',
      'The error state sets aria-invalid rather than relying on the red border alone.',
      'The clear button is a real button with an accessible name, not a decorative icon.',
    ],
  },
  {
    slug: 'textarea',
    name: 'Textarea',
    selector: 'hk-textarea',
    category: 'Forms',
    status: 'stable',
    size: 1.6,
    tagline: 'Auto-growing textarea with a character counter.',
    description:
      'A textarea that grows with its content up to a ceiling, then scrolls — so a one-line note does not reserve six lines of empty space.',
    tags: ['text', 'multiline'],
    usage: `<hk-textarea
  [(value)]="note"
  label="What shipped?"
  [rows]="2"
  [maxRows]="8"
  [maxlength]="280"
  [counter]="true" />`,
    api: [
      { kind: 'input', name: 'value', type: 'string', default: '\'\'', description: 'Model value. Two-way bindable.' },
      { kind: 'input', name: 'rows', type: 'number', default: '2', description: 'Starting height in rows.' },
      { kind: 'input', name: 'maxRows', type: 'number', default: '10', description: 'Height ceiling. Past it the field scrolls instead of growing.' },
      { kind: 'input', name: 'autoGrow', type: 'boolean', default: 'true', description: 'Resizes to fit the content on every input.' },
      { kind: 'input', name: 'maxlength', type: 'number | null', default: 'null', description: 'Hard character limit.' },
      { kind: 'input', name: 'counter', type: 'boolean', default: 'false', description: 'Shows characters remaining. Needs maxlength.' },
      { kind: 'output', name: 'valueChange', type: 'EventEmitter<string>', default: '—', description: 'Emits on every keystroke.' },
    ],
    tokens: [
      { name: '--hk-textarea-min', default: '4rem', description: 'Floor height, so an empty field still has a target.' },
      { name: '--hk-textarea-max', default: '16rem', description: 'Ceiling before the field scrolls.' },
    ],
    keyboard: [
      { keys: 'Enter', action: 'Inserts a newline — the field never submits the form' },
    ],
    a11y: [
      'Resizing happens after the value lands, so the first paint is already the right height and nothing jumps.',
      'The counter is aria-live="polite" and only announces near the limit, not on every keystroke.',
    ],
  },
  {
    slug: 'select',
    name: 'Select',
    selector: 'hk-select',
    category: 'Forms',
    status: 'stable',
    size: 4.2,
    tagline: 'Virtualised single and multi select with typeahead.',
    description:
      'Single or multi select with typeahead filtering. The listbox is virtualised, so a few thousand options cost the same as a dozen.',
    tags: ['dropdown', 'picker'],
    usage: `<hk-select
  [(value)]="regions"
  [options]="allRegions"
  [multiple]="true"
  [filterable]="true"
  placeholder="Choose regions" />`,
    api: [
      { kind: 'input', name: 'value', type: 'unknown | unknown[]', default: 'null', description: 'Selected value, or array when [multiple]. Two-way bindable.' },
      { kind: 'input', name: 'options', type: 'HkOption[] | string[]', default: '[]', description: 'Choices. Plain strings are accepted as shorthand.' },
      { kind: 'input', name: 'multiple', type: 'boolean', default: 'false', description: 'Allows more than one selection and renders chips.' },
      { kind: 'input', name: 'filterable', type: 'boolean', default: 'false', description: 'Adds the typeahead box to the panel.' },
      { kind: 'input', name: 'placeholder', type: 'string', default: '\'Select\'', description: 'Shown when nothing is chosen.' },
      { kind: 'input', name: 'virtualScroll', type: 'boolean', default: 'true', description: 'Windows the listbox. Turn off only for very short lists.' },
      { kind: 'input', name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks opening the panel.' },
      { kind: 'output', name: 'valueChange', type: 'EventEmitter<unknown>', default: '—', description: 'Emits on selection.' },
      { kind: 'output', name: 'opened / closed', type: 'EventEmitter<void>', default: '—', description: 'Panel lifecycle, for lazy option loading.' },
    ],
    tokens: [
      { name: '--hk-select-panel-bg', default: '#ffffff', description: 'Dropdown background.' },
      { name: '--hk-select-option-hover', default: 'rgb(15 23 42 / 0.04)', description: 'Hovered and active option wash.' },
      { name: '--hk-select-max-height', default: '14rem', description: 'Panel height before it scrolls.' },
    ],
    keyboard: [
      { keys: 'Space / Enter', action: 'Opens the panel, or picks the active option' },
      { keys: '↑ / ↓', action: 'Moves the active option' },
      { keys: 'Home / End', action: 'First / last option' },
      { keys: 'Escape', action: 'Closes without changing the value' },
      { keys: 'Type a letter', action: 'Jumps to the next option starting with it' },
    ],
    a11y: [
      'Implements the listbox pattern: the trigger is a combobox, the panel a listbox, and aria-activedescendant tracks the active option without moving DOM focus.',
      'Selected state is exposed through aria-selected, never through colour alone.',
      'The panel is positioned from the trigger rect, so a scroll container cannot clip it.',
    ],
  },
  {
    slug: 'multi-select',
    name: 'Multi select',
    selector: 'hk-multi-select',
    category: 'Forms',
    status: 'new',
    size: 3.2,
    tagline: 'Chips, grouped options, filter-aware select-all.',
    description:
      'A select that holds many values without growing without bound. Past maxChips the rest collapse into a "+n more" control, so a field with forty selections is the same height as one with two. Select-all acts on the filtered rows rather than the whole list, and reports that as an indeterminate state — the one detail a multi-select usually gets wrong.',
    tags: ['select', 'multiple', 'chips', 'tags', 'filter'],
    usage: `import { HkMultiSelect } from '@hellskitchen/ui';

@Component({
  imports: [HkMultiSelect],
  template: \`
    <hk-multi-select
      [(value)]="regions"
      [options]="allRegions"
      optionLabel="label"
      groupBy="continent"
      [maxChips]="3"
      [selectAll]="true"
      placeholder="Choose regions"
      (changed)="persist($event)" />
  \`
})
export class RegionPicker {
  regions = signal(['eu-west-1']);
  allRegions = REGIONS;
  persist(values: string[]) { /* … */ }
}`,
    api: [
      { kind: 'input', name: 'value', type: 'string[]', default: '[]', description: 'Selected values. Supports two-way binding via [(value)].' },
      { kind: 'input', name: 'options', type: 'T[]', default: '[]', description: 'Source rows. Objects or plain strings.' },
      { kind: 'input', name: 'optionLabel', type: 'string', default: "'label'", description: 'Key read for the visible text when options are objects.' },
      { kind: 'input', name: 'optionValue', type: 'string', default: "'value'", description: 'Key read for the emitted value.' },
      { kind: 'input', name: 'groupBy', type: 'string | null', default: 'null', description: 'Key to bucket options under sticky group headers.' },
      { kind: 'input', name: 'maxChips', type: 'number', default: '3', description: 'Chips rendered before the rest collapse into "+n more".' },
      { kind: 'input', name: 'selectAll', type: 'boolean', default: 'true', description: 'Shows the select-all row. Acts on the filtered rows only.' },
      { kind: 'input', name: 'filter', type: 'boolean', default: 'true', description: 'Shows the type-ahead filter above the list.' },
      { kind: 'input', name: 'maxSelected', type: 'number | null', default: 'null', description: 'Caps the selection. Further options disable rather than disappear.' },
      { kind: 'input', name: 'placeholder', type: 'string', default: "'Select…'", description: 'Shown while nothing is selected.' },
      { kind: 'input', name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks interaction and dims the trigger.' },
      { kind: 'output', name: 'changed', type: 'EventEmitter<string[]>', default: '—', description: 'Fires on every add, remove and clear.' },
      { kind: 'output', name: 'filtered', type: 'EventEmitter<string>', default: '—', description: 'Filter text, debounced. For server-side search.' },
      { kind: 'method', name: 'clear()', type: '() => void', default: '—', description: 'Empties the selection without closing the panel.' }
    ],
    tokens: [
      { name: '--hk-ms-chip', default: 'rgb(220 38 38 / 0.10)', description: 'Chip background.' },
      { name: '--hk-ms-chip-ink', default: '#b91c1c', description: 'Chip text and remove control.' },
      { name: '--hk-ms-panel-max', default: '13rem', description: 'Height at which the option list starts scrolling.' }
    ],
    keyboard: [
      { keys: 'Enter / Space', action: 'Toggles the active option' },
      { keys: '↑ / ↓', action: 'Moves the active option' },
      { keys: 'Backspace', action: 'Removes the last chip when the filter is empty' },
      { keys: 'Escape', action: 'Closes the panel, keeping the selection' },
      { keys: '⌘A / Ctrl+A', action: 'Selects every filtered option' }
    ],
    a11y: [
      'The panel is a listbox with aria-multiselectable, and each row carries aria-selected.',
      'Select-all reports aria-checked="mixed" when only some of the filtered rows are picked.',
      'Every chip’s remove control has its own label naming the option it drops.',
      'The collapsed "+n more" control is focusable, so an overflowing selection is never unreachable.'
    ]
  },
  {
    slug: 'combobox',
    name: 'Combobox',
    selector: 'hk-combobox',
    category: 'Forms',
    status: 'stable',
    size: 4.8,
    tagline: 'Async-filterable select that accepts free text.',
    description:
      'A select that also accepts what you typed. Matching is fuzzy, and anything with no match becomes a new value on Enter.',
    tags: ['autocomplete', 'search'],
    usage: `<hk-combobox
  [(value)]="labels"
  [options]="knownLabels"
  [allowCustom]="true"
  placeholder="Add a label…" />`,
    api: [
      { kind: 'input', name: 'value', type: 'string[]', default: '[]', description: 'Chosen values, custom entries included. Two-way bindable.' },
      { kind: 'input', name: 'options', type: 'string[]', default: '[]', description: 'Suggestions offered while typing.' },
      { kind: 'input', name: 'allowCustom', type: 'boolean', default: 'true', description: 'Enter commits free text that matches nothing.' },
      { kind: 'input', name: 'maxItems', type: 'number | null', default: 'null', description: 'Caps how many values can be chosen.' },
      { kind: 'input', name: 'loading', type: 'boolean', default: 'false', description: 'Shows the async state while suggestions are fetched.' },
      { kind: 'output', name: 'valueChange', type: 'EventEmitter<string[]>', default: '—', description: 'Emits on add and on remove.' },
      { kind: 'output', name: 'search', type: 'EventEmitter<string>', default: '—', description: 'Debounced query, for server-side suggestions.' },
    ],
    tokens: [
      { name: '--hk-combobox-chip-bg', default: 'rgb(220 38 38 / 0.10)', description: 'Chip fill for a chosen value.' },
      { name: '--hk-combobox-chip-text', default: '#b91c1c', description: 'Chip label colour.' },
    ],
    keyboard: [
      { keys: 'Enter', action: 'Commits the highlighted suggestion, or the typed text' },
      { keys: 'Backspace', action: 'On an empty field, removes the last chip' },
      { keys: '↑ / ↓', action: 'Moves through suggestions' },
      { keys: 'Escape', action: 'Dismisses the suggestion list' },
    ],
    a11y: [
      'Backspace on an empty field peels the last chip — the behaviour every tag input is expected to have.',
      'Each chip carries its own labelled remove button, so removal never depends on the keyboard shortcut.',
      'The suggestion list is an aria-expanded combobox popup, announced as it filters.',
    ],
  },
  {
    slug: 'checkbox',
    name: 'Checkbox',
    selector: 'hk-checkbox',
    category: 'Forms',
    status: 'stable',
    size: 1.5,
    tagline: 'Tri-state checkbox with an animated tick.',
    description:
      'A checkbox with a real third state. A parent bound to a group reports indeterminate when its children disagree, which is the case most implementations skip.',
    tags: ['boolean', 'indeterminate'],
    usage: `<hk-checkbox
  [(checked)]="all"
  [indeterminate]="some()"
  label="Notify me about"
  (changed)="toggleAll($event)" />`,
    api: [
      { kind: 'input', name: 'checked', type: 'boolean', default: 'false', description: 'Model value. Two-way bindable.' },
      { kind: 'input', name: 'indeterminate', type: 'boolean', default: 'false', description: 'Renders the mixed state. Independent of checked.' },
      { kind: 'input', name: 'label', type: 'string', default: '\'\'', description: 'Accessible label, rendered unless labelHidden is set.' },
      { kind: 'input', name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks interaction and dims the box.' },
      { kind: 'output', name: 'changed', type: 'EventEmitter<boolean>', default: '—', description: 'Emits the new value on toggle.' },
    ],
    tokens: [
      { name: '--hk-checkbox-size', default: '1rem', description: 'Box edge length.' },
      { name: '--hk-checkbox-fill', default: '#dc2626', description: 'Fill when checked or indeterminate.' },
      { name: '--hk-checkbox-tick', default: '#ffffff', description: 'Tick and dash colour.' },
    ],
    keyboard: [
      { keys: 'Space', action: 'Toggles the value' },
      { keys: 'Tab', action: 'Moves focus in and out' },
    ],
    a11y: [
      'Sets aria-checked="mixed" for the indeterminate state rather than faking it with a class.',
      'The whole label is the hit target, not just the 16px box.',
    ],
  },
  {
    slug: 'radio-group',
    name: 'Radio group',
    selector: 'hk-radio-group',
    category: 'Forms',
    status: 'stable',
    size: 1.9,
    tagline: 'Roving-tabindex radio set, horizontal or stacked.',
    description:
      'A radio set with roving tabindex: one tab stop for the group, arrows to move within it. That is the ARIA pattern, and it is what keyboard users expect.',
    tags: ['choice'],
    usage: `<hk-radio-group
  [(value)]="strategy"
  [options]="strategies"
  label="Deploy strategy"
  orientation="vertical" />`,
    api: [
      { kind: 'input', name: 'value', type: 'unknown', default: 'null', description: 'Selected value. Two-way bindable.' },
      { kind: 'input', name: 'options', type: 'HkRadioOption[]', default: '[]', description: 'Choices. Each may carry a label and a hint line.' },
      { kind: 'input', name: 'orientation', type: '\'vertical\' | \'horizontal\'', default: '\'vertical\'', description: 'Layout direction; also picks which arrow keys move.' },
      { kind: 'input', name: 'label', type: 'string', default: '\'\'', description: 'Group label, exposed on the radiogroup.' },
      { kind: 'output', name: 'valueChange', type: 'EventEmitter<unknown>', default: '—', description: 'Emits on selection.' },
    ],
    tokens: [
      { name: '--hk-radio-dot', default: '#dc2626', description: 'Selected dot colour.' },
      { name: '--hk-radio-border', default: '#cbd5e1', description: 'Ring colour when unselected.' },
    ],
    keyboard: [
      { keys: '↑ / ←', action: 'Previous option, wrapping at the start' },
      { keys: '↓ / →', action: 'Next option, wrapping at the end' },
      { keys: 'Tab', action: 'Leaves the group — it is one stop, not one per radio' },
    ],
    a11y: [
      'Only the selected radio is tabbable; the rest are tabindex="-1" and reached with arrows.',
      'Selecting on arrow-move matches native radio behaviour, so nothing needs re-learning.',
    ],
  },
  {
    slug: 'slider',
    name: 'Slider',
    selector: 'hk-slider',
    category: 'Forms',
    status: 'stable',
    size: 2.8,
    tagline: 'Single or range slider with ticks and live value bubble.',
    description:
      'One thumb or two. In range mode the thumbs clamp against each other rather than swapping, which is what makes a range feel solid instead of glitchy.',
    tags: ['range', 'number'],
    usage: `<hk-slider
  [(value)]="memory"
  [min]="1" [max]="64" [step]="1"
  label="Memory limit"
  suffix=" GB" />

<hk-slider
  [(range)]="pods"
  [min]="0" [max]="40"
  label="Autoscale range" />`,
    api: [
      { kind: 'input', name: 'value', type: 'number', default: '0', description: 'Single-thumb value. Two-way bindable.' },
      { kind: 'input', name: 'range', type: '[number, number] | null', default: 'null', description: 'Two-thumb value. Takes over from value when set.' },
      { kind: 'input', name: 'min / max', type: 'number', default: '0 / 100', description: 'Bounds.' },
      { kind: 'input', name: 'step', type: 'number', default: '1', description: 'Increment for pointer and keyboard.' },
      { kind: 'input', name: 'ticks', type: 'boolean', default: 'false', description: 'Draws a mark at each step.' },
      { kind: 'input', name: 'suffix', type: 'string', default: '\'\'', description: 'Unit appended to the displayed value.' },
      { kind: 'output', name: 'valueChange / rangeChange', type: 'EventEmitter<…>', default: '—', description: 'Emits while dragging.' },
      { kind: 'output', name: 'committed', type: 'EventEmitter<…>', default: '—', description: 'Emits once on release — use this to persist.' },
    ],
    tokens: [
      { name: '--hk-slider-track', default: 'rgb(15 23 42 / 0.10)', description: 'Unfilled track.' },
      { name: '--hk-slider-fill', default: 'linear-gradient(90deg, #dc2626, #991b1b)', description: 'Filled portion.' },
      { name: '--hk-slider-thumb', default: '#ffffff', description: 'Thumb colour.' },
    ],
    keyboard: [
      { keys: '← / ↓', action: 'Decrease by one step' },
      { keys: '→ / ↑', action: 'Increase by one step' },
      { keys: 'Page Up / Page Down', action: 'Move by ten steps' },
      { keys: 'Home / End', action: 'Jump to min / max' },
    ],
    a11y: [
      'Each thumb is a slider role with aria-valuenow, aria-valuemin and aria-valuemax kept current.',
      'In range mode each thumb gets its own accessible name, so "minimum" and "maximum" are distinguishable.',
      'Thumbs clamp rather than swap, so the value under the pointer never jumps to the other end.',
    ],
  },
  {
    slug: 'date-picker',
    name: 'Date picker',
    selector: 'hk-date-picker',
    category: 'Forms',
    status: 'stable',
    size: 6.1,
    tagline: 'Single, multiple or range — with time and an output format.',
    description:
      'A calendar that gets the boring parts right: correct leading blanks per month, a configurable first day of the week, and range selection that survives picking the end before the start. `mode` changes what a click means — one day, several, or a span — while the grid, the keyboard map and the month arithmetic stay identical. Time folds into every selected date rather than sitting beside it, so a timestamp is a real instant and not a date at midnight.',
    tags: ['calendar', 'date'],
    usage: `<!-- A range of nights -->
<hk-date-picker
  [(value)]="checkIn"
  [(rangeEnd)]="checkOut"
  mode="range"
  [min]="today"
  firstDay="monday" />

<!-- Several separate days, emitted as epoch milliseconds -->
<hk-date-picker [(value)]="blackouts" mode="multiple" format="timestamp" />

<!-- One instant: the time control folds into the emitted date, so this is
     not a date at midnight -->
<hk-date-picker
  [(value)]="startsAt"
  mode="single"
  [showTime]="true"
  hourFormat="24"
  format="iso" />`,
    api: [
      { kind: 'input', name: 'value', type: 'Date | null', default: 'null', description: 'Selected date, or range start. Two-way bindable.' },
      { kind: 'input', name: 'rangeEnd', type: 'Date | null', default: 'null', description: 'Range end. Two-way bindable, and only used in range mode.' },
      { kind: 'input', name: 'mode', type: "'single' | 'multiple' | 'range'", default: "'single'", description: 'What a click means. The grid, the keyboard map and the month arithmetic are identical in all three.' },
      { kind: 'input', name: 'showTime', type: 'boolean', default: 'false', description: 'Adds hour and minute controls, folded into every selected date — so a timestamp is a real instant, not a date at midnight.' },
      { kind: 'input', name: 'hourFormat', type: "'12' | '24'", default: "'24'", description: 'Clock used by the time controls.' },
      { kind: 'input', name: 'format', type: "'dd/MM/yyyy' | 'yyyy-MM-dd' | 'iso' | 'timestamp' | string", default: "'dd/MM/yyyy'", description: 'Shape of the emitted value. A custom pattern is accepted; `timestamp` emits epoch milliseconds and `iso` emits ISO 8601.' },
      { kind: 'input', name: 'min / max', type: 'Date | null', default: 'null', description: 'Selectable bounds; outside days are disabled, not hidden.' },
      { kind: 'input', name: 'firstDay', type: '\'sunday\' | \'monday\'', default: '\'monday\'', description: 'Which column the week starts in.' },
      { kind: 'input', name: 'locale', type: 'string', default: '\'en-US\'', description: 'Drives month and weekday names.' },
      { kind: 'output', name: 'valueChange / rangeEndChange', type: 'EventEmitter<Date | null>', default: '—', description: 'Emits on pick.' },
    ],
    tokens: [
      { name: '--hk-date-selected', default: '#dc2626', description: 'Selected day fill.' },
      { name: '--hk-date-in-range', default: 'rgb(220 38 38 / 0.10)', description: 'Days between the two ends.' },
      { name: '--hk-date-today-ring', default: '#94a3b8', description: 'Outline on today.' },
    ],
    keyboard: [
      { keys: '← / →', action: 'Previous / next day' },
      { keys: '↑ / ↓', action: 'Same weekday, previous / next week' },
      { keys: 'Page Up / Page Down', action: 'Previous / next month' },
      { keys: 'Enter', action: 'Selects the focused day' },
      { keys: 'Escape', action: 'Closes without selecting' },
    ],
    a11y: [
      'The grid is a real table with column headers, so a screen reader can say "Tuesday 14".',
      'Date-only values are anchored to local midnight — the same fix the table filter needed, since a UTC-parsed date lands on the previous day west of UTC.',
      'Disabled days are announced as disabled rather than silently ignoring the click.',
    ],
  },
  {
    slug: 'file-drop',
    name: 'File drop',
    selector: 'hk-file-drop',
    category: 'Forms',
    status: 'stable',
    size: 3.2,
    tagline: 'Drag-and-drop upload zone with per-file progress.',
    description:
      'A drop zone with a real browse fallback and per-file progress. Dragging is a convenience, never the only way in. The progress bar is an indicator, not a receipt: at 100% it has nothing left to say, so it clears and the row settles into a plain "Uploaded" — a list of finished uploads should read as a list, not as a wall of full bars.',
    tags: ['upload', 'files'],
    usage: `<hk-file-drop
  [accept]="['image/*', '.pdf']"
  [maxSize]="5 * 1024 * 1024"
  [multiple]="true"
  (files)="upload($event)" />

<!-- The bar is a progress indicator, not a receipt: at 100% it has
     nothing left to say, so it leaves and the row reads "Uploaded".
     Set keepProgress to hold it. -->
<hk-file-drop [keepProgress]="false" (files)="upload($event)" />`,
    api: [
      { kind: 'input', name: 'accept', type: 'string[]', default: '[]', description: 'MIME types or extensions. Empty accepts anything.' },
      { kind: 'input', name: 'multiple', type: 'boolean', default: 'true', description: 'Allows more than one file per drop.' },
      { kind: 'input', name: 'maxSize', type: 'number | null', default: 'null', description: 'Per-file byte ceiling. Oversize files are rejected with a reason.' },
      { kind: 'input', name: 'disabled', type: 'boolean', default: 'false', description: 'Ignores drops and disables the browse button.' },
      { kind: 'input', name: 'keepProgress', type: 'boolean', default: 'false', description: 'Holds the bar at 100% after an upload finishes. Off by default — a completed bar reports nothing the "Uploaded" row does not.' },
      { kind: 'output', name: 'files', type: 'EventEmitter<File[]>', default: '—', description: 'Accepted files, after filtering.' },
      { kind: 'output', name: 'uploaded', type: 'EventEmitter<File>', default: '—', description: 'Fires per file as it reaches 100%.' },
      { kind: 'output', name: 'rejected', type: 'EventEmitter<HkRejection[]>', default: '—', description: 'Files that failed, each with a reason.' },
    ],
    tokens: [
      { name: '--hk-drop-border', default: '#cbd5e1', description: 'Dashed border when idle.' },
      { name: '--hk-drop-border-active', default: '#dc2626', description: 'Border while a drag is over the zone.' },
      { name: '--hk-drop-bg-active', default: 'rgb(220 38 38 / 0.06)', description: 'Fill while a drag is over the zone.' },
    ],
    keyboard: [
      { keys: 'Enter / Space', action: 'Opens the file browser from the zone' },
    ],
    a11y: [
      'The browse control is a real file input behind a label, so keyboard and screen-reader users are not asked to drag.',
      'Progress is announced politely per file rather than on every percent tick.',
      'Rejections say why — type or size — instead of failing silently.',
    ],
  },
  {
    slug: 'pin-input',
    name: 'Pin input',
    selector: 'hk-pin-input',
    category: 'Forms',
    status: 'stable',
    size: 1.7,
    tagline: 'One-time-code boxes with paste splitting.',
    description:
      'Separate boxes that behave like one field. Pasting a code fills the whole row, and backspace walks backwards instead of stalling on an empty box. `type` decides what a box will hold at all, and the filter runs on the way in rather than validating afterwards — which is what makes a numeric pin feel like a number pad: a letter never appears and then vanishes, it simply never lands.',
    tags: ['otp', 'code'],
    usage: `<hk-pin-input
  [(value)]="code"
  [length]="6"
  type="numeric"
  (completed)="verify($event)" />`,
    api: [
      { kind: 'input', name: 'value', type: 'string', default: '\'\'', description: 'Current code. Two-way bindable.' },
      { kind: 'input', name: 'length', type: 'number', default: '6', description: 'How many boxes to render.' },
      { kind: 'input', name: 'type', type: '\'numeric\' | \'alphanumeric\'', default: '\'numeric\'', description: 'Which characters are accepted.' },
      { kind: 'input', name: 'mask', type: 'boolean', default: 'false', description: 'Renders each character as a dot.' },
      { kind: 'output', name: 'valueChange', type: 'EventEmitter<string>', default: '—', description: 'Emits on every change.' },
      { kind: 'output', name: 'completed', type: 'EventEmitter<string>', default: '—', description: 'Emits once every box is filled.' },
    ],
    tokens: [
      { name: '--hk-pin-size', default: '2.25rem', description: 'Box width.' },
      { name: '--hk-pin-border-filled', default: '#dc2626', description: 'Border once a box has a value.' },
    ],
    keyboard: [
      { keys: '0–9 / a–z', action: 'Fills the box and advances' },
      { keys: 'Backspace', action: 'Clears, or steps back when already empty' },
      { keys: '← / →', action: 'Moves between boxes' },
      { keys: 'Ctrl/Cmd + V', action: 'Splits a pasted code across every box' },
    ],
    a11y: [
      'Each box has its own numbered label, so focus position is always announced.',
      'inputmode="numeric" brings up the digit keypad on touch.',
      'A pasted code fills the row rather than dropping into one box — the failure everyone hits with OTP fields.',
    ],
  },
  {
    slug: 'password',
    name: 'Password',
    selector: 'hk-password',
    category: 'Forms',
    status: 'new',
    size: 2.4,
    tagline: 'Strength scored from rules, reveal toggle, Caps Lock warning.',
    description:
      'A password field that tells the user what it wants before they get it wrong. Strength is the count of satisfied rules rather than a function of length — twelve lowercase characters are not strong, and saying so does real harm — which also means the meter and the checklist can never disagree. Caps Lock is surfaced as a warning, because it is the most common reason a correct password is rejected and the browser will not mention it.',
    tags: ['password', 'strength', 'security', 'form', 'reveal'],
    usage: `import { HkPassword } from '@hellskitchen/ui';

@Component({
  imports: [HkPassword, ReactiveFormsModule],
  template: \`
    <hk-password
      formControlName="password"
      label="Password"
      [rules]="'default'"
      [meter]="true"
      [generate]="true"
      [capsLockWarning]="true" />
  \`
})
export class SignupComponent { /* … */ }`,
    api: [
      { kind: 'input', name: 'value', type: 'string', default: "''", description: 'Model value. Supports [(value)], or use it as a form control.' },
      { kind: 'input', name: 'meter', type: 'boolean', default: 'true', description: 'Shows the segmented strength meter.' },
      { kind: 'input', name: 'rules', type: "'default' | PasswordRule[]", default: "'default'", description: 'The rule set scored and listed. Supply your own to match a policy.' },
      { kind: 'input', name: 'showRules', type: 'boolean', default: 'true', description: 'Lists the rules live, rather than only failing on submit.' },
      { kind: 'input', name: 'toggle', type: 'boolean', default: 'true', description: 'Shows the reveal control.' },
      { kind: 'input', name: 'capsLockWarning', type: 'boolean', default: 'true', description: 'Warns while Caps Lock is on.' },
      { kind: 'input', name: 'generate', type: 'boolean', default: 'false', description: 'Offers a generated password from crypto.getRandomValues.' },
      { kind: 'input', name: 'minScore', type: 'number', default: '3', description: 'Rules that must pass before the control validates.' },
      { kind: 'output', name: 'scored', type: 'EventEmitter<number>', default: '—', description: 'Fires with the rule count whenever the value changes.' },
      { kind: 'output', name: 'revealedChange', type: 'EventEmitter<boolean>', default: '—', description: 'Fires when the reveal state is toggled.' }
    ],
    tokens: [
      { name: '--hk-pw-weak', default: '#dc2626', description: 'Meter fill at the bottom of the scale.' },
      { name: '--hk-pw-fair', default: '#f59e0b', description: 'Meter fill mid-scale.' },
      { name: '--hk-pw-strong', default: '#10b981', description: 'Meter fill at the top of the scale.' },
      { name: '--hk-pw-track', default: 'rgb(15 23 42 / 0.10)', description: 'Unfilled meter segment.' }
    ],
    keyboard: [
      { keys: 'Alt+Shift+V', action: 'Toggles reveal without leaving the field' },
      { keys: 'Tab', action: 'Reaches the reveal control after the input' }
    ],
    a11y: [
      'The meter is a progressbar with aria-valuetext carrying the word, not the number — "Fair" is what matters, not 3.',
      'Reveal is a toggle button with aria-pressed, so its state is announced rather than inferred from an icon.',
      'The Caps Lock warning is role="status", announced without stealing focus mid-typing.',
      'Rules are described by aria-describedby, so the requirements are read with the field rather than hunted for.',
      'Revealing never re-creates the input, so the caret position and any selection survive the toggle.'
    ]
  },
  {
    slug: 'signup-form',
    name: 'Signup form',
    selector: 'hk-signup-form',
    category: 'Forms',
    status: 'new',
    size: 4.6,
    tagline: 'Reactive, cross-validated, SSO first.',
    description:
      'A whole signup flow rather than a field: reactive controls, per-field validators, a cross-field confirm check on the group, and SSO offered above the form instead of buried under it. Errors appear on touched or submitted, never on the first keystroke, and the submit button is never disabled by invalidity — a dead button gives no reason, while a rejected submit surfaces every message at once.',
    tags: ['form', 'signup', 'reactive', 'validation', 'sso', 'auth'],
    usage: `import { HkSignupForm } from '@hellskitchen/ui';

@Component({
  imports: [HkSignupForm],
  template: \`
    <hk-signup-form
      [providers]="['google', 'github', 'microsoft']"
      [roles]="roles"
      [minPasswordScore]="4"
      [busy]="submitting()"
      (submitted)="register($event)"
      (ssoRequested)="handOff($event)" />
  \`
})
export class SignupPage {
  roles = ['Engineering', 'Design', 'Product'];
  submitting = signal(false);
  register(value: SignupValue) { /* … */ }
  handOff(provider: string) { /* … */ }
}`,
    api: [
      { kind: 'input', name: 'providers', type: 'SsoProvider[]', default: "['google', 'github']", description: 'SSO buttons to offer, in order. Empty hides the block and its divider.' },
      { kind: 'input', name: 'roles', type: 'string[]', default: '[]', description: 'Options for the role select. Empty drops the field.' },
      { kind: 'input', name: 'minPasswordScore', type: 'number', default: '4', description: 'Rules the password must satisfy before the form validates.' },
      { kind: 'input', name: 'requireTerms', type: 'boolean', default: 'true', description: 'Adds the terms checkbox with a requiredTrue validator.' },
      { kind: 'input', name: 'busy', type: 'boolean', default: 'false', description: 'Drives the submit spinner and blocks a second submit.' },
      { kind: 'input', name: 'error', type: 'string | null', default: 'null', description: 'Server-side failure, rendered above the submit as an alert.' },
      { kind: 'output', name: 'submitted', type: 'EventEmitter<SignupValue>', default: '—', description: 'Fires only when the form is valid.' },
      { kind: 'output', name: 'ssoRequested', type: 'EventEmitter<string>', default: '—', description: 'Fires with the provider id; the form is skipped entirely.' },
      { kind: 'method', name: 'reset()', type: '() => void', default: '—', description: 'Clears every control and the submitted flag.' },
      { kind: 'method', name: 'setServerErrors(map)', type: '(map: Record<string, string>) => void', default: '—', description: 'Attaches server messages to named controls, so a taken email lands on the email field.' }
    ],
    tokens: [
      { name: '--hk-form-gap', default: '1rem', description: 'Vertical rhythm between fields.' },
      { name: '--hk-form-error', default: '#dc2626', description: 'Invalid border and message colour.' },
      { name: '--hk-sso-columns', default: '2', description: 'Provider buttons per row.' }
    ],
    keyboard: [
      { keys: 'Tab', action: 'Walks SSO, then the fields, then submit — in reading order' },
      { keys: 'Enter', action: 'Submits from any field' },
      { keys: 'Space', action: 'Toggles the terms and updates checkboxes' }
    ],
    a11y: [
      'Every field carries aria-invalid, and its message is wired through aria-describedby rather than left as loose text nearby.',
      'The form is novalidate: the browser’s own bubbles cannot be styled or translated, and would pre-empt the real messages.',
      'A failed submit moves focus to the first invalid control, so the reason is reachable without hunting.',
      'The submit summary is role="alert", so the count of remaining problems is announced.',
      'Submit is never disabled by invalidity — a disabled button explains nothing, while a rejected submit explains everything.'
    ]
  },
  {
    slug: 'form-field',
    name: 'Form field',
    selector: 'hk-form-field',
    category: 'Forms',
    status: 'stable',
    size: 1.4,
    tagline: 'Label, hint and error wiring for any control.',
    description:
      'The wiring layer: it generates ids, links label, hint and error with aria-describedby, and flips to the error skin — for any control you put inside it.',
    tags: ['label', 'validation'],
    usage: `<hk-form-field
  label="Work email"
  hint="We only use this for deploy alerts."
  [error]="emailError()"
  [required]="true">
  <input hkControl type="email" [(ngModel)]="email" />
</hk-form-field>`,
    api: [
      { kind: 'input', name: 'label', type: 'string', default: '\'\'', description: 'Field label. Linked to the projected control by generated id.' },
      { kind: 'input', name: 'hint', type: 'string', default: '\'\'', description: 'Helper line, replaced by error when that is set.' },
      { kind: 'input', name: 'error', type: 'string', default: '\'\'', description: 'Error message. Sets aria-invalid on the control.' },
      { kind: 'input', name: 'required', type: 'boolean', default: 'false', description: 'Marks the label and sets the required attribute.' },
      { kind: 'input', name: 'labelHidden', type: 'boolean', default: 'false', description: 'Keeps the label for assistive tech but hides it visually.' },
    ],
    tokens: [
      { name: '--hk-field-gap', default: '0.375rem', description: 'Space between label, control and message.' },
      { name: '--hk-field-error', default: '#b91c1c', description: 'Error text colour.' },
    ],
    a11y: [
      'Ids are generated and wired automatically, so the label always points at the real control.',
      'Hint and error are joined into one aria-describedby, so both are announced in order.',
      'Required is conveyed through the attribute, not just the asterisk.',
    ],
  },

  // ── Navigation ──────────────────────────────────────────────
  {
    slug: 'navbar',
    name: 'Navbar',
    selector: 'hk-navbar',
    category: 'Navigation',
    status: 'new',
    size: 3.8,
    tagline: 'Pill, app bar or dock — one travelling indicator.',
    description:
      'Three presentations of one navbar. The active indicator is a single element that travels between items rather than a border that reappears on whichever item is current: one element transitioning is what makes the movement readable, and it means the motion style is a swap of which properties animate, not three implementations. Offsets are arithmetic — every item in a strip is one nth wide — so there is no ResizeObserver and nothing to go stale on a re-render.',
    tags: ['navbar', 'nav', 'header', 'menu', 'dock', 'responsive'],
    usage: `import { HkNavbar } from '@hellskitchen/ui';

@Component({
  imports: [HkNavbar],
  template: \`
    <hk-navbar
      variant="pill"
      motion="slide"
      [items]="nav"
      [(active)]="section"
      [sticky]="true"
      (selected)="router.navigate([$event])" />
  \`
})
export class ShellComponent {
  section = signal('home');
  nav = [
    { id: 'home', label: 'Home', icon: 'pi-home' },
    { id: 'activity', label: 'Activity', icon: 'pi-chart-line', badge: 4 }
  ];
}`,
    api: [
      { kind: 'input', name: 'items', type: 'NavItem[]', default: '[]', description: 'Rows to render. Each takes an id, label, icon and optional badge count.' },
      { kind: 'input', name: 'variant', type: "'pill' | 'bar' | 'dock'", default: "'bar'", description: 'Floating pill, full app bar, or a magnifying dock.' },
      { kind: 'input', name: 'motion', type: "'slide' | 'glow' | 'underline'", default: "'slide'", description: 'What the travelling indicator animates. Ignored by dock.' },
      { kind: 'input', name: 'active', type: 'string', default: "''", description: 'Id of the current item. Supports two-way binding via [(active)].' },
      { kind: 'input', name: 'sticky', type: 'boolean', default: 'false', description: 'Pins the bar to the top and raises it once the page scrolls.' },
      { kind: 'input', name: 'breakpoint', type: 'string', default: "'52rem'", description: 'Width below which the links collapse behind the burger.' },
      { kind: 'input', name: 'speed', type: 'string', default: "'380ms'", description: 'Indicator travel duration. Written straight to --hk-nav-speed.' },
      { kind: 'output', name: 'selected', type: 'EventEmitter<string>', default: '—', description: 'Fires with the item id on click or keyboard select.' },
      { kind: 'output', name: 'menuToggled', type: 'EventEmitter<boolean>', default: '—', description: 'Fires when the mobile sheet opens or closes.' }
    ],
    tokens: [
      { name: '--hk-nav-accent', default: '#dc2626', description: 'Indicator fill, badges and the active dock tile.' },
      { name: '--hk-nav-surface', default: 'rgb(255 255 255 / 0.78)', description: 'Bar background, blurred behind the content.' },
      { name: '--hk-nav-speed', default: '380ms', description: 'Indicator travel duration.' },
      { name: '--hk-nav-ease', default: 'cubic-bezier(.34,1.4,.64,1)', description: 'Indicator easing. The slight overshoot is deliberate.' },
      { name: '--hk-nav-radius', default: '999px', description: 'Corner radius of the bar and its items.' }
    ],
    keyboard: [
      { keys: '← / →', action: 'Moves between items' },
      { keys: 'Home / End', action: 'Jumps to the first or last item' },
      { keys: 'Enter / Space', action: 'Selects the focused item' },
      { keys: 'Escape', action: 'Closes the mobile sheet' }
    ],
    a11y: [
      'Renders a nav landmark with an accessible name, and marks the current item with aria-current="page".',
      'The burger is a toggle with aria-expanded and a label, not a bare glyph.',
      'Dock tiles are icon-only, so each carries its own aria-label — the tooltip is decoration and is aria-hidden.',
      'Badge counts are labelled ("4 new"), so a bare numeral is not read as part of the link text.',
      'The mobile sheet animates through grid-template-rows, which leaves it in the DOM and keeps focus order intact.',
      'All indicator travel is dropped under prefers-reduced-motion; the colour change alone still identifies the selection.'
    ]
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    selector: 'hk-tabs',
    category: 'Navigation',
    status: 'stable',
    size: 2.9,
    tagline: 'Sliding indicator, and badges bound to live counts.',
    description:
      'The indicator reads each tab\'s real box, so labels of any width line up without magic numbers. Works as a router outlet driver or as plain in-page panels. Badges are bound to a count rather than baked in: zero renders nothing, anything past 99 collapses so the strip cannot widen, and opening a tab clears its own.',
    tags: ['tabs', 'segmented'],
    usage: `<hk-tabs [(active)]="tab" (changed)="track($event)">
  <hk-tab value="overview">Overview</hk-tab>
  <hk-tab value="api">API</hk-tab>
  <hk-tab value="theming" [disabled]="!pro">Theming</hk-tab>

  <!-- Bound, not baked in: 0 renders nothing, and opening the tab
       clears it. Whatever feeds the count decides when it goes back up. -->
  <hk-tab value="alerts" [badge]="unread()">Alerts</hk-tab>
</hk-tabs>

<hk-tab-panel value="overview">…</hk-tab-panel>`,
    api: [
      { kind: 'input', name: 'active', type: 'string', default: 'first tab', description: 'Value of the selected tab. Two-way bindable.' },
      { kind: 'input', name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Strip direction.' },
      { kind: 'input', name: 'activateOnFocus', type: 'boolean', default: 'true', description: 'Whether arrow keys select as they move, or only move focus.' },
      { kind: 'input', name: 'badge', type: 'number | string | null', default: 'null', description: 'Per-tab, on hk-tab. A numeric 0 renders nothing — a badge reading "0" draws the eye to say there is nothing to see.' },
      { kind: 'input', name: 'badgeStyle', type: "'count' | 'dot'", default: "'count'", description: 'Whether the badge shows the number or collapses to a dot.' },
      { kind: 'input', name: 'badgeMax', type: 'number', default: '99', description: 'Counts above this collapse to "99+", so a busy tab cannot widen the strip.' },
      { kind: 'input', name: 'clearBadgeOnSelect', type: 'boolean', default: 'true', description: 'Opening a tab is what "read" means, so its badge clears on select.' },
      { kind: 'output', name: 'changed', type: 'EventEmitter<string>', default: '—', description: 'Emits the newly active value.' },
      { kind: 'method', name: 'select(value)', type: '(value: string) => void', default: '—', description: 'Programmatic selection.' }
    ],
    tokens: [
      { name: '--hk-tabs-indicator', default: 'var(--hk-accent)', description: 'Indicator fill.' },
      { name: '--hk-tabs-track', default: 'transparent', description: 'Strip background.' }
    ],
    keyboard: [
      { keys: '← / →', action: 'Move between tabs' },
      { keys: 'Home / End', action: 'First / last tab' },
      { keys: 'Enter / Space', action: 'Select when activateOnFocus is false' }
    ],
    a11y: [
      'role="tablist" / "tab" / "tabpanel" with aria-controls wired both ways.',
      'Exactly one tab in the tab order; arrows move focus (roving tabindex).'
    ]
  },
  {
    slug: 'stepper',
    name: 'Stepper',
    selector: 'hk-stepper',
    category: 'Navigation',
    status: 'stable',
    size: 3.1,
    tagline: 'Three presentations, one wizard state.',
    description: 'Multi-step flows with validation gating: in linear mode a step only unlocks when the previous one reports valid. Three presentations share that one state — a numbered rail, a vertical panel list, and a compact progress header — so `variant` changes how a wizard looks without touching what it does or what it emits.',
    tags: ['wizard', 'flow'],
    usage: `<!-- variant changes the presentation only; the state and the outputs are
     identical across all three -->
<hk-stepper variant="rail" [(step)]="step" [linear]="true" (completed)="submit()">
  <hk-step label="Install" [valid]="true" />
  <hk-step label="Configure" [valid]="form.valid" />
  <hk-step label="Ship" />
</hk-stepper>

<!-- A vertical rail that carries each step's copy -->
<hk-stepper variant="panels" [(step)]="step">
  <hk-step label="Install" detail="Add the package and register the preset." />
  <hk-step label="Configure" detail="Point the tokens at your accent." />
</hk-stepper>

<!-- The compact one, for a wizard header -->
<hk-stepper variant="progress" [(step)]="step" />`,
    api: [
      { kind: 'input', name: 'step', type: 'number', default: '0', description: 'Zero-based active index. Two-way bindable.' },
      { kind: 'input', name: 'variant', type: "'rail' | 'panels' | 'progress'", default: "'rail'", description: 'Numbered markers on a track, a vertical rail carrying its own copy, or a compact segmented header. Swapping it changes how the wizard looks, never what it emits.' },
      { kind: 'input', name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Rail direction. Panels are vertical regardless.' },
      { kind: 'input', name: 'linear', type: 'boolean', default: 'false', description: 'Requires each step to be valid before advancing.' },
      { kind: 'output', name: 'completed', type: 'EventEmitter<void>', default: '—', description: 'Fires when the last step is confirmed.' }
    ],
    a11y: ['Rail is decorative and aria-hidden; progress is announced via aria-current="step".']
  },
  {
    slug: 'breadcrumb',
    name: 'Breadcrumb',
    selector: 'hk-breadcrumb',
    category: 'Navigation',
    status: 'stable',
    size: 1.2,
    tagline: 'Slash, chevron or pills — all collapsing the same way.',
    description:
      'A route trail that collapses its middle when space runs out, keeping the root and the last two crumbs — the ones people actually navigate by. Three presentations share that one rule: plain separators, icon chevrons with the root reduced to its glyph, or a segmented path bar.',
    tags: ['trail', 'router'],
    usage: `<hk-breadcrumb [items]="trail" [maxVisible]="4" separator="/" />

<!-- Icons, with the root reduced to its glyph -->
<hk-breadcrumb variant="chevron" [items]="trail" [icons]="true" />

<!-- A path bar; the last segment carries the accent -->
<hk-breadcrumb variant="pills" [items]="trail" />`,
    api: [
      { kind: 'input', name: 'items', type: 'HkCrumb[]', default: '[]', description: 'Trail, root first. Each carries a label and an optional routerLink.' },
      { kind: 'input', name: 'maxVisible', type: 'number', default: '4', description: 'Crumbs shown before the middle collapses behind an ellipsis.' },
      { kind: 'input', name: 'variant', type: "'slash' | 'chevron' | 'pills'", default: "'slash'", description: 'Plain separators, icon chevrons with the root reduced to its glyph, or a segmented path bar.' },
      { kind: 'input', name: 'separator', type: 'string', default: "'/'", description: 'Character drawn between crumbs. Ignored by chevron and pills.' },
      { kind: 'input', name: 'icons', type: 'boolean', default: 'false', description: 'Renders each crumb\'s icon. On by default under the chevron variant.' },
      { kind: 'output', name: 'navigate', type: 'EventEmitter<HkCrumb>', default: '—', description: 'Emits when a crumb is activated.' },
    ],
    tokens: [
      { name: '--hk-crumb-separator', default: '#94a3b8', description: 'Separator colour.' },
      { name: '--hk-crumb-active', default: '#0f172a', description: 'Colour of the final crumb.' },
    ],
    keyboard: [
      { keys: 'Tab', action: 'Moves through crumbs' },
      { keys: 'Enter', action: 'Follows the crumb' },
    ],
    a11y: [
      'Wrapped in nav[aria-label="Breadcrumb"] with the current page marked aria-current="page".',
      'The ellipsis is a button that expands the trail, not inert text.',
    ],
  },
  {
    slug: 'pagination',
    name: 'Pagination',
    selector: 'hk-pagination',
    category: 'Navigation',
    status: 'stable',
    size: 2.0,
    tagline: 'Page list with ellipsis windowing and page-size select.',
    description:
      'Page links that window with an ellipsis, so the control keeps a stable width whether you are on page 2 or page 200. The page-size control is a button and a panel rather than a native select: an OS-painted option list ignores every class on the element and comes back white on a dark theme.',
    tags: ['pager', 'table'],
    usage: `<hk-pagination
  [(page)]="page"
  [(pageSize)]="size"
  [total]="487"
  [pageSizeOptions]="[10, 25, 50]" />`,
    api: [
      { kind: 'input', name: 'page', type: 'number', default: '1', description: 'Current page, 1-based. Two-way bindable.' },
      { kind: 'input', name: 'pageSize', type: 'number', default: '10', description: 'Rows per page. Two-way bindable.' },
      { kind: 'input', name: 'total', type: 'number', default: '0', description: 'Total record count.' },
      { kind: 'input', name: 'pageLinks', type: 'number', default: '5', description: 'How many numbered links to show around the current page.' },
      { kind: 'input', name: 'pageSizeOptions', type: 'number[]', default: '[]', description: 'Page sizes offered. Empty hides the selector. The control is a button and a panel, never a native select — an OS-painted option list ignores the component\'s theme and comes back white on dark.' },
      { kind: 'output', name: 'pageChange / pageSizeChange', type: 'EventEmitter<number>', default: '—', description: 'Emits on navigation.' },
    ],
    tokens: [
      { name: '--hk-page-active-bg', default: '#b91c1c', description: 'Current page fill.' },
      { name: '--hk-page-hover', default: 'rgb(15 23 42 / 0.05)', description: 'Hover wash.' },
    ],
    keyboard: [
      { keys: 'Tab', action: 'Moves through controls' },
      { keys: 'Enter / Space', action: 'Activates a page link' },
    ],
    a11y: [
      'The current page carries aria-current="page"; the others are plain links.',
      'Previous and next are disabled rather than hidden at the ends, so the control never reflows.',
      'Changing page size keeps the first visible record in view instead of snapping to page 1.',
    ],
  },
  {
    slug: 'menu',
    name: 'Menu',
    selector: 'hk-menu',
    category: 'Navigation',
    status: 'stable',
    size: 3.6,
    tagline: 'Nested, keyboard-driven, burger or labelled trigger.',
    description:
      'A menu that nests. Submenus open on hover and on keyboard focus, and the panel flips when it would run off the viewport. The trigger is a slot rather than a fixed button: a burger by default, since that is what a menu usually hangs off, with a label or both where the word carries meaning the glyph does not — and an accessible name either way.',
    tags: ['dropdown', 'context'],
    usage: `<!-- Default: a burger that folds into an X while open. The label is still
     required — it becomes the button's aria-label -->
<hk-menu [items]="actions" triggerLabel="Actions" (select)="run($event)" />

<!-- Or spell it out, where the word carries meaning the glyph does not -->
<hk-menu [items]="actions" trigger="both" triggerLabel="Actions" />

<!-- Or bring your own trigger entirely -->
<hk-menu [items]="actions">
  <button hkMenuTrigger>Actions</button>
</hk-menu>`,
    api: [
      { kind: 'input', name: 'items', type: 'HkMenuItem[]', default: '[]', description: 'Menu tree. An item with children renders a submenu.' },
      { kind: 'input', name: 'placement', type: '\'bottom-start\' | \'bottom-end\' | \'right-start\'', default: '\'bottom-start\'', description: 'Preferred anchor; flips when it would overflow.' },
      { kind: 'input', name: 'trigger', type: "'icon' | 'label' | 'both'", default: "'icon'", description: 'A burger by default, since that is what a menu usually hangs off. Whichever is chosen the button keeps an accessible name.' },
      { kind: 'input', name: 'triggerLabel', type: 'string', default: "'Actions'", description: 'Text for the label and both triggers, and the aria-label for the icon one.' },
      { kind: 'input', name: 'triggerIcon', type: 'string', default: "'burger'", description: 'Glyph for the icon trigger. The burger animates into an X while open.' },
      { kind: 'input', name: 'closeOnSelect', type: 'boolean', default: 'true', description: 'Dismisses the whole menu after a leaf is chosen.' },
      { kind: 'output', name: 'select', type: 'EventEmitter<HkMenuItem>', default: '—', description: 'Emits the chosen leaf item.' },
    ],
    tokens: [
      { name: '--hk-menu-bg', default: '#ffffff', description: 'Panel background.' },
      { name: '--hk-menu-danger', default: '#dc2626', description: 'Colour for items marked danger.' },
    ],
    keyboard: [
      { keys: '↑ / ↓', action: 'Moves through items' },
      { keys: '→', action: 'Opens a submenu' },
      { keys: '←', action: 'Closes the submenu and returns to the parent' },
      { keys: 'Enter', action: 'Activates the item' },
      { keys: 'Escape', action: 'Closes the menu and restores focus to the trigger' },
    ],
    a11y: [
      'Roles are menu and menuitem, with aria-haspopup on anything that opens a submenu.',
      'Focus returns to the trigger on close, so tab order is never lost.',
      'Destructive items are marked in text and colour, not colour alone.',
    ],
  },
  {
    slug: 'sidebar-nav',
    name: 'Sidebar nav',
    selector: 'hk-sidebar-nav',
    category: 'Navigation',
    status: 'stable',
    size: 2.7,
    tagline: 'Collapsible route tree with active-branch tracking.',
    description:
      'A navigation rail that collapses to icons without losing its landmarks, so muscle memory survives the collapse.',
    tags: ['nav', 'tree'],
    usage: `<hk-sidebar-nav
  [sections]="sections"
  [(collapsed)]="railCollapsed"
  [(active)]="activeSection" />`,
    api: [
      { kind: 'input', name: 'sections', type: 'HkNavSection[]', default: '[]', description: 'Sections, each with a label, icon and optional children.' },
      { kind: 'input', name: 'collapsed', type: 'boolean', default: 'false', description: 'Collapses to the icon rail. Two-way bindable.' },
      { kind: 'input', name: 'active', type: 'string', default: '\'\'', description: 'Active section id. Two-way bindable.' },
      { kind: 'input', name: 'overlayBelow', type: 'string', default: '\'lg\'', description: 'Breakpoint under which the rail overlays instead of pushing content.' },
      { kind: 'output', name: 'activeChange', type: 'EventEmitter<string>', default: '—', description: 'Emits on navigation.' },
    ],
    tokens: [
      { name: '--hk-nav-width', default: '13rem', description: 'Expanded width.' },
      { name: '--hk-nav-rail', default: '3.25rem', description: 'Collapsed width.' },
      { name: '--hk-nav-active-bg', default: 'rgb(220 38 38 / 0.10)', description: 'Active item fill.' },
    ],
    keyboard: [
      { keys: 'Tab', action: 'Moves through items' },
      { keys: 'Enter', action: 'Navigates' },
      { keys: 'Escape', action: 'Closes the overlay rail on small screens' },
    ],
    a11y: [
      'Rendered as a nav landmark with an accessible name, so it can be jumped to directly.',
      'Icons keep their labels when collapsed via aria-label — the rail is never icon-only to a screen reader.',
      'The active item is marked aria-current, not just tinted.',
    ],
  },
  {
    slug: 'command-palette',
    name: 'Command palette',
    selector: 'hk-command',
    category: 'Navigation',
    status: 'stable',
    size: 5.4,
    tagline: 'Fuzzy-matched command list on a global hotkey.',
    description:
      'Fuzzy subsequence matching over grouped commands — typing "dbi" still finds "Deploy billing-api". Arrow keys move, Enter runs.',
    tags: ['cmdk', 'search'],
    usage: `<hk-command-palette
  [(open)]="paletteOpen"
  [commands]="commands"
  hotkey="mod+k"
  (run)="execute($event)" />`,
    api: [
      { kind: 'input', name: 'open', type: 'boolean', default: 'false', description: 'Visibility. Two-way bindable.' },
      { kind: 'input', name: 'commands', type: 'HkCommand[]', default: '[]', description: 'Commands, each with a label, group and optional hint.' },
      { kind: 'input', name: 'hotkey', type: 'string', default: '\'mod+k\'', description: 'Global shortcut that opens the palette.' },
      { kind: 'input', name: 'placeholder', type: 'string', default: '\'Type a command…\'', description: 'Search field placeholder.' },
      { kind: 'output', name: 'run', type: 'EventEmitter<HkCommand>', default: '—', description: 'Emits the chosen command.' },
    ],
    tokens: [
      { name: '--hk-palette-bg', default: '#ffffff', description: 'Panel background.' },
      { name: '--hk-palette-active', default: 'rgb(220 38 38 / 0.10)', description: 'Highlighted row fill.' },
    ],
    keyboard: [
      { keys: 'Mod + K', action: 'Opens the palette from anywhere' },
      { keys: '↑ / ↓', action: 'Moves the highlight, wrapping at both ends' },
      { keys: 'Enter', action: 'Runs the highlighted command' },
      { keys: 'Escape', action: 'Closes and restores focus' },
    ],
    a11y: [
      'The field is a combobox over a listbox; the highlight is tracked with aria-activedescendant so focus stays in the input.',
      'Group headings are real headings, so the result set can be skimmed by structure.',
      'Matching is subsequence-based, which keeps it forgiving without hiding what matched.',
    ],
  },

  // ── Feedback ────────────────────────────────────────────────
  {
    slug: 'toast',
    name: 'Toast',
    selector: 'hk-toast',
    category: 'Feedback',
    status: 'stable',
    size: 3.4,
    tagline: 'Stacked, auto-dismissing, pause-on-hover.',
    description:
      'Pushed from a service, rendered by one host you drop in once. The stack caps itself, pauses its timers while hovered or focused, and never traps a screen reader mid-announcement. Four tones, including an orange `warn` that sits between info and danger — for the case where something needs attention but nothing has failed yet, which a two-tone set has to misreport as one or the other.',
    tags: ['notification', 'snackbar'],
    usage: `// Once, at the app root:
// <hk-toast-host position="bottom-right" [max]="3" />

export class DeployComponent {
  private toast = inject(HkToastService);

  notify() {
    this.toast.push({
      tone: 'success',
      title: 'Deployed',
      body: 'v0.1.4 is live in 3 regions.',
      duration: 4000,
      action: { label: 'View log', run: () => this.openLog() }
    });
  }

  // Orange, between info and danger: something needs attention,
  // but nothing has failed yet.
  quota() {
    this.toast.push({
      tone: 'warn',
      title: 'Quota at 82%',
      body: 'eu-west-1 will throttle at 100%.'
    });
  }
}`,
    api: [
      { kind: 'method', name: 'push(toast)', type: '(t: HkToast) => string', default: '—', description: 'Queues a toast and returns its id.' },
      { kind: 'method', name: 'dismiss(id)', type: '(id: string) => void', default: '—', description: 'Removes one toast early.' },
      { kind: 'method', name: 'clear()', type: '() => void', default: '—', description: 'Empties the stack.' },
      { kind: 'input', name: 'position', type: "'top-right' | 'bottom-right' | 'top-center' | …", default: "'bottom-right'", description: 'Host corner.' },
      { kind: 'input', name: 'max', type: 'number', default: '3', description: 'Stack cap — oldest drops out first.' },
      { kind: 'input', name: 'tone', type: "'success' | 'info' | 'warn' | 'danger'", default: "'info'", description: 'Per-toast. `warn` is orange and sits between info and danger: something needs attention, but nothing has failed yet.' },
      { kind: 'input', name: 'duration', type: 'number', default: '4200', description: 'Milliseconds before auto-dismiss. 0 keeps it until dismissed.' }
    ],
    tokens: [
      { name: '--hk-toast-gap', default: '10px', description: 'Space between stacked toasts.' },
      { name: '--hk-toast-width', default: '360px', description: 'Toast width on wide screens.' }
    ],
    a11y: [
      'Host is an aria-live region: polite for info, assertive for errors.',
      'Timers pause on hover and on keyboard focus so a toast cannot vanish mid-read.'
    ]
  },
  {
    slug: 'accordion',
    name: 'Accordion',
    selector: 'hk-accordion',
    category: 'Feedback',
    status: 'stable',
    size: 2.2,
    tagline: 'Height-animated panels, single or multi expand.',
    description:
      'Animates on grid-template-rows rather than max-height, so panels of unknown content height still ease properly.',
    tags: ['collapse', 'faq'],
    usage: `<hk-accordion [multiple]="false" [(open)]="openIds">
  @for (item of faqs; track item.q) {
    <hk-panel [header]="item.q">{{ item.a }}</hk-panel>
  }
</hk-accordion>`,
    api: [
      { kind: 'input', name: 'multiple', type: 'boolean', default: 'false', description: 'Allows more than one panel open.' },
      { kind: 'input', name: 'open', type: 'string[]', default: '[]', description: 'Ids of open panels. Two-way bindable.' },
      { kind: 'output', name: 'toggled', type: 'EventEmitter<string>', default: '—', description: 'Emits the panel id that changed.' }
    ],
    keyboard: [
      { keys: 'Enter / Space', action: 'Toggle the focused panel' },
      { keys: '↑ / ↓', action: 'Move between headers' }
    ],
    a11y: ['Headers are real buttons with aria-expanded and aria-controls.']
  },
  {
    slug: 'alert',
    name: 'Alert',
    selector: 'hk-alert',
    category: 'Feedback',
    status: 'stable',
    size: 1.3,
    tagline: 'Inline banner in four tones, dismissible.',
    description:
      'An inline banner in four tones. Dismissal actually removes it, and the tone is carried by an icon as well as colour.',
    tags: ['banner', 'message'],
    usage: `<hk-alert
  tone="warning"
  title="Quota at 84%"
  [dismissible]="true"
  (dismissed)="ack()">
  Consider raising the concurrency limit.
</hk-alert>`,
    api: [
      { kind: 'input', name: 'tone', type: '\'info\' | \'success\' | \'warning\' | \'danger\'', default: '\'info\'', description: 'Sets the skin and the icon.' },
      { kind: 'input', name: 'title', type: 'string', default: '\'\'', description: 'Bold first line.' },
      { kind: 'input', name: 'dismissible', type: 'boolean', default: 'false', description: 'Shows the close button.' },
      { kind: 'input', name: 'icon', type: 'string | null', default: 'null', description: 'Overrides the tone icon.' },
      { kind: 'output', name: 'dismissed', type: 'EventEmitter<void>', default: '—', description: 'Emits when closed.' },
    ],
    tokens: [
      { name: '--hk-alert-info-bg', default: '#f0f9ff', description: 'Info fill.' },
      { name: '--hk-alert-danger-bg', default: '#fef2f2', description: 'Danger fill.' },
      { name: '--hk-alert-radius', default: '12px', description: 'Corner radius.' },
    ],
    keyboard: [
      { keys: 'Tab', action: 'Reaches the dismiss button' },
      { keys: 'Enter / Space', action: 'Dismisses' },
    ],
    a11y: [
      'Uses role="alert" for danger and warning so they interrupt, and role="status" for info and success so they do not.',
      'Every tone pairs a distinct icon with its colour, so the meaning survives colour blindness.',
    ],
  },
  {
    slug: 'progress',
    name: 'Progress',
    selector: 'hk-progress',
    category: 'Feedback',
    status: 'stable',
    size: 1.1,
    tagline: 'Linear and circular progress, determinate or not.',
    description:
      'Linear and circular off the same value, plus an indeterminate mode for when there is genuinely no percentage to report.',
    tags: ['loading', 'bar'],
    usage: `<hk-progress [value]="pct" label="Reindexing" />
<hk-progress variant="circular" [value]="pct" />
<hk-progress [indeterminate]="true" />`,
    api: [
      { kind: 'input', name: 'value', type: 'number', default: '0', description: 'Percentage, 0–100.' },
      { kind: 'input', name: 'variant', type: '\'linear\' | \'circular\'', default: '\'linear\'', description: 'Shape.' },
      { kind: 'input', name: 'indeterminate', type: 'boolean', default: 'false', description: 'Unknown duration; ignores value.' },
      { kind: 'input', name: 'label', type: 'string', default: '\'\'', description: 'Accessible name for the bar.' },
      { kind: 'input', name: 'showValue', type: 'boolean', default: 'false', description: 'Renders the percentage next to the bar.' },
    ],
    tokens: [
      { name: '--hk-progress-track', default: 'rgb(15 23 42 / 0.10)', description: 'Unfilled track.' },
      { name: '--hk-progress-fill', default: 'linear-gradient(90deg, #dc2626, #991b1b)', description: 'Filled portion.' },
      { name: '--hk-progress-height', default: '0.5rem', description: 'Bar thickness.' },
    ],
    a11y: [
      'role="progressbar" with aria-valuenow, and those attributes omitted entirely when indeterminate — which is how a screen reader knows the duration is unknown.',
      'The label is required for a bare bar; without one the control has no accessible name.',
    ],
  },
  {
    slug: 'skeleton',
    name: 'Skeleton',
    selector: 'hk-skeleton',
    category: 'Feedback',
    status: 'stable',
    size: 0.8,
    tagline: 'Shimmer placeholders that match your real layout.',
    description:
      'Placeholders shaped like the content they stand in for, so the layout does not shift when data lands. Three motions: a travelling sheen, a soft pulse, or none at all.',
    tags: ['loading', 'placeholder'],
    usage: `<hk-skeleton [loading]="pending()">
  <hk-skeleton-circle size="2.75rem" />
  <hk-skeleton-line width="60%" />
  <hk-skeleton-line width="40%" />
</hk-skeleton>

<!-- Or drive the primitives directly -->
<hk-skeleton-line [lines]="3" motion="shimmer" />`,
    api: [
      { kind: 'input', name: 'loading', type: 'boolean', default: 'true', description: 'Shows placeholders; projects the real content when false.' },
      { kind: 'input', name: 'motion', type: '\'shimmer\' | \'pulse\' | \'none\'', default: '\'shimmer\'', description: 'How the placeholder animates.' },
      { kind: 'input', name: 'width / height', type: 'string', default: '\'100%\' / \'1em\'', description: 'Box size. Match the real element to avoid a shift.' },
      { kind: 'input', name: 'radius', type: 'string', default: '\'0.375rem\'', description: 'Corner radius. Use 50% for an avatar.' },
      { kind: 'input', name: 'lines', type: 'number', default: '1', description: 'Repeats the line primitive, tapering the last one.' },
    ],
    tokens: [
      { name: '--hk-skeleton-base', default: '#e8ecf1', description: 'Placeholder fill.' },
      { name: '--hk-skeleton-sheen', default: '#f6f8fa', description: 'Colour of the travelling highlight.' },
      { name: '--hk-skeleton-speed', default: '1.4s', description: 'Sweep duration.' },
    ],
    a11y: [
      'The container is aria-busy while loading, so assistive tech knows content is pending rather than missing.',
      'Placeholders are aria-hidden — a screen reader should hear "loading", not a dozen empty boxes.',
      'prefers-reduced-motion drops to the static box rather than a slowed-down animation.',
    ],
  },
  {
    slug: 'spinner',
    name: 'Spinner',
    selector: 'hk-spinner',
    category: 'Feedback',
    status: 'stable',
    size: 0.6,
    tagline: 'Seven styles, all sized off the current font.',
    description:
      'Seven shapes, all sized in em, so the same component works in a button, a card or a full-page overlay without a size prop. Four are workhorses; orbit, comet and morph are for the splash and empty states where a plain ring reads as nothing happening.',
    tags: ['loading'],
    usage: `<hk-spinner />
<hk-spinner variant="dots" />

<!-- The louder set, for a splash or an empty state -->
<hk-spinner variant="orbit" />
<hk-spinner variant="comet" />
<hk-spinner variant="morph" />

<!-- Inside a control it inherits size and colour -->
<button>
  <hk-spinner variant="ring" [inherit]="true" />
  Deploying…
</button>

<!-- Sized off font-size, so one component fits a button and a page -->
<div style="font-size: 2rem"><hk-spinner /></div>`,
    api: [
      { kind: 'input', name: 'variant', type: "'ring' | 'dots' | 'bars' | 'pulse' | 'orbit' | 'comet' | 'morph'", default: "'ring'", description: 'The first four are the workhorses. `orbit`, `comet` and `morph` are for splash and empty states, where a plain ring reads as nothing happening.' },
      { kind: 'input', name: 'inherit', type: 'boolean', default: 'false', description: 'Takes colour from currentColor, for use inside a filled control.' },
      { kind: 'input', name: 'label', type: 'string', default: '\'Loading\'', description: 'Text announced to assistive tech.' },
      { kind: 'input', name: 'delay', type: 'number', default: '0', description: 'Milliseconds to wait before showing — avoids a flash on fast responses.' },
    ],
    tokens: [
      { name: '--hk-spinner-accent', default: '#dc2626', description: 'Spinner colour.' },
      { name: '--hk-spinner-track', default: 'rgb(15 23 42 / 0.12)', description: 'Unfilled ring.' },
      { name: '--hk-spinner-speed', default: '0.7s', description: 'Rotation duration.' },
    ],
    a11y: [
      'Wrapped in role="status" aria-live="polite" with a visually hidden label, so it announces once without nagging.',
      'Sized in em rather than px, so it scales with whatever text it sits beside.',
      'Under prefers-reduced-motion it holds a legible static state instead of merely slowing down.',
    ],
  },
  {
    slug: 'empty-state',
    name: 'Empty state',
    selector: 'hk-empty',
    category: 'Feedback',
    status: 'stable',
    size: 1.0,
    tagline: 'Illustration, message and call to action.',
    description:
      'Three empty states that genuinely differ — nothing yet, nothing matching, and something broke — because the right next action is different in each.',
    tags: ['zero', 'placeholder'],
    usage: `<hk-empty
  icon="pi pi-filter-slash"
  title="No services match"
  body="Three filters are narrowing this list to nothing."
  actionLabel="Clear filters"
  (action)="clearFilters()" />`,
    api: [
      { kind: 'input', name: 'icon', type: 'string', default: '\'\'', description: 'Icon class shown above the title.' },
      { kind: 'input', name: 'title', type: 'string', default: '\'\'', description: 'Headline.' },
      { kind: 'input', name: 'body', type: 'string', default: '\'\'', description: 'Supporting sentence — say what to do next.' },
      { kind: 'input', name: 'actionLabel', type: 'string', default: '\'\'', description: 'Primary button label. Omit for no button.' },
      { kind: 'output', name: 'action', type: 'EventEmitter<void>', default: '—', description: 'Emits when the button is pressed.' },
    ],
    tokens: [
      { name: '--hk-empty-icon', default: '#94a3b8', description: 'Icon colour.' },
      { name: '--hk-empty-pad', default: '2.5rem 1rem', description: 'Block padding.' },
    ],
    a11y: [
      'The title is a heading, so the state is reachable by heading navigation.',
      'The action is a button when it triggers work and a link when it navigates — not always a button.',
    ],
  },

  // ── Overlay ─────────────────────────────────────────────────
  {
    slug: 'dialog',
    name: 'Dialog',
    selector: 'hk-dialog',
    category: 'Overlay',
    status: 'stable',
    size: 3.8,
    tagline: 'Focus-trapped modal built on the native dialog element.',
    description:
      'Built on the native <dialog> element, so focus trapping, Escape, inertness of the page behind and the top layer all come from the platform rather than a JavaScript reimplementation.',
    tags: ['modal', 'popup'],
    usage: `<hk-dialog #invite (closed)="onClose($event)">
  <h3 hkDialogTitle>Invite to Night Shift</h3>
  <p hkDialogBody>They will get read access to every service.</p>
  <button hkDialogClose value="cancel">Cancel</button>
  <button hkDialogClose value="invited">Send invite</button>
</hk-dialog>

<button (click)="invite.open()">Invite teammates</button>`,
    api: [
      { kind: 'input', name: 'closeOnBackdrop', type: 'boolean', default: 'true', description: 'Clicking the backdrop dismisses.' },
      { kind: 'input', name: 'size', type: '\'sm\' | \'md\' | \'lg\'', default: '\'md\'', description: 'Panel width.' },
      { kind: 'method', name: 'open()', type: '() => void', default: '—', description: 'Opens as a modal and moves focus inside.' },
      { kind: 'method', name: 'close(value?)', type: '(value?: string) => void', default: '—', description: 'Closes and returns the value through (closed).' },
      { kind: 'output', name: 'closed', type: 'EventEmitter<string>', default: '—', description: 'Emits the return value, or "dismissed".' },
    ],
    tokens: [
      { name: '--hk-dialog-bg', default: '#ffffff', description: 'Panel background.' },
      { name: '--hk-dialog-backdrop', default: 'rgb(15 23 42 / 0.5)', description: 'Backdrop wash.' },
      { name: '--hk-dialog-width', default: '22rem', description: 'Default panel width.' },
    ],
    keyboard: [
      { keys: 'Escape', action: 'Closes — handled by the platform' },
      { keys: 'Tab', action: 'Cycles within the dialog only' },
    ],
    a11y: [
      'showModal() gives real focus trapping and marks the rest of the page inert; no focus-loop code to get wrong.',
      'Focus returns to the invoking element on close.',
      'The panel is labelled by its title element via aria-labelledby.',
    ],
  },
  {
    slug: 'drawer',
    name: 'Drawer',
    selector: 'hk-drawer',
    category: 'Overlay',
    status: 'stable',
    size: 3.0,
    tagline: 'Edge sheet from any side, swipe-dismissable on touch.',
    description:
      'An edge sheet from any side. The panel slides, the scrim fades, and on touch it can be swiped away.',
    tags: ['sheet', 'panel'],
    usage: `<hk-drawer [(open)]="filtersOpen" side="right" size="18rem">
  <h3>Filters</h3>
  <!-- … -->
</hk-drawer>`,
    api: [
      { kind: 'input', name: 'open', type: 'boolean', default: 'false', description: 'Visibility. Two-way bindable.' },
      { kind: 'input', name: 'side', type: '\'left\' | \'right\' | \'top\' | \'bottom\'', default: '\'right\'', description: 'Which edge it enters from.' },
      { kind: 'input', name: 'size', type: 'string', default: '\'18rem\'', description: 'Width for side drawers, height for top and bottom.' },
      { kind: 'input', name: 'swipeToClose', type: 'boolean', default: 'true', description: 'Allows a touch drag to dismiss.' },
      { kind: 'output', name: 'openChange', type: 'EventEmitter<boolean>', default: '—', description: 'Emits on open and close.' },
    ],
    tokens: [
      { name: '--hk-drawer-bg', default: '#ffffff', description: 'Panel background.' },
      { name: '--hk-drawer-scrim', default: 'rgb(15 23 42 / 0.4)', description: 'Backdrop wash.' },
      { name: '--hk-drawer-ease', default: 'cubic-bezier(0.32, 0.72, 0, 1)', description: 'Slide easing.' },
    ],
    keyboard: [
      { keys: 'Escape', action: 'Closes' },
      { keys: 'Tab', action: 'Stays within the panel while open' },
    ],
    a11y: [
      'role="dialog" with aria-modal, and focus moved into the panel on open.',
      'Focus returns to the trigger on close.',
      'The scrim is aria-hidden — the close affordance is a real labelled button.',
    ],
  },
  {
    slug: 'popover',
    name: 'Popover',
    selector: 'hk-popover',
    category: 'Overlay',
    status: 'stable',
    size: 2.6,
    tagline: 'Anchored panel that flips and shifts to stay on screen.',
    description:
      'An anchored panel that flips and shifts to stay on screen. Positioned from the trigger rect, so a scrolling container cannot clip it. Placement is one string — a side, plus an alignment when it is not centred — and the panel and its arrow both derive from it, so they cannot end up pointing different ways.',
    tags: ['flyout', 'anchor'],
    usage: `<!-- placement is side, or side-alignment when not centred -->
<hk-popover placement="top">
  <button hkPopoverTrigger>Deploy details</button>
  <div hkPopoverContent>
    <!-- … -->
  </div>
</hk-popover>

<hk-popover placement="right-start">…</hk-popover>
<hk-popover placement="bottom-end">…</hk-popover>

<!-- flip is what makes the placement a promise rather than a preference -->
<hk-popover placement="bottom" [flip]="true" [shift]="true">…</hk-popover>`,
    api: [
      { kind: 'input', name: 'placement', type: "'top' | 'right' | 'bottom' | 'left' | `${Side}-start` | `${Side}-end`", default: "'bottom'", description: 'Side plus optional alignment — the only two decisions there are. The panel and its arrow both derive from it, so they cannot disagree.' },
      { kind: 'input', name: 'flip', type: 'boolean', default: 'true', description: 'What separates a placement preference from a promise: a panel that would leave the viewport swaps to the opposite side rather than being clipped.' },
      { kind: 'input', name: 'shift', type: 'boolean', default: 'true', description: 'Slides the panel along its edge to stay on screen before resorting to a flip.' },
      { kind: 'input', name: 'trigger', type: '\'click\' | \'hover\'', default: '\'click\'', description: 'What opens it.' },
      { kind: 'input', name: 'offset', type: 'number', default: '8', description: 'Gap between trigger and panel, in px.' },
      { kind: 'input', name: 'arrow', type: 'boolean', default: 'true', description: 'Draws the pointer toward the trigger.' },
      { kind: 'output', name: 'openChange', type: 'EventEmitter<boolean>', default: '—', description: 'Emits on open and close.' },
    ],
    tokens: [
      { name: '--hk-popover-bg', default: '#ffffff', description: 'Panel background.' },
      { name: '--hk-popover-shadow', default: '0 18px 40px rgb(15 23 42 / 0.14)', description: 'Panel shadow.' },
    ],
    keyboard: [
      { keys: 'Enter / Space', action: 'Opens from the trigger' },
      { keys: 'Escape', action: 'Closes and restores focus' },
      { keys: 'Tab', action: 'Moves into the panel content' },
    ],
    a11y: [
      'The trigger carries aria-expanded and aria-controls, so its state is announced.',
      'Unlike a tooltip the panel is interactive and focusable — it is a dialog, and is labelled as one.',
    ],
  },
  {
    slug: 'tooltip',
    name: 'Tooltip',
    selector: 'hkTooltip',
    category: 'Overlay',
    status: 'stable',
    size: 1.4,
    tagline: 'Directive tooltip with hover, focus and touch triggers.',
    description:
      'A directive, not a component. Shows on hover and on keyboard focus — the second being the one most tooltips forget — and stays out of the accessibility tree as a duplicate label.',
    tags: ['hint', 'directive'],
    usage: `<button hkTooltip="Copy install command" hkTooltipPlacement="top">
  <i class="pi pi-copy"></i>
</button>`,
    api: [
      { kind: 'input', name: 'hkTooltip', type: 'string', default: '\'\'', description: 'Tooltip text. Empty disables it.' },
      { kind: 'input', name: 'hkTooltipPlacement', type: '\'top\' | \'bottom\' | \'left\' | \'right\'', default: '\'top\'', description: 'Preferred side; flips at the viewport edge.' },
      { kind: 'input', name: 'hkTooltipDelay', type: 'number', default: '400', description: 'Milliseconds before it appears on hover.' },
      { kind: 'input', name: 'hkTooltipDisabled', type: 'boolean', default: 'false', description: 'Suppresses it without removing the directive.' },
    ],
    tokens: [
      { name: '--hk-tooltip-bg', default: '#0f172a', description: 'Bubble background.' },
      { name: '--hk-tooltip-text', default: '#ffffff', description: 'Bubble text colour.' },
      { name: '--hk-tooltip-delay', default: '400ms', description: 'Hover delay.' },
    ],
    keyboard: [
      { keys: 'Tab', action: 'Focus shows the tooltip' },
      { keys: 'Escape', action: 'Dismisses it while focus stays put' },
    ],
    a11y: [
      'Appears on focus as well as hover, so it is not mouse-only.',
      'Linked with aria-describedby; when the host already has that text as its label the tooltip is hidden from the tree instead of being read twice.',
      'Escape dismisses without moving focus, per the ARIA tooltip pattern.',
    ],
  },
  {
    slug: 'confirm',
    name: 'Confirm',
    selector: 'HkConfirmService',
    category: 'Overlay',
    status: 'stable',
    size: 1.9,
    tagline: 'Promise-returning confirmation, no template needed.',
    description:
      'A service, not a template. Ask returns a promise, so a destructive action reads as a single await instead of a callback and a boolean flag.',
    tags: ['dialog', 'service'],
    usage: `const ok = await this.confirm.ask({
  title: 'Delete this service?',
  body: 'Every deploy record and log stream goes with it.',
  confirmLabel: 'Delete',
  tone: 'danger'
});
if (ok) this.remove();`,
    api: [
      { kind: 'method', name: 'ask(options)', type: 'Promise<boolean>', default: '—', description: 'Opens the dialog and resolves true on confirm, false on cancel or dismiss.' },
      { kind: 'input', name: 'title', type: 'string', default: '\'\'', description: 'Headline. Ask a question.' },
      { kind: 'input', name: 'body', type: 'string', default: '\'\'', description: 'What will actually happen, and whether it can be undone.' },
      { kind: 'input', name: 'confirmLabel', type: 'string', default: '\'Confirm\'', description: 'Primary button label — name the action, not "OK".' },
      { kind: 'input', name: 'tone', type: '\'default\' | \'danger\'', default: '\'default\'', description: 'Danger restyles the confirm button.' },
    ],
    tokens: [
      { name: '--hk-confirm-danger', default: '#b91c1c', description: 'Confirm button fill in danger tone.' },
    ],
    keyboard: [
      { keys: 'Escape', action: 'Cancels, resolving false' },
      { keys: 'Enter', action: 'Confirms' },
      { keys: 'Tab', action: 'Cycles within the dialog' },
    ],
    a11y: [
      'role="alertdialog" so the prompt interrupts rather than waiting to be discovered.',
      'Initial focus lands on the confirm button; Escape always resolves false, never leaving the promise pending.',
    ],
  },
  {
    slug: 'context-menu',
    name: 'Context menu',
    selector: 'hkContextMenu',
    category: 'Overlay',
    status: 'stable',
    size: 2.3,
    tagline: 'Right-click menu that respects viewport edges.',
    description:
      'A right-click menu that clamps itself inside its container, so it never opens half off-screen near an edge.',
    tags: ['menu', 'right-click'],
    usage: `<div [hkContextMenu]="rowActions" (menuSelect)="run($event)">
  <!-- right-click target -->
</div>`,
    api: [
      { kind: 'input', name: 'hkContextMenu', type: 'HkMenuItem[]', default: '[]', description: 'Items to show.' },
      { kind: 'input', name: 'disabled', type: 'boolean', default: 'false', description: 'Falls back to the browser menu.' },
      { kind: 'output', name: 'menuSelect', type: 'EventEmitter<HkMenuItem>', default: '—', description: 'Emits the chosen item.' },
    ],
    tokens: [
      { name: '--hk-context-bg', default: '#ffffff', description: 'Panel background.' },
      { name: '--hk-context-danger', default: '#dc2626', description: 'Colour for destructive items.' },
    ],
    keyboard: [
      { keys: 'Shift + F10 / Menu key', action: 'Opens the menu from the keyboard' },
      { keys: '↑ / ↓', action: 'Moves through items' },
      { keys: 'Escape', action: 'Closes and restores focus' },
    ],
    a11y: [
      'Opens from the keyboard menu key as well as right-click — otherwise the actions are mouse-only.',
      'Coordinates are clamped to the container, so the panel is always fully visible.',
      'Focus returns to the target element on close.',
    ],
  },

  // ── Layout ──────────────────────────────────────────────────
  {
    slug: 'card',
    name: 'Card',
    selector: 'hk-card',
    category: 'Layout',
    status: 'stable',
    size: 0.9,
    tagline: 'Header, body, footer and media — every slot independent.',
    description:
      'A surface with four optional slots — media, header, body, footer — that collapse cleanly when unused, so one component covers every card on the page. None of them implies another: showing the media does not oblige you to drop the copy, and dropping the copy does not take the media with it. The card supplies only the padding and the rules between whatever is actually there, so an omitted slot leaves no stray line or gap.',
    tags: ['surface', 'panel'],
    usage: `<hk-card>
  <img hkCardMedia src="cover.jpg" alt="" />
  <div hkCardHeader>
    <h3>billing-api</h3>
    <hk-tag tone="success">healthy</hk-tag>
  </div>
  <p hkCardBody>Handles invoicing and dunning.</p>
  <div hkCardFooter>Updated 14 min ago</div>
</hk-card>

<!-- The slots do not imply one another. Media with no copy… -->
<hk-card>
  <img hkCardMedia src="cover.jpg" alt="" />
  <div hkCardFooter>Updated 14 min ago</div>
</hk-card>

<!-- …and copy with no media are the same component. Nothing collapses
     into a stray rule or gap when a slot is left out. -->
<hk-card>
  <div hkCardHeader><h3>billing-api</h3></div>
  <p hkCardBody>Handles invoicing and dunning.</p>
</hk-card>`,
    api: [
      { kind: 'input', name: 'media', type: 'TemplateRef | null', default: 'null', description: 'Media slot. Independent of the rest — showing it does not oblige you to drop the copy, and dropping the copy does not take it with you.' },
      { kind: 'input', name: 'mediaPosition', type: "'top' | 'left'", default: "'top'", description: 'Media above the content, or beside it as a rail.' },
      { kind: 'input', name: 'dividers', type: 'boolean', default: 'true', description: 'Rules between the slots that are actually present. An empty slot leaves no stray line or gap.' },
      { kind: 'input', name: 'interactive', type: 'boolean', default: 'false', description: 'Adds hover lift and makes the whole card the click target.' },
      { kind: 'input', name: 'padding', type: 'string', default: '\'1rem\'', description: 'Inner padding for the body slot.' },
      { kind: 'output', name: 'activated', type: 'EventEmitter<Event>', default: '—', description: 'Emits on click or Enter when interactive.' },
    ],
    tokens: [
      { name: '--hk-card-bg', default: '#ffffff', description: 'Surface colour.' },
      { name: '--hk-card-radius', default: '16px', description: 'Corner radius.' },
      { name: '--hk-card-border', default: '#e2e8f0', description: 'Hairline border.' },
    ],
    keyboard: [
      { keys: 'Enter / Space', action: 'Activates an interactive card' },
    ],
    a11y: [
      'An interactive card becomes one focusable control rather than a div with a click handler.',
      'Media carries an empty alt when decorative, so it is skipped rather than announced as a filename.',
    ],
  },
  {
    slug: 'divider',
    name: 'Divider',
    selector: 'hk-divider',
    category: 'Layout',
    status: 'stable',
    size: 0.4,
    tagline: 'Horizontal or vertical rule with an optional label.',
    description:
      'A rule that can carry a label. Horizontal or vertical, and decorative by default so it does not clutter the accessibility tree.',
    tags: ['separator'],
    usage: `<hk-divider />
<hk-divider label="or" />
<hk-divider orientation="vertical" />`,
    api: [
      { kind: 'input', name: 'orientation', type: '\'horizontal\' | \'vertical\'', default: '\'horizontal\'', description: 'Direction.' },
      { kind: 'input', name: 'label', type: 'string', default: '\'\'', description: 'Centred text that breaks the rule.' },
      { kind: 'input', name: 'decorative', type: 'boolean', default: 'true', description: 'Hides it from assistive tech. Set false when it separates real sections.' },
    ],
    tokens: [
      { name: '--hk-divider-color', default: '#e2e8f0', description: 'Rule colour.' },
      { name: '--hk-divider-thickness', default: '1px', description: 'Rule thickness.' },
    ],
    a11y: [
      'Decorative by default with aria-hidden; opt into role="separator" when the split is meaningful.',
      'A labelled divider keeps its text readable rather than hiding it behind the line.',
    ],
  },
  {
    slug: 'split-pane',
    name: 'Split pane',
    selector: 'hk-split',
    category: 'Layout',
    status: 'stable',
    size: 2.5,
    tagline: 'Draggable splitter with keyboard resize and min sizes.',
    description:
      'A draggable splitter with keyboard resize and real minimum sizes, so neither pane can be collapsed into uselessness by accident.',
    tags: ['resize', 'panes'],
    usage: `<hk-split [(split)]="ratio" [min]="18" [max]="82">
  <div hkPane>Request</div>
  <div hkPane>Response</div>
</hk-split>`,
    api: [
      { kind: 'input', name: 'split', type: 'number', default: '50', description: 'First pane size as a percentage. Two-way bindable.' },
      { kind: 'input', name: 'min / max', type: 'number', default: '10 / 90', description: 'Clamp bounds, as percentages.' },
      { kind: 'input', name: 'orientation', type: '\'horizontal\' | \'vertical\'', default: '\'horizontal\'', description: 'Splitter direction.' },
      { kind: 'input', name: 'step', type: 'number', default: '4', description: 'Percentage moved per arrow-key press.' },
      { kind: 'output', name: 'splitChange', type: 'EventEmitter<number>', default: '—', description: 'Emits while dragging.' },
    ],
    tokens: [
      { name: '--hk-split-handle', default: 'rgb(15 23 42 / 0.06)', description: 'Handle colour at rest.' },
      { name: '--hk-split-handle-active', default: '#dc2626', description: 'Handle colour while dragging or focused.' },
    ],
    keyboard: [
      { keys: '← / →', action: 'Moves the splitter by one step' },
      { keys: 'Home / End', action: 'Jumps to the min / max bound' },
      { keys: 'Enter', action: 'Toggles the pane collapsed' },
    ],
    a11y: [
      'The handle is role="separator" with aria-valuenow, and it is focusable — resizing is not mouse-only.',
      'Clamping to min and max means a pane can never be dragged to zero width by accident.',
    ],
  },
  {
    slug: 'scroll-area',
    name: 'Scroll area',
    selector: 'hk-scroll-area',
    category: 'Layout',
    status: 'stable',
    size: 1.6,
    tagline: 'Styled scrollbars with edge-fade affordances.',
    description:
      'Styled scrollbars with edge fades that track the real scroll position, so the fade only appears when there is genuinely more content that way.',
    tags: ['overflow'],
    usage: `<hk-scroll-area maxHeight="11rem" [fade]="true">
  <!-- long content -->
</hk-scroll-area>`,
    api: [
      { kind: 'input', name: 'maxHeight', type: 'string', default: '\'20rem\'', description: 'Height before the area scrolls.' },
      { kind: 'input', name: 'fade', type: 'boolean', default: 'true', description: 'Shows gradient affordances at the scrollable edges.' },
      { kind: 'input', name: 'axis', type: '\'y\' | \'x\' | \'both\'', default: '\'y\'', description: 'Which direction scrolls.' },
      { kind: 'output', name: 'scrolled', type: 'EventEmitter<{ top: boolean; bottom: boolean }>', default: '—', description: 'Emits when an edge is reached.' },
    ],
    tokens: [
      { name: '--hk-scroll-thumb', default: '#cbd5e1', description: 'Scrollbar thumb.' },
      { name: '--hk-scroll-width', default: '8px', description: 'Scrollbar thickness.' },
      { name: '--hk-scroll-fade', default: '2rem', description: 'Height of the edge fade.' },
    ],
    keyboard: [
      { keys: '↑ / ↓', action: 'Scrolls when the area has focus' },
      { keys: 'Page Up / Page Down', action: 'Scrolls by a viewport' },
    ],
    a11y: [
      'The region is focusable and keyboard-scrollable — custom scrollbars must not remove that.',
      'Fades are aria-hidden decoration and are driven by measured scroll position, never faked as always-on.',
    ],
  },
  {
    slug: 'stack',
    name: 'Stack',
    selector: 'hk-stack',
    category: 'Layout',
    status: 'stable',
    size: 0.5,
    tagline: 'Flex row or column with token-driven gaps.',
    description:
      'Flex row or column with token-driven gaps. The layout primitive you reach for before writing another one-off flex utility.',
    tags: ['flex', 'spacing'],
    usage: `<hk-stack direction="row" gap="0.75rem" align="center">
  <button>Save</button>
  <button>Cancel</button>
</hk-stack>`,
    api: [
      { kind: 'input', name: 'direction', type: '\'row\' | \'column\'', default: '\'column\'', description: 'Main axis.' },
      { kind: 'input', name: 'gap', type: 'string', default: '\'0.5rem\'', description: 'Space between children.' },
      { kind: 'input', name: 'align', type: '\'start\' | \'center\' | \'end\' | \'stretch\'', default: '\'stretch\'', description: 'Cross-axis alignment.' },
      { kind: 'input', name: 'justify', type: '\'start\' | \'center\' | \'end\' | \'between\'', default: '\'start\'', description: 'Main-axis distribution.' },
      { kind: 'input', name: 'wrap', type: 'boolean', default: 'false', description: 'Allows children to wrap.' },
    ],
    tokens: [
      { name: '--hk-stack-gap', default: '0.5rem', description: 'Default gap when none is passed.' },
    ],
    a11y: [
      'Purely presentational: it adds no roles and does not disturb the reading order of its children.',
    ],
  },
  {
    slug: 'app-shell',
    name: 'App shell',
    selector: 'hk-app-shell',
    category: 'Layout',
    status: 'stable',
    size: 2.8,
    tagline: 'Header, sidebar and content frame with responsive rules.',
    description:
      'Header, navigation rail and content frame with the responsive rule built in — below the breakpoint the rail overlays the content instead of squeezing it.',
    tags: ['shell', 'layout'],
    usage: `<hk-app-shell [(navOpen)]="navOpen" overlayBelow="lg">
  <header hkShellHeader>…</header>
  <nav hkShellNav>…</nav>
  <main hkShellContent>…</main>
</hk-app-shell>`,
    api: [
      { kind: 'input', name: 'navOpen', type: 'boolean', default: 'true', description: 'Rail visibility. Two-way bindable.' },
      { kind: 'input', name: 'overlayBelow', type: 'string', default: '\'lg\'', description: 'Breakpoint under which the rail overlays rather than pushes.' },
      { kind: 'input', name: 'navWidth', type: 'string', default: '\'13rem\'', description: 'Expanded rail width.' },
      { kind: 'output', name: 'navOpenChange', type: 'EventEmitter<boolean>', default: '—', description: 'Emits on toggle.' },
    ],
    tokens: [
      { name: '--hk-shell-header-h', default: '3.5rem', description: 'Header height.' },
      { name: '--hk-shell-nav-w', default: '13rem', description: 'Rail width.' },
      { name: '--hk-shell-bg', default: '#ffffff', description: 'Content background.' },
    ],
    keyboard: [
      { keys: 'Escape', action: 'Closes the overlay rail on small screens' },
    ],
    a11y: [
      'Emits real landmarks — banner, navigation, main — so screen-reader users can jump between regions.',
      'While the rail overlays, focus is trapped inside it and Escape closes it.',
    ],
  },

  // ── Data ────────────────────────────────────────────────────
  {
    slug: 'table',
    name: 'Table',
    selector: 'hk-table',
    category: 'Data',
    status: 'stable',
    size: 14.2,
    tagline: 'Grouped headers, filters, virtual scroll — the whole grid.',
    description:
      'The one component that has to do everything: hierarchical headers of any depth, per-column and global filtering, single or multi-column sort, client or server paging, selection, row expansion, row grouping, frozen columns, resize, reorder, column visibility, inline editing, footer aggregates, virtual scrolling, CSV export and persisted state. It renders through delegated events and a windowed body, so ten thousand rows scroll at frame rate instead of turning into a slideshow.',
    tags: ['grid', 'datatable', 'virtual', 'filter', 'sort'],
    usage: `import { HkTableComponent, HkTemplate, HkColumn } from '@hellskitchen/ui/table';

@Component({
  imports: [HkTableComponent, HkTemplate],
  template: \`
    <hk-table
      [value]="rows()"
      [columns]="columns"
      dataKey="id"
      [paginator]="true" [rows]="25"
      sortMode="multiple"
      selectionMode="checkbox" [(selection)]="picked"
      [showSearch]="true" [columnToggle]="true" [resizableColumns]="true"
      editMode="cell"
      stateKey="deploys"
      (lazyLoad)="load($event)">

      <!-- Matched to the column by key — no wiring needed. -->
      <ng-template hkTemplate="cell:status" let-value>
        <hk-tag [tone]="value">{{ value }}</hk-tag>
      </ng-template>

      <ng-template hkTemplate="expansion" let-row>
        <app-deploy-detail [deploy]="row" />
      </ng-template>
    </hk-table>\`
})
export class DeploysComponent {
  readonly picked = signal<Deploy[]>([]);

  // Nest \`children\` to any depth for grouped headers.
  readonly columns: HkColumn<Deploy>[] = [
    { key: 'service', header: 'Service', sortable: true, filter: 'text', frozen: 'left' },
    { key: 'region', header: 'Region', sortable: true, filter: 'multiselect' },
    { key: 'status', header: 'Status', filter: 'select', align: 'center' },
    { key: 'units', header: 'Units', numeric: true, editable: true, aggregate: 'sum' },
    { key: 'revenue', header: 'Revenue', children: [
      { key: 'q1', header: 'Q1', numeric: true, aggregate: 'sum' },
      { key: 'q2', header: 'Q2', numeric: true, aggregate: 'sum' }
    ] }
  ];
}`,
    api: [
      { kind: 'input', name: 'value', type: 'T[]', default: '[]', description: 'Rows to render. With [lazy] this is the current page only.' },
      { kind: 'input', name: 'columns', type: 'HkColumn<T>[]', default: '[]', description: 'Column tree. Nest children for grouped headers of any depth.' },
      { kind: 'input', name: 'dataKey', type: 'string', default: "''", description: 'Unique row field. Required for stable selection, expansion and editing.' },
      { kind: 'input', name: 'loading', type: 'boolean', default: 'false', description: 'Shows the loading overlay and sets aria-busy.' },
      { kind: 'input', name: 'lazy', type: 'boolean', default: 'false', description: 'Hands sorting, filtering and paging to the server through (lazyLoad).' },
      { kind: 'input', name: 'totalRecords', type: 'number | null', default: 'null', description: 'Server-side row count. Only read when lazy.' },
      { kind: 'input', name: 'paginator', type: 'boolean', default: 'false', description: 'Renders the pager and slices the data client-side.' },
      { kind: 'input', name: 'first / rows', type: 'number', default: '0 / 10', description: 'Page offset and page size. Both two-way bindable.' },
      { kind: 'input', name: 'rowsPerPageOptions', type: 'number[]', default: '[10, 25, 50, 100]', description: 'Page-size choices. Pass [] to hide the selector.' },
      { kind: 'input', name: 'sortMode', type: "'single' | 'multiple'", default: "'single'", description: 'In multiple mode, shift-click stacks sort fields.' },
      { kind: 'input', name: 'sort', type: 'HkSortMeta[]', default: '[]', description: 'Active sort stack, outermost first. Two-way bindable.' },
      { kind: 'input', name: 'filters', type: 'HkFilterState', default: '{}', description: 'Per-column filter state, keyed by dotted column id.' },
      { kind: 'input', name: 'globalFilter', type: 'string', default: "''", description: 'Search term. Two-way bindable; debounced by searchDelay.' },
      { kind: 'input', name: 'globalFilterFields', type: 'string[]', default: '[]', description: 'Fields the search looks at. Defaults to every visible leaf.' },
      { kind: 'input', name: 'selectionMode', type: "'single' | 'multiple' | 'checkbox' | null", default: 'null', description: 'How rows are picked. Checkbox adds a leading column with select-all.' },
      { kind: 'input', name: 'selection', type: 'T[]', default: '[]', description: 'Selected rows — always an array, even in single mode. Two-way bindable.' },
      { kind: 'input', name: 'rowExpansion', type: 'boolean', default: 'false', description: 'Adds the expander column; pair with an "expansion" template.' },
      { kind: 'input', name: 'expandedKeys', type: 'Record<string, boolean>', default: '{}', description: 'Open rows, keyed by dataKey. Two-way bindable.' },
      { kind: 'input', name: 'groupRowsBy', type: 'string', default: "''", description: 'Field to group rows by. Groups render contiguously.' },
      { kind: 'input', name: 'rowGroupMode', type: "'subheader' | 'rowspan'", default: "'subheader'", description: 'Collapsible group header row, or a merged cell spanning the group.' },
      { kind: 'input', name: 'showGroupFooter', type: 'boolean', default: 'false', description: 'Per-group subtotal row using each column aggregate.' },
      { kind: 'input', name: 'virtualScroll', type: 'boolean', default: 'false', description: 'Windows the body to the visible rows. Needs a scrollHeight.' },
      { kind: 'input', name: 'virtualRowHeight', type: 'number', default: '36', description: 'Row height in px. Rows are pinned to it so the spacers stay exact.' },
      { kind: 'input', name: 'scrollHeight', type: 'string', default: "''", description: 'Max height of the scroll viewport, e.g. "24rem".' },
      { kind: 'input', name: 'stickyHeader', type: 'boolean', default: 'true', description: 'Pins every header row, offsetting each by the ones above it.' },
      { kind: 'input', name: 'resizableColumns', type: 'boolean', default: 'false', description: 'Drag a header edge to resize. Switches the table to fixed layout.' },
      { kind: 'input', name: 'reorderableColumns', type: 'boolean', default: 'false', description: 'Drag top-level headers to reorder them.' },
      { kind: 'input', name: 'columnToggle', type: 'boolean', default: 'false', description: 'Adds the column-visibility menu to the toolbar.' },
      { kind: 'input', name: 'editMode', type: "'cell' | 'row' | null", default: 'null', description: 'Cell edits on double-click or Enter; row mode adds Save/Cancel controls.' },
      { kind: 'input', name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Density. Drives padding and font size off one token.' },
      { kind: 'input', name: 'striped / gridlines / hover', type: 'boolean', default: 'false / true / true', description: 'Chrome toggles.' },
      { kind: 'input', name: 'showIndex', type: 'boolean', default: 'false', description: 'Serial-number column, continuous across pages.' },
      { kind: 'input', name: 'showSearch / showExport', type: 'boolean', default: 'false', description: 'Toolbar search box and CSV export button.' },
      { kind: 'input', name: 'rowClass', type: 'string | ((row: T, i: number) => string)', default: "''", description: 'Extra classes per row — threshold highlighting and the like.' },
      { kind: 'input', name: 'keyboardNavigation', type: 'boolean', default: 'true', description: 'Arrow-key cell focus, Space to select, Enter to edit.' },
      { kind: 'input', name: 'stateKey', type: 'string', default: "''", description: 'Persists sort, filters, page, widths, order and visibility under this key.' },
      { kind: 'output', name: 'lazyLoad', type: 'EventEmitter<HkTableLazyEvent>', default: '—', description: 'Server needs a page. Carries first, rows, sort, filters and the trigger.' },
      { kind: 'output', name: 'pageChange', type: 'EventEmitter<HkPageEvent>', default: '—', description: 'Page or page size changed.' },
      { kind: 'output', name: 'sortChange', type: 'EventEmitter<HkSortMeta[]>', default: '—', description: 'The sort stack after the click.' },
      { kind: 'output', name: 'rowSelect / rowUnselect', type: 'EventEmitter<{ row, index }>', default: '—', description: 'One row moved in or out of the selection.' },
      { kind: 'output', name: 'rowExpand / rowCollapse', type: 'EventEmitter<{ row, key }>', default: '—', description: 'Detail panel opened or closed.' },
      { kind: 'output', name: 'editComplete / editCancel', type: 'EventEmitter<HkEditEvent<T>>', default: '—', description: 'An edit was committed or abandoned. Carries value and oldValue.' },
      { kind: 'output', name: 'columnResize / columnReorder', type: 'EventEmitter<…>', default: '—', description: 'Column geometry changed — persist it yourself, or use stateKey.' },
      { kind: 'method', name: 'reset()', type: '() => void', default: '—', description: 'Clears sort, filters, paging and every column override.' },
      { kind: 'method', name: 'clearFilters()', type: '() => void', default: '—', description: 'Drops all column filters and the search term.' },
      { kind: 'method', name: 'exportCsv()', type: '() => void', default: '—', description: 'Exports the filtered, sorted set — not just the visible page.' },
      { kind: 'method', name: 'expandAll() / collapseAll()', type: '() => void', default: '—', description: 'Bulk row expansion.' },
      { kind: 'method', name: 'refresh()', type: '() => void', default: '—', description: 'Re-runs the pipeline, or re-asks the server when lazy.' }
    ],
    tokens: [
      { name: '--hk-table-header-bg', default: '#121214', description: 'Header row background. Sticky rows inherit it.' },
      { name: '--hk-table-row-hover', default: 'rgb(255 255 255 / 0.04)', description: 'Row hover wash.' },
      { name: '--hk-table-stripe', default: 'rgb(255 255 255 / 0.02)', description: 'Even-row tint when [striped].' },
      { name: '--hk-table-selected', default: 'rgb(220 38 38 / 0.16)', description: 'Selected-row background.' },
      { name: '--hk-table-density', default: '1', description: 'Multiplier on cell padding. [size] sets it; override for anything between.' },
      { name: '--hk-table-cell-x', default: '0.7rem', description: 'Horizontal cell padding.' },
      { name: '--hk-table-frozen-shadow', default: '8px 0 12px -10px rgb(0 0 0 / 0.85)', description: 'Edge shadow that separates a frozen column from the scrolling body.' },
      { name: '--hk-table-panel-bg', default: '#141416', description: 'Background for the filter and column-toggle panels.' }
    ],
    keyboard: [
      { keys: '← ↑ → ↓', action: 'Move cell focus' },
      { keys: 'Home / End', action: 'First / last column in the row' },
      { keys: 'Space', action: 'Toggle selection of the focused row' },
      { keys: 'Enter', action: 'Start editing the focused cell' },
      { keys: 'Escape', action: 'Abandon the edit and restore the old value' },
      { keys: 'Shift + click header', action: 'Add the column to the sort stack (multiple mode)' }
    ],
    a11y: [
      'Renders role="grid" with aria-rowcount and aria-colcount reflecting the full set, not the page.',
      'Sortable headers expose aria-sort; the sort order badge is readable text, not colour alone.',
      'Grouped headers use scope="colgroup" with derived colspan/rowspan, so the reading order matches the visual one.',
      'One tab stop per grid: the focused cell is the only tabbable one, arrows do the rest.',
      'The loading overlay is role="status" aria-live="polite"; the grid itself sets aria-busy.'
    ]
  },
  {
    slug: 'tree',
    name: 'Tree',
    selector: 'hk-tree',
    category: 'Data',
    status: 'stable',
    size: 4.1,
    tagline: 'Lazy-loading tree with checkbox cascade.',
    description:
      'A tree whose checkbox cascade reports partial state honestly: a parent is checked, unchecked, or indeterminate based on its children, not on its own stale flag.',
    tags: ['hierarchy'],
    usage: `<hk-tree
  [nodes]="regions"
  [(checked)]="selectedRegions"
  [(expanded)]="openNodes"
  [cascade]="true" />`,
    api: [
      { kind: 'input', name: 'nodes', type: 'HkTreeNode[]', default: '[]', description: 'Tree data. Children nest to any depth.' },
      { kind: 'input', name: 'checked', type: 'string[]', default: '[]', description: 'Checked node ids. Two-way bindable.' },
      { kind: 'input', name: 'expanded', type: 'string[]', default: '[]', description: 'Expanded node ids. Two-way bindable.' },
      { kind: 'input', name: 'cascade', type: 'boolean', default: 'true', description: 'Checking a parent checks its whole subtree.' },
      { kind: 'input', name: 'loadChildren', type: '(node) => Promise<HkTreeNode[]>', default: 'null', description: 'Lazy loader, called the first time a node expands.' },
      { kind: 'output', name: 'checkedChange', type: 'EventEmitter<string[]>', default: '—', description: 'Emits on any check change.' },
    ],
    tokens: [
      { name: '--hk-tree-indent', default: '1.25rem', description: 'Indent per level.' },
      { name: '--hk-tree-guide', default: '#e2e8f0', description: 'Vertical guide line.' },
    ],
    keyboard: [
      { keys: '↑ / ↓', action: 'Moves through visible nodes' },
      { keys: '→', action: 'Expands, or moves to the first child' },
      { keys: '←', action: 'Collapses, or moves to the parent' },
      { keys: 'Space', action: 'Toggles the checkbox' },
    ],
    a11y: [
      'Roles are tree, treeitem and group, with aria-expanded and aria-level on every node.',
      'A parent reports aria-checked="mixed" when its children disagree, rather than guessing checked or unchecked.',
      'One tab stop for the whole tree; arrows move within it.',
    ],
  },
  {
    slug: 'tag',
    name: 'Tag',
    selector: 'hk-tag',
    category: 'Data',
    status: 'stable',
    size: 0.7,
    tagline: 'Compact label with tone, icon and remove button.',
    description:
      'A compact label with a tone, an optional icon and a remove button that actually removes. Tones pair an icon with the colour so meaning survives colour blindness.',
    tags: ['chip', 'badge'],
    usage: `<hk-tag tone="success" icon="pi pi-check">healthy</hk-tag>
<hk-tag [removable]="true" (removed)="drop(tag)">canary</hk-tag>`,
    api: [
      { kind: 'input', name: 'tone', type: '\'neutral\' | \'success\' | \'warning\' | \'danger\' | \'info\'', default: '\'neutral\'', description: 'Colour scheme.' },
      { kind: 'input', name: 'icon', type: 'string', default: '\'\'', description: 'Leading icon class.' },
      { kind: 'input', name: 'removable', type: 'boolean', default: 'false', description: 'Shows the remove button.' },
      { kind: 'input', name: 'size', type: '\'sm\' | \'md\'', default: '\'md\'', description: 'Scale.' },
      { kind: 'output', name: 'removed', type: 'EventEmitter<void>', default: '—', description: 'Emits when the remove button is pressed.' },
    ],
    tokens: [
      { name: '--hk-tag-radius', default: '999px', description: 'Corner radius.' },
      { name: '--hk-tag-success-bg', default: '#ecfdf5', description: 'Success fill.' },
      { name: '--hk-tag-danger-bg', default: '#fef2f2', description: 'Danger fill.' },
    ],
    keyboard: [
      { keys: 'Tab', action: 'Reaches the remove button' },
      { keys: 'Enter / Space', action: 'Removes the tag' },
    ],
    a11y: [
      'The remove button has its own accessible name including the tag text, so "remove canary" is announced rather than "button".',
      'Tone is conveyed by icon and text as well as colour.',
    ],
  },
  {
    slug: 'badge',
    name: 'Badge',
    selector: 'hk-badge',
    category: 'Data',
    status: 'stable',
    size: 0.5,
    tagline: 'Count or dot indicator, anchorable to any element.',
    description:
      'A count or a dot, anchorable to any element. Counts past the cap collapse to "99+" so the badge never widens the layout underneath it.',
    tags: ['count', 'dot'],
    usage: `<hk-badge [count]="unread" [max]="99">
  <i class="pi pi-bell"></i>
</hk-badge>

<hk-badge variant="dot" [show]="hasUpdates" />`,
    api: [
      { kind: 'input', name: 'count', type: 'number', default: '0', description: 'Number shown. Zero hides the badge unless showZero.' },
      { kind: 'input', name: 'max', type: 'number', default: '99', description: 'Cap; anything above renders as "max+".' },
      { kind: 'input', name: 'variant', type: '\'count\' | \'dot\'', default: '\'count\'', description: 'Number or a bare dot.' },
      { kind: 'input', name: 'showZero', type: 'boolean', default: 'false', description: 'Keeps the badge visible at zero.' },
      { kind: 'input', name: 'tone', type: '\'danger\' | \'neutral\' | \'success\'', default: '\'danger\'', description: 'Colour.' },
    ],
    tokens: [
      { name: '--hk-badge-bg', default: '#dc2626', description: 'Badge fill.' },
      { name: '--hk-badge-text', default: '#ffffff', description: 'Badge text colour.' },
      { name: '--hk-badge-ring', default: '#ffffff', description: 'Ring separating it from the content beneath.' },
    ],
    a11y: [
      'The count is announced with its meaning through aria-label — "12 unread notifications", not a bare "12".',
      'A dot badge is aria-hidden and relies on its host having a real accessible name.',
      'Capping at max keeps the badge from resizing the control it is anchored to.',
    ],
  },
  {
    slug: 'avatar',
    name: 'Avatar',
    selector: 'hk-avatar',
    category: 'Data',
    status: 'stable',
    size: 1.1,
    tagline: 'Image, initials or icon avatar with stack grouping.',
    description:
      'Image, initials or icon, with a stack mode that collapses the overflow into a +N. Initials are derived from the name, so a missing image is never a broken image.',
    tags: ['user', 'image'],
    usage: `<hk-avatar name="Debashish Roy" src="/avatars/deb.jpg" [online]="true" />

<hk-avatar-stack [max]="3">
  <hk-avatar *ngFor="let p of people" [name]="p.name" />
</hk-avatar-stack>`,
    api: [
      { kind: 'input', name: 'name', type: 'string', default: '\'\'', description: 'Used for initials and for the accessible name.' },
      { kind: 'input', name: 'src', type: 'string', default: '\'\'', description: 'Image URL. Falls back to initials on error.' },
      { kind: 'input', name: 'size', type: '\'sm\' | \'md\' | \'lg\'', default: '\'md\'', description: 'Diameter.' },
      { kind: 'input', name: 'online', type: 'boolean | null', default: 'null', description: 'Shows a presence dot when set.' },
      { kind: 'input', name: 'max', type: 'number', default: '3', description: 'On a stack, how many to show before the +N.' },
    ],
    tokens: [
      { name: '--hk-avatar-size', default: '2.75rem', description: 'Diameter.' },
      { name: '--hk-avatar-ring', default: '#ffffff', description: 'Ring between stacked avatars.' },
      { name: '--hk-avatar-bg', default: 'linear-gradient(135deg, #dc2626, #7f1d1d)', description: 'Initials background.' },
    ],
    keyboard: [
      { keys: 'Enter', action: 'Expands a collapsed stack' },
    ],
    a11y: [
      'A broken image falls back to initials rather than an alt-text box.',
      'Presence is announced as text, not conveyed by the green dot alone.',
      'The +N overflow is a button that expands the stack, not decoration.',
    ],
  },
  {
    slug: 'timeline',
    name: 'Timeline',
    selector: 'hk-timeline',
    category: 'Data',
    status: 'stable',
    size: 2.0,
    tagline: 'Vertical or horizontal event rail with custom markers.',
    description:
      'An event rail, vertical or horizontal, with a marker per tone. Built as an ordered list, because that is what a chronology is.',
    tags: ['events', 'history'],
    usage: `<hk-timeline [events]="deployEvents" orientation="vertical" />`,
    api: [
      { kind: 'input', name: 'events', type: 'HkTimelineEvent[]', default: '[]', description: 'Events in order, each with a time, title and tone.' },
      { kind: 'input', name: 'orientation', type: '\'vertical\' | \'horizontal\'', default: '\'vertical\'', description: 'Rail direction.' },
      { kind: 'input', name: 'markerTemplate', type: 'TemplateRef | null', default: 'null', description: 'Replaces the default dot.' },
    ],
    tokens: [
      { name: '--hk-timeline-rail', default: '#e2e8f0', description: 'Connecting line.' },
      { name: '--hk-timeline-dot', default: '#dc2626', description: 'Default marker colour.' },
    ],
    a11y: [
      'Rendered as an ordered list so sequence is conveyed structurally, not just visually.',
      'Times use a <time datetime> element, making them machine-readable.',
    ],
  },
  {
    slug: 'stat',
    name: 'Stat',
    selector: 'hk-stat',
    category: 'Data',
    status: 'stable',
    size: 1.3,
    tagline: 'Metric tile with delta, sparkline slot and count-up.',
    description:
      'A metric tile with a count-up value, a delta whose tone follows its sign, and a slot for a sparkline.',
    tags: ['kpi', 'metric'],
    usage: `<hk-stat
  label="Deploys / week"
  [value]="128"
  [delta]="12"
  prefix=""
  [countUp]="true">
  <svg hkStatSpark>…</svg>
</hk-stat>`,
    api: [
      { kind: 'input', name: 'label', type: 'string', default: '\'\'', description: 'Metric name.' },
      { kind: 'input', name: 'value', type: 'number', default: '0', description: 'Current figure.' },
      { kind: 'input', name: 'delta', type: 'number | null', default: 'null', description: 'Change versus the previous period; sign picks the tone.' },
      { kind: 'input', name: 'prefix / suffix', type: 'string', default: '\'\'', description: 'Units around the value — a currency symbol, ms, %.' },
      { kind: 'input', name: 'decimals', type: 'number', default: '0', description: 'Fraction digits.' },
      { kind: 'input', name: 'countUp', type: 'boolean', default: 'true', description: 'Animates the value into view.' },
    ],
    tokens: [
      { name: '--hk-stat-up', default: '#059669', description: 'Positive delta colour.' },
      { name: '--hk-stat-down', default: '#dc2626', description: 'Negative delta colour.' },
      { name: '--hk-stat-label', default: '#64748b', description: 'Label colour.' },
    ],
    a11y: [
      'The delta pairs an arrow glyph with its colour, so direction is not colour-only.',
      'The count-up is decorative: the final value is in the DOM from the start, so assistive tech never reads a partial number.',
      'A falling metric is not always bad — tone follows the sign, and can be inverted per stat.',
    ],
  },

  {
    slug: 'button',
    name: 'Button',
    selector: 'hk-button',
    category: 'Forms',
    status: 'stable',
    size: 3.4,
    tagline: 'Six variants, five tones, badges, liquid glass.',
    description:
      'The most-used control in any library, so the surface is deliberately small: every combination of variant, tone, size and shape resolves to token lookups rather than a hand-written skin. Works as a <button> or an <a>, and handles the two states buttons usually get wrong — a loading button that keeps its width, and a disabled anchor that actually stops navigating. It can also carry a badge: inline, where the button grows to fit it, or floating over the corner for an icon button, with the count collapsing past 99 so the button never widens.',
    tags: ['button', 'action', 'cta', 'glass'],
    usage: `<button hkButton variant="solid" tone="brand" (pressed)="save()">
  Save changes
</button>

<!-- Keeps its width while loading, so the row does not reflow -->
<button hkButton [loading]="saving()">Deploy</button>

<!-- Apple-style liquid glass; needs something behind it to refract -->
<button hkButton variant="glass" size="lg" shape="pill">
  Get started
</button>

<!-- A count the button carries itself. Inline grows the button to fit -->
<button hkButton variant="soft" [badge]="unread()">Inbox</button>

<!-- Corner is for icon buttons, where there is no room in the flow -->
<button hkButton [iconOnly]="true" [badge]="3" badgePosition="corner"
        badgeTone="danger" aria-label="Notifications">
  <i class="pi pi-bell"></i>
</button>

<a hkButton variant="link" href="/docs">Read the docs</a>`,
    api: [
      { kind: 'input', name: 'variant', type: '\'solid\' | \'soft\' | \'outline\' | \'ghost\' | \'link\' | \'glass\'', default: '\'solid\'', description: 'Visual treatment. Glass adds a blurred, saturated backdrop.' },
      { kind: 'input', name: 'tone', type: '\'brand\' | \'neutral\' | \'success\' | \'warning\' | \'danger\'', default: '\'brand\'', description: 'Semantic colour. Resolves the accent tokens the variant paints with.' },
      { kind: 'input', name: 'size', type: '\'xs\' | \'sm\' | \'md\' | \'lg\'', default: '\'md\'', description: 'Height, padding and font size.' },
      { kind: 'input', name: 'shape', type: '\'rounded\' | \'pill\' | \'square\'', default: '\'rounded\'', description: 'Corner radius.' },
      { kind: 'input', name: 'type', type: '\'button\' | \'submit\' | \'reset\'', default: '\'button\'', description: 'Native type. Ignored on an anchor.' },
      { kind: 'input', name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks interaction. Uses aria-disabled on an anchor, which cannot be natively disabled.' },
      { kind: 'input', name: 'loading', type: 'boolean', default: 'false', description: 'Shows a spinner, blocks the press, and sets aria-busy. The label stays in place.' },
      { kind: 'input', name: 'block', type: 'boolean', default: 'false', description: 'Stretches to the container width.' },
      { kind: 'input', name: 'iconOnly', type: 'boolean', default: 'false', description: 'Square padding for an icon. Requires an aria-label.' },
      { kind: 'input', name: 'badge', type: 'string | number | null', default: 'null', description: 'Count or short label carried by the button. `null` and a numeric 0 render nothing.' },
      { kind: 'input', name: 'badgePosition', type: "'inline' | 'corner'", default: "'inline'", description: 'Inline sits in the flex flow, so the button grows to fit it. Corner floats over the top-right for icon buttons, and is the one case the button stops clipping.' },
      { kind: 'input', name: 'badgeTone', type: "'auto' | 'contrast' | 'brand' | 'neutral' | 'success' | 'warning' | 'danger'", default: "'auto'", description: 'Auto reads the variant: a filled button gets a contrast chip so the badge does not vanish into the fill.' },
      { kind: 'input', name: 'badgeMax', type: 'number', default: '99', description: 'Counts above this collapse to "99+", so the badge cannot widen the button. The true value is still what gets announced.' },
      { kind: 'input', name: 'shine', type: 'boolean | null', default: 'null', description: 'Pointer-tracking specular highlight. Defaults on for glass, off elsewhere.' },
      { kind: 'output', name: 'pressed', type: 'EventEmitter<MouseEvent>', default: '—', description: 'Emits on click. Never fires while disabled or loading.' },
    ],
    tokens: [
      { name: '--hk-btn-accent', default: '#dc2626', description: 'Fill for solid, text for the quiet variants.' },
      { name: '--hk-btn-accent-strong', default: '#b91c1c', description: 'Hover fill.' },
      { name: '--hk-btn-accent-soft', default: 'rgb(220 38 38 / 0.1)', description: 'Wash behind soft and ghost hover.' },
      { name: '--hk-btn-radius', default: '10px', description: 'Corner radius. Shape overrides it.' },
      { name: '--hk-btn-ring', default: 'var(--hk-btn-accent)', description: 'Focus ring colour.' },
    ],
    keyboard: [
      { keys: 'Space / Enter', action: 'Presses the button' },
      { keys: 'Tab', action: 'Moves focus in and out' },
    ],
    a11y: [
      'A disabled anchor gets aria-disabled and a prevented default — an <a> ignores the disabled attribute and would still navigate.',
      'Loading sets aria-busy and blocks the click, so a double submit cannot slip through between renders.',
      'The label stays in the DOM while loading, so the accessible name never disappears and the button does not change width.',
      'An icon-only button has no text, so it requires an aria-label; the spinner ships a visually hidden "Loading" for the same reason.',
      'Focus ring is a 2px offset outline that survives every variant, including glass.',
    ],
  },
  {
    slug: 'line-chart',
    name: 'Line chart',
    selector: 'hk-line-chart',
    category: 'Data',
    status: 'stable',
    size: 5.2,
    tagline: 'SVG line and area, with a crosshair and a table view.',
    description:
      'Plain SVG built from TypeScript maths — no charting dependency, because a chart core is scales plus path generators and little else. Ships a crosshair and tooltip by default, breaks the line at missing points rather than drawing through them, and carries a table view as the accessible equivalent of the plot.',
    tags: ['chart', 'graph', 'svg', 'line', 'area'],
    usage: `<hk-line-chart
  [series]="series"
  title="Deploys per service"
  curve="smooth"
  [height]="280" />

// Colour follows the entity, never its rank
readonly series: HkSeries[] = [
  { id: 'api',  label: 'billing-api', data: [{ x: 'Jan', y: 120 }, …], area: true },
  { id: 'auth', label: 'auth-gateway', data: [{ x: 'Jan', y: 90 }, …] }
];`,
    api: [
      { kind: 'input', name: 'series', type: 'HkSeries[]', default: '[]', description: 'One entry per line. A null y breaks the line instead of drawing through it.' },
      { kind: 'input', name: 'curve', type: '\'linear\' | \'smooth\'', default: '\'linear\'', description: 'Smooth uses a Catmull-Rom spline that passes through every point.' },
      { kind: 'input', name: 'height', type: 'number', default: '260', description: 'Height in px. Width always fills the container.' },
      { kind: 'input', name: 'markers', type: 'boolean', default: 'false', description: 'Dots on every point. Off by default — dots on a dense line are noise.' },
      { kind: 'input', name: 'endLabels', type: 'boolean', default: 'true', description: 'Labels the last point of each series. Selective by design.' },
      { kind: 'input', name: 'yAxis / xAxis', type: 'HkAxisConfig', default: '{}', description: 'Domain, tick count, label and formatter.' },
      { kind: 'input', name: 'tableView', type: 'boolean', default: 'true', description: 'Shows the Table toggle — required relief for low-contrast hues.' },
      { kind: 'input', name: 'legend', type: 'boolean', default: 'true', description: 'Suppressed automatically for a single series.' },
      { kind: 'output', name: 'pointActivate', type: 'EventEmitter<HkChartPointEvent>', default: '—', description: 'Emits when a marker is clicked.' },
    ],
    tokens: [
      { name: '--hk-chart-grid', default: '#e8ecf1', description: 'Gridline colour. Hairline and solid, never dashed.' },
      { name: '--hk-chart-ink', default: '#0f172a', description: 'Primary text. Labels never wear a series colour.' },
      { name: '--hk-chart-muted', default: '#64748b', description: 'Axis and secondary text.' },
      { name: '--hk-chart-surface', default: '#ffffff', description: 'Chart surface. Also the 2px ring around dots.' },
    ],
    keyboard: [
      { keys: '← / →', action: 'Move the crosshair between points' },
      { keys: 'Home / End', action: 'Jump to the first / last point' },
      { keys: 'Escape', action: 'Dismiss the readout' },
    ],
    a11y: [
      'The plot is focusable and arrow-navigable, so values are reachable without a pointer.',
      'A table view carries the same numbers — the accessible equivalent of the plot, and the required relief for hues below 3:1 contrast.',
      'The palette order is validated for colour-vision deficiency in both light and dark; adjacent series clear ΔE 8 (CVD) and ΔE 15 (normal vision).',
      'A legend is always present for two or more series, so identity is never colour-alone. A single series gets none — the title already names it.',
      'The tooltip is role="status" aria-live="polite", so it announces without stealing focus.',
    ],
  },
  {
    slug: 'bar-chart',
    name: 'Bar chart',
    selector: 'hk-bar-chart',
    category: 'Data',
    status: 'stable',
    size: 4.8,
    tagline: 'Grouped or stacked bars, vertical or horizontal.',
    description:
      'The same SVG core as the line chart. Bars are capped at 24px so the band keeps some air, only the data-end is rounded so the bar stays anchored to its axis, and touching marks are separated by a 2px gap in the surface colour rather than a stroke. The value axis always includes zero — a truncated bar axis is the most common way a bar chart misleads.',
    tags: ['chart', 'graph', 'svg', 'bar', 'column'],
    usage: `<hk-bar-chart
  [series]="series"
  layout="stacked"
  orientation="vertical"
  title="Deploys per service"
  [height]="280" />`,
    api: [
      { kind: 'input', name: 'series', type: 'HkSeries[]', default: '[]', description: 'One entry per series.' },
      { kind: 'input', name: 'layout', type: '\'grouped\' | \'stacked\'', default: '\'grouped\'', description: 'Side by side, or summed per category.' },
      { kind: 'input', name: 'orientation', type: '\'vertical\' | \'horizontal\'', default: '\'vertical\'', description: 'Horizontal suits long category names.' },
      { kind: 'input', name: 'valueLabels', type: 'boolean', default: 'false', description: 'Value at the data-end. Skipped where it will not fit.' },
      { kind: 'input', name: 'height', type: 'number', default: '260', description: 'Height in px. Width fills the container.' },
      { kind: 'input', name: 'tableView', type: 'boolean', default: 'true', description: 'Shows the Table toggle.' },
      { kind: 'output', name: 'barActivate', type: 'EventEmitter<HkChartPointEvent>', default: '—', description: 'Emits when a bar is clicked.' },
    ],
    tokens: [
      { name: '--hk-chart-grid', default: '#e8ecf1', description: 'Gridline colour.' },
      { name: '--hk-chart-surface', default: '#ffffff', description: 'Surface colour — also the 2px gap between touching bars.' },
      { name: '--hk-chart-ink-2', default: '#475569', description: 'Value label colour.' },
    ],
    a11y: [
      'The value axis always includes zero, so bar length stays proportional to value.',
      'Each category is one hit band, which is a far bigger hover target than the bars themselves.',
      'Separation between stacked segments is a gap in the surface colour, not a stroke — a stroke adds ink that is not data.',
      'A table view carries the same numbers for anyone who cannot use the plot.',
    ],
  },

  // ── Backgrounds ─────────────────────────────────────────────
  {
    slug: 'aurora',
    name: 'Aurora',
    selector: 'hk-aurora',
    category: 'Backgrounds',
    status: 'stable',
    size: 1.9,
    tagline: 'A domain-warped flow field, rendered per pixel.',
    description:
      'A flowing field rendered per-pixel by a WebGL2 fragment shader. The look comes from domain warping — the sample position is displaced by noise twice before the final lookup, which is what makes the field fold and flow rather than merely drift. Five octaves of fBm give detail at several scales, hue is mixed from the warp field so colour varies across space, and a per-pixel grain kills the banding smooth gradients always show on dark surfaces. Falls back to a Canvas 2D approximation where WebGL is unavailable.',
    tags: ['background', 'canvas', 'decorative'],
    usage: `<hk-aurora
  class="absolute inset-0"
  [palette]="['#dc2626', '#7c3aed', '#0ea5e9']"
  [blobs]="4"
  [speed]="0.8" />`,
    api: [
      { kind: 'input', name: 'color', type: 'string', default: '\'#dc2626\'', description: 'Base colour. Any hex the background derives its palette from.' },
      { kind: 'input', name: 'speed', type: 'number', default: '1', description: 'Animation multiplier. 0 freezes on the first frame.' },
      { kind: 'input', name: 'opacity', type: 'number', default: '1', description: 'Canvas opacity — these sit behind real content.' },
      { kind: 'input', name: 'paused', type: 'boolean', default: 'false', description: 'Stops the loop without unmounting.' },
      { kind: 'input', name: 'palette', type: 'string[]', default: '[\'#dc2626\', \'#7c3aed\', \'#0ea5e9\']', description: 'Hues mixed across the field. Three reads best.' },
      { kind: 'input', name: 'intensity', type: 'number', default: '0.62', description: 'Overall brightness. Under 1 by default — this sits behind content.' },
      { kind: 'input', name: 'scale', type: 'number', default: '2.4', description: 'Field scale. Higher is busier, lower is broader.' },
      { kind: 'input', name: 'warp', type: 'number', default: '3.2', description: 'How far each noise octave displaces the next. 0 disables the warp.' },
      { kind: 'input', name: 'vignette', type: 'number', default: '0.75', description: 'Edge darkening, 0–1. Higher keeps the corners out of the way.' },
    ],
    tokens: [
      { name: '--hk-bg-color', default: '#dc2626', description: 'Base hue. Every background derives its palette from it.' },
    ],
    a11y: [
      'The canvas is aria-hidden — a decorative layer must never be announced.',
      'Under prefers-reduced-motion it paints one frame and never starts the loop.',
      'The loop stops when the element scrolls out of view and when the tab is hidden, so an offscreen background costs nothing.',
      'Frames run outside the Angular zone, so animating never triggers change detection in the rest of the app.',
    ],
  },
  {
    slug: 'particle-field',
    name: 'Particle field',
    selector: 'hk-particle-field',
    category: 'Backgrounds',
    status: 'stable',
    size: 3.1,
    tagline: 'Linked particles that part around the pointer.',
    description:
      'Drifting points that draw a line when they come close. The link pass is the expensive half — naively O(n squared) per frame, which is why most versions of this crawl past a few hundred particles. This one bins into a spatial grid sized to the link distance, so each particle only tests its nine neighbouring cells.',
    tags: ['background', 'canvas', 'decorative'],
    usage: `<hk-particle-field
  class="absolute inset-0"
  [density]="0.9"
  [linkDistance]="110"
  [repelRadius]="120" />`,
    api: [
      { kind: 'input', name: 'color', type: 'string', default: '\'#dc2626\'', description: 'Base colour. Any hex the background derives its palette from.' },
      { kind: 'input', name: 'speed', type: 'number', default: '1', description: 'Animation multiplier. 0 freezes on the first frame.' },
      { kind: 'input', name: 'opacity', type: 'number', default: '1', description: 'Canvas opacity — these sit behind real content.' },
      { kind: 'input', name: 'paused', type: 'boolean', default: 'false', description: 'Stops the loop without unmounting.' },
      { kind: 'input', name: 'density', type: 'number', default: '0.9', description: 'Particles per 10,000 css px². Scaled by area, so it reads the same at any size.' },
      { kind: 'input', name: 'linkDistance', type: 'number', default: '110', description: 'Max px between two particles for a link. 0 disables linking.' },
      { kind: 'input', name: 'repelRadius', type: 'number', default: '120', description: 'Radius in px within which the pointer pushes particles away.' },
      { kind: 'input', name: 'particleSize', type: 'number', default: '1.8', description: 'Base dot radius in px.' },
    ],
    tokens: [
      { name: '--hk-bg-color', default: '#dc2626', description: 'Base hue. Every background derives its palette from it.' },
    ],
    a11y: [
      'The canvas is aria-hidden — a decorative layer must never be announced.',
      'Under prefers-reduced-motion it paints one frame and never starts the loop.',
      'The loop stops when the element scrolls out of view and when the tab is hidden, so an offscreen background costs nothing.',
      'Frames run outside the Angular zone, so animating never triggers change detection in the rest of the app.',
      'Pointer tracking is bound outside the zone and never allocates, so moving across a dense field stays at frame rate.',
    ],
  },
  {
    slug: 'beams',
    name: 'Beams',
    selector: 'hk-beams',
    category: 'Backgrounds',
    status: 'stable',
    size: 1.6,
    tagline: 'Sweeping light beams that brighten where they cross.',
    description:
      'Rotated linear gradients with a soft falloff, composited additively so overlaps brighten the way real light does rather than stacking as opaque bands. Each beam drifts at its own rate, so the set never lines up into a visible repeat.',
    tags: ['background', 'canvas', 'decorative'],
    usage: `<hk-beams
  class="absolute inset-0"
  [beams]="6"
  [angle]="-22"
  [beamWidth]="0.1" />`,
    api: [
      { kind: 'input', name: 'color', type: 'string', default: '\'#dc2626\'', description: 'Base colour. Any hex the background derives its palette from.' },
      { kind: 'input', name: 'speed', type: 'number', default: '1', description: 'Animation multiplier. 0 freezes on the first frame.' },
      { kind: 'input', name: 'opacity', type: 'number', default: '1', description: 'Canvas opacity — these sit behind real content.' },
      { kind: 'input', name: 'paused', type: 'boolean', default: 'false', description: 'Stops the loop without unmounting.' },
      { kind: 'input', name: 'beams', type: 'number', default: '6', description: 'How many beams.' },
      { kind: 'input', name: 'angle', type: 'number', default: '-22', description: 'Tilt in degrees from vertical.' },
      { kind: 'input', name: 'beamWidth', type: 'number', default: '0.1', description: 'Beam width as a fraction of canvas width.' },
    ],
    tokens: [
      { name: '--hk-bg-color', default: '#dc2626', description: 'Base hue. Every background derives its palette from it.' },
    ],
    a11y: [
      'The canvas is aria-hidden — a decorative layer must never be announced.',
      'Under prefers-reduced-motion it paints one frame and never starts the loop.',
      'The loop stops when the element scrolls out of view and when the tab is hidden, so an offscreen background costs nothing.',
      'Frames run outside the Angular zone, so animating never triggers change detection in the rest of the app.',
    ],
  },
  {
    slug: 'waves',
    name: 'Waves',
    selector: 'hk-waves',
    category: 'Backgrounds',
    status: 'stable',
    size: 1.8,
    tagline: 'Stacked sine bands with a filled falloff.',
    description:
      'Each band sums three sines at unrelated frequencies — one wave alone reads as obviously mechanical, three make the crest wander the way water does. Sampled every six pixels, which is indistinguishable from per-pixel and costs a sixth as much.',
    tags: ['background', 'canvas', 'decorative'],
    usage: `<hk-waves
  class="absolute inset-0"
  [layers]="4"
  [amplitude]="34"
  [wavelength]="280" />`,
    api: [
      { kind: 'input', name: 'color', type: 'string', default: '\'#dc2626\'', description: 'Base colour. Any hex the background derives its palette from.' },
      { kind: 'input', name: 'speed', type: 'number', default: '1', description: 'Animation multiplier. 0 freezes on the first frame.' },
      { kind: 'input', name: 'opacity', type: 'number', default: '1', description: 'Canvas opacity — these sit behind real content.' },
      { kind: 'input', name: 'paused', type: 'boolean', default: 'false', description: 'Stops the loop without unmounting.' },
      { kind: 'input', name: 'layers', type: 'number', default: '4', description: 'How many stacked bands.' },
      { kind: 'input', name: 'amplitude', type: 'number', default: '34', description: 'Crest height in px.' },
      { kind: 'input', name: 'wavelength', type: 'number', default: '280', description: 'Horizontal wavelength in px.' },
      { kind: 'input', name: 'filled', type: 'boolean', default: 'true', description: 'Fills under each crest instead of stroking only.' },
    ],
    tokens: [
      { name: '--hk-bg-color', default: '#dc2626', description: 'Base hue. Every background derives its palette from it.' },
    ],
    a11y: [
      'The canvas is aria-hidden — a decorative layer must never be announced.',
      'Under prefers-reduced-motion it paints one frame and never starts the loop.',
      'The loop stops when the element scrolls out of view and when the tab is hidden, so an offscreen background costs nothing.',
      'Frames run outside the Angular zone, so animating never triggers change detection in the rest of the app.',
    ],
  },
  {
    slug: 'dot-matrix',
    name: 'Dot matrix',
    selector: 'hk-dot-matrix',
    category: 'Backgrounds',
    status: 'stable',
    size: 1.7,
    tagline: 'A dot grid that swells in a wave and bulges toward the pointer.',
    description:
      'A travelling diagonal wave over a dot grid, with a pointer bulge on top. Only dots inside the pointer radius do the distance maths; the rest take a single cheap sine, which keeps a dense grid affordable.',
    tags: ['background', 'canvas', 'decorative'],
    usage: `<hk-dot-matrix
  class="absolute inset-0"
  [gap]="26"
  [dotSize]="1.6"
  [influence]="140" />`,
    api: [
      { kind: 'input', name: 'color', type: 'string', default: '\'#dc2626\'', description: 'Base colour. Any hex the background derives its palette from.' },
      { kind: 'input', name: 'speed', type: 'number', default: '1', description: 'Animation multiplier. 0 freezes on the first frame.' },
      { kind: 'input', name: 'opacity', type: 'number', default: '1', description: 'Canvas opacity — these sit behind real content.' },
      { kind: 'input', name: 'paused', type: 'boolean', default: 'false', description: 'Stops the loop without unmounting.' },
      { kind: 'input', name: 'gap', type: 'number', default: '26', description: 'Distance between dot centres, px.' },
      { kind: 'input', name: 'dotSize', type: 'number', default: '1.6', description: 'Base dot radius, px.' },
      { kind: 'input', name: 'influence', type: 'number', default: '140', description: 'Radius the pointer affects, px. 0 disables the interaction.' },
      { kind: 'input', name: 'wave', type: 'number', default: '0.5', description: 'Amplitude of the idle wave, 0–1.' },
    ],
    tokens: [
      { name: '--hk-bg-color', default: '#dc2626', description: 'Base hue. Every background derives its palette from it.' },
    ],
    a11y: [
      'The canvas is aria-hidden — a decorative layer must never be announced.',
      'Under prefers-reduced-motion it paints one frame and never starts the loop.',
      'The loop stops when the element scrolls out of view and when the tab is hidden, so an offscreen background costs nothing.',
      'Frames run outside the Angular zone, so animating never triggers change detection in the rest of the app.',
    ],
  },
  {
    slug: 'grid-motion',
    name: 'Grid motion',
    selector: 'hk-grid-motion',
    category: 'Backgrounds',
    status: 'stable',
    size: 1.5,
    tagline: 'A perspective grid receding to a horizon.',
    description:
      'Lines converging on a vanishing point, scrolling toward the viewer. Depth spacing is exponential rather than linear, which is what makes it read as perspective instead of a tilted ladder, and the scroll offset wraps so the advance is seamless.',
    tags: ['background', 'canvas', 'decorative'],
    usage: `<hk-grid-motion
  class="absolute inset-0"
  [horizon]="0.42"
  [columns]="16"
  [rows]="14" />`,
    api: [
      { kind: 'input', name: 'color', type: 'string', default: '\'#dc2626\'', description: 'Base colour. Any hex the background derives its palette from.' },
      { kind: 'input', name: 'speed', type: 'number', default: '1', description: 'Animation multiplier. 0 freezes on the first frame.' },
      { kind: 'input', name: 'opacity', type: 'number', default: '1', description: 'Canvas opacity — these sit behind real content.' },
      { kind: 'input', name: 'paused', type: 'boolean', default: 'false', description: 'Stops the loop without unmounting.' },
      { kind: 'input', name: 'horizon', type: 'number', default: '0.42', description: 'Horizon position as a fraction of height.' },
      { kind: 'input', name: 'columns', type: 'number', default: '16', description: 'Vertical lines either side of centre.' },
      { kind: 'input', name: 'rows', type: 'number', default: '14', description: 'Depth bands between horizon and viewer.' },
      { kind: 'input', name: 'lineWidth', type: 'number', default: '1', description: 'Stroke width in px.' },
    ],
    tokens: [
      { name: '--hk-bg-color', default: '#dc2626', description: 'Base hue. Every background derives its palette from it.' },
    ],
    a11y: [
      'The canvas is aria-hidden — a decorative layer must never be announced.',
      'Under prefers-reduced-motion it paints one frame and never starts the loop.',
      'The loop stops when the element scrolls out of view and when the tab is hidden, so an offscreen background costs nothing.',
      'Frames run outside the Angular zone, so animating never triggers change detection in the rest of the app.',
    ],
  },
  {
    slug: 'dither',
    name: 'Dither',
    selector: 'hk-dither',
    category: 'Backgrounds',
    status: 'stable',
    size: 1.4,
    tagline: 'Ordered-dither bands — the chunky retro look.',
    description:
      'A Bayer 4×4 threshold matrix over a drifting gradient. Drawn as cells rather than per-pixel on purpose: a true per-pixel dither means writing millions of bytes into an ImageData every frame, which is exactly what makes a background library unusable. A 4px cell is visually identical here and costs a sixteenth.',
    tags: ['background', 'canvas', 'decorative'],
    usage: `<hk-dither
  class="absolute inset-0"
  [pixelSize]="4"
  [noise]="0.12" />`,
    api: [
      { kind: 'input', name: 'color', type: 'string', default: '\'#dc2626\'', description: 'Base colour. Any hex the background derives its palette from.' },
      { kind: 'input', name: 'speed', type: 'number', default: '1', description: 'Animation multiplier. 0 freezes on the first frame.' },
      { kind: 'input', name: 'opacity', type: 'number', default: '1', description: 'Canvas opacity — these sit behind real content.' },
      { kind: 'input', name: 'paused', type: 'boolean', default: 'false', description: 'Stops the loop without unmounting.' },
      { kind: 'input', name: 'pixelSize', type: 'number', default: '4', description: 'Cell edge in px. Larger is chunkier and cheaper.' },
      { kind: 'input', name: 'noise', type: 'number', default: '0.08', description: 'Extra sparkle, 0–1. Hashed per cell, not random per frame.' },
      { kind: 'input', name: 'intensity', type: 'number', default: '0.34', description: 'Cell opacity. Dithering stays binary per cell, so subtlety comes from alpha.' },
      { kind: 'input', name: 'sparsity', type: 'number', default: '0.34', description: 'Raises the threshold so fewer cells light up. 0–1, higher is sparser.' },
    ],
    tokens: [
      { name: '--hk-bg-color', default: '#dc2626', description: 'Base hue. Every background derives its palette from it.' },
    ],
    a11y: [
      'The canvas is aria-hidden — a decorative layer must never be announced.',
      'Under prefers-reduced-motion it paints one frame and never starts the loop.',
      'The loop stops when the element scrolls out of view and when the tab is hidden, so an offscreen background costs nothing.',
      'Frames run outside the Angular zone, so animating never triggers change detection in the rest of the app.',
    ],
  },
  {
    slug: 'spotlight',
    name: 'Spotlight',
    selector: 'hk-spotlight',
    category: 'Backgrounds',
    status: 'stable',
    size: 1.1,
    tagline: 'A light that follows the pointer, revealing a grid.',
    description:
      'Deliberately not canvas: one radial gradient the GPU can composite, with an optional grid masked to the lit area. The only per-move work is writing two CSS variables, coalesced to one write per animation frame and never entering the Angular zone.',
    tags: ['background', 'canvas', 'decorative'],
    usage: `<hk-spotlight [size]="320" [grid]="true">
  <!-- content sits inside and stays lit -->
</hk-spotlight>`,
    api: [
      { kind: 'input', name: 'color', type: 'string', default: '\'#dc2626\'', description: 'Light colour.' },
      { kind: 'input', name: 'size', type: 'number', default: '320', description: 'Light radius in px.' },
      { kind: 'input', name: 'opacity', type: 'number', default: '1', description: 'Layer opacity.' },
      { kind: 'input', name: 'grid', type: 'boolean', default: 'true', description: 'Draws a grid revealed only inside the light.' },
      { kind: 'input', name: 'gridSize', type: 'number', default: '32', description: 'Grid cell size in px.' },
    ],
    tokens: [
      { name: '--hk-bg-color', default: '#dc2626', description: 'Base hue. Every background derives its palette from it.' },
      { name: '--hk-spot-size', default: '320px', description: 'Light radius.' },
      { name: '--hk-spot-grid', default: '32px', description: 'Grid cell size.' },
    ],
    a11y: [
      'The light and grid layers are aria-hidden; projected content stays in the accessibility tree.',
      'No canvas and no JavaScript animation — the browser composites one gradient, so it is the cheapest background here.',
      'Pointer writes are coalesced to one per frame and run outside the Angular zone.',
      'With no pointer (touch, keyboard) the light rests at centre rather than disappearing.',
    ],
  },

  // ── Utility ─────────────────────────────────────────────────
  {
    slug: 'reveal',
    name: 'Reveal',
    selector: 'hkReveal',
    category: 'Utility',
    status: 'stable',
    size: 0.6,
    tagline: 'Scroll-triggered enter animation with stagger.',
    description:
      'A scroll-triggered entrance with a stagger. Observes once and then unhooks, so a long page does not carry a hundred live observers.',
    tags: ['directive', 'scroll'],
    usage: `<div appReveal [revealDelay]="i * 90" [revealThreshold]="0.2">
  <!-- content -->
</div>`,
    api: [
      { kind: 'input', name: 'revealDelay', type: 'number', default: '0', description: 'Milliseconds before the animation starts. Multiply by index to stagger.' },
      { kind: 'input', name: 'revealThreshold', type: 'number', default: '0.15', description: 'How much must be visible before it fires, 0–1.' },
      { kind: 'input', name: 'revealOnce', type: 'boolean', default: 'true', description: 'Disconnects after the first reveal.' },
    ],
    tokens: [
      { name: '--hk-reveal-distance', default: '28px', description: 'How far it travels.' },
      { name: '--hk-reveal-duration', default: '0.8s', description: 'Animation length.' },
    ],
    a11y: [
      'Under prefers-reduced-motion the element is visible immediately — content is never gated behind an animation.',
      'Only opacity, transform and filter are animated, so nothing reflows during the entrance.',
      'The observer disconnects after firing, which matters on a page with many revealed blocks.',
    ],
  },
  {
    slug: 'count-up',
    name: 'Count up',
    selector: 'hkCountUp',
    category: 'Utility',
    status: 'stable',
    size: 0.5,
    tagline: 'Animates a number into view, reduced-motion aware.',
    description:
      'Animates a number into view and retriggers when the target changes. The final value is in the DOM the whole time, so it is never read as a partial figure.',
    tags: ['directive', 'number'],
    usage: `<span appCountUp [countTo]="8420" countPrefix="$" [countDuration]="1400">0</span>`,
    api: [
      { kind: 'input', name: 'countTo', type: 'number', default: '0', description: 'Target value.' },
      { kind: 'input', name: 'countDuration', type: 'number', default: '1600', description: 'Animation length in milliseconds.' },
      { kind: 'input', name: 'countPrefix / countSuffix', type: 'string', default: '\'\'', description: 'Text either side of the number.' },
      { kind: 'input', name: 'countDecimals', type: 'number', default: '0', description: 'Fraction digits held during the count.' },
    ],
    tokens: [
      { name: '--hk-countup-ease', default: 'cubic-bezier(0.16, 1, 0.3, 1)', description: 'Easing curve.' },
    ],
    a11y: [
      'The element is aria-live="off" and carries the final value, so screen readers announce the figure once, not every frame.',
      'prefers-reduced-motion jumps straight to the target.',
    ],
  },
  {
    slug: 'clipboard',
    name: 'Clipboard',
    selector: 'hkCopy',
    category: 'Utility',
    status: 'stable',
    size: 0.4,
    tagline: 'Copy-to-clipboard directive with a confirmation state.',
    description:
      'Copy with a confirmation state that reverts itself — and reports failure, because the Clipboard API is refused often enough that silence is a bug.',
    tags: ['directive', 'copy'],
    usage: `<button [hkCopy]="installCommand" (copied)="ok()" (copyFailed)="warn()">
  Copy
</button>`,
    api: [
      { kind: 'input', name: 'hkCopy', type: 'string', default: '\'\'', description: 'Text to write to the clipboard.' },
      { kind: 'input', name: 'copyResetDelay', type: 'number', default: '1600', description: 'How long the confirmed state lasts.' },
      { kind: 'output', name: 'copied', type: 'EventEmitter<string>', default: '—', description: 'Emits the copied text on success.' },
      { kind: 'output', name: 'copyFailed', type: 'EventEmitter<Error>', default: '—', description: 'Emits when the browser refuses.' },
    ],
    tokens: [
      { name: '--hk-copy-success', default: '#059669', description: 'Confirmed state colour.' },
    ],
    keyboard: [
      { keys: 'Enter / Space', action: 'Copies from a focused host' },
    ],
    a11y: [
      'Success is announced through an aria-live region, so it is not conveyed by the tick alone.',
      'Failure surfaces as a message — a permission-blocked clipboard must not look like success.',
    ],
  },
  {
    slug: 'hotkey',
    name: 'Hotkey',
    selector: 'HkHotkeyService',
    category: 'Utility',
    status: 'stable',
    size: 0.9,
    tagline: 'Scoped keyboard shortcuts that clean themselves up.',
    description:
      'Scoped keyboard shortcuts that unbind themselves with the component that registered them, and never fire while the user is typing in a field.',
    tags: ['keyboard', 'service'],
    usage: `private readonly hotkeys = inject(HkHotkeyService);

constructor() {
  this.hotkeys.bind('mod+k', () => this.openPalette());
  this.hotkeys.bind('g d', () => this.goToDeploys());
}`,
    api: [
      { kind: 'method', name: 'bind(keys, handler)', type: '(keys: string, handler: () => void) => void', default: '—', description: 'Registers a shortcut, unbound automatically on destroy.' },
      { kind: 'method', name: 'unbind(keys)', type: '(keys: string) => void', default: '—', description: 'Removes one binding early.' },
      { kind: 'method', name: 'scope(name)', type: '(name: string) => HkHotkeyScope', default: '—', description: 'Creates a scope so a dialog can shadow global bindings.' },
      { kind: 'input', name: 'sequences', type: 'boolean', default: 'true', description: 'Supports two-key runs such as "g d".' },
    ],
    a11y: [
      'Never fires while focus is in an input, textarea or select — a shortcut must not eat what someone is typing.',
      '"mod" resolves to Cmd on macOS and Ctrl elsewhere, so bindings read the same in docs on both.',
      'Bindings are torn down with their component, which is what keeps a long session from accumulating handlers.',
    ],
  },
  {
    slug: 'theme',
    name: 'Theme',
    selector: 'HkThemeService',
    category: 'Utility',
    status: 'stable',
    size: 1.2,
    tagline: 'Reads, writes and persists the token layer at runtime.',
    description:
      'Reads, writes and persists the token layer at runtime. One class on the root element retunes every component, with no rebuild and no per-component theme prop.',
    tags: ['theming', 'service'],
    usage: `private readonly theme = inject(HkThemeService);

this.theme.toggle();
this.theme.set('light');
this.theme.setToken('--hk-accent', '#3b82f6');`,
    api: [
      { kind: 'method', name: 'toggle()', type: '() => void', default: '—', description: 'Flips between light and dark.' },
      { kind: 'method', name: 'set(theme)', type: '(theme: \'light\' | \'dark\') => void', default: '—', description: 'Applies a theme and persists the choice.' },
      { kind: 'method', name: 'setToken(name, value)', type: '(name: string, value: string) => void', default: '—', description: 'Overrides one token at runtime.' },
      { kind: 'input', name: 'theme', type: 'Signal<\'light\' | \'dark\'>', default: '\'dark\'', description: 'Current theme, readable as a signal.' },
      { kind: 'input', name: 'storageKey', type: 'string', default: "'hk-theme'", description: 'Where the choice is remembered.' },
      { kind: 'input', name: 'accents', type: 'HkAccent[]', default: '16 named presets', description: 'The built-in palette, from Crimson through Slate. A shortcut, not the API — any CSS colour works.' },
      { kind: 'method', name: 'setAccent(colour)', type: '(colour: string) => void', default: '—', description: 'Writes --hk-accent. Every shade is derived from it with color-mix, so an accent is one value rather than a five-step ramp.' },
    ],
    tokens: [
      { name: '--hk-accent', default: '#dc2626', description: 'Primary accent every component derives from.' },
      { name: '--hk-radius', default: '12px', description: 'Corner radius scale.' },
      { name: '--hk-density', default: '1', description: 'Padding multiplier.' },
    ],
    a11y: [
      'Sets color-scheme alongside the class, so browser-drawn controls — dropdown popups, scrollbars, date pickers — are painted the right way round.',
      'The stored choice wins over the OS preference; the OS only decides for a first-time visitor.',
      'The class is applied before first paint by an inline script, so a dark-mode visitor never sees a white flash.',
    ],
  },
  {
    slug: 'intersect',
    name: 'Intersect',
    selector: 'hkIntersect',
    category: 'Utility',
    status: 'stable',
    size: 0.5,
    tagline: 'Emits when an element enters or leaves the viewport.',
    description:
      'Emits when an element enters or leaves the viewport — the primitive behind lazy loading, infinite scroll and scroll-spy.',
    tags: ['directive', 'observer'],
    usage: `<div hkIntersect [intersectThreshold]="0.5"
  (entered)="load()" (left)="pause()">
</div>`,
    api: [
      { kind: 'input', name: 'intersectThreshold', type: 'number', default: '0', description: 'Visible fraction that counts as intersecting, 0–1.' },
      { kind: 'input', name: 'intersectRoot', type: 'Element | null', default: 'null', description: 'Scroll container. Defaults to the viewport.' },
      { kind: 'input', name: 'intersectOnce', type: 'boolean', default: 'false', description: 'Disconnects after the first entry.' },
      { kind: 'output', name: 'entered', type: 'EventEmitter<IntersectionObserverEntry>', default: '—', description: 'Emits on enter.' },
      { kind: 'output', name: 'left', type: 'EventEmitter<IntersectionObserverEntry>', default: '—', description: 'Emits on exit.' },
    ],
    a11y: [
      'Purely observational — it adds no roles and changes nothing in the accessibility tree.',
      'The observer is disconnected on destroy, so it cannot outlive its element.',
    ],
  }
];

export function findComponent(slug: string): ComponentEntry | undefined {
  return COMPONENTS.find((entry) => entry.slug === slug);
}

export function componentsByCategory(category: Category): ComponentEntry[] {
  return COMPONENTS.filter((entry) => entry.category === category);
}
