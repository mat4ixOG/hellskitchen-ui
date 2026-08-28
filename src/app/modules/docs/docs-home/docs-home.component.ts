import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VISIBLE_GUIDES } from '../../../shared/data/guides';
import { COMPONENTS, GLOBAL_TOKENS } from '../../../shared/data/component-catalog';
import { CodeBlockComponent } from '../../../shared/components/code-block/code-block.component';
import { hasDemo } from '../../../shared/demos/demo-registry';

@Component({
  selector: 'app-docs-home',
  imports: [RouterLink, CodeBlockComponent],
  templateUrl: './docs-home.component.html',
  styleUrl: './docs-home.component.css'
})
export class DocsHomeComponent {
  readonly guides = VISIBLE_GUIDES;
  readonly tokens = GLOBAL_TOKENS;
  readonly total = COMPONENTS.length;
  readonly demos = COMPONENTS.filter((entry) => hasDemo(entry.slug));

  readonly quickStart = `npm i @hellskitchen/ui`;

  readonly firstComponent = `import { Component, signal } from '@angular/core';
import { HkSwitch } from '@hellskitchen/ui';
import { hasDemo } from '../../../shared/demos/demo-registry';

@Component({
  selector: 'app-settings',
  imports: [HkSwitch],
  template: \`<hk-switch [(checked)]="dark" label="Dark mode" />\`
})
export class SettingsComponent {
  dark = signal(true);
}`;
}
