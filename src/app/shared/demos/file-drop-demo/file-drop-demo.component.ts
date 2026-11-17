import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HkFileDropComponent } from 'hellskitchen-ui';

/** Drop zone with per-file progress, driven by a fake upload tick. */
@Component({
  selector: 'app-file-drop-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkFileDropComponent],
  template: `<hk-file-drop [multiple]="true" />`
})
export class FileDropDemoComponent {}
