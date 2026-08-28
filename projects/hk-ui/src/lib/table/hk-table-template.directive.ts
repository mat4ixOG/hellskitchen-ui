import { Directive, TemplateRef, inject, input } from '@angular/core';

/**
 * Names a template so <hk-table> can find it.
 *
 *   <ng-template hkTemplate="cell:status" let-value let-row="row"> … </ng-template>
 *
 * Recognised names:
 *   toolbar | caption | empty | loading | footer | expansion
 *   groupHeader | groupFooter | paginatorLeft | paginatorRight
 *   cell:<key>  header:<key>  footer:<key>  editor:<key>
 *
 * A `cell:` template is picked up automatically by matching column key — no
 * wiring on the column definition needed.
 */
@Directive({
  selector: '[hkTemplate]',
  standalone: true
})
export class HkTemplate {
  readonly hkTemplate = input.required<string>();
  readonly template: TemplateRef<any> = inject(TemplateRef);

  get name(): string {
    return this.hkTemplate();
  }
}
