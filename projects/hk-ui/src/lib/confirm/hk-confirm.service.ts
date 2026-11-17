import { DOCUMENT } from '@angular/common';
import { ApplicationRef, EnvironmentInjector, Injectable, createComponent, inject } from '@angular/core';
import { HkConfirmDialogComponent, HkConfirmOptions } from './hk-confirm-dialog.component';

/**
 * Promise-returning confirmation. `ask()` resolves true on confirm and false on
 * cancel, Escape or a backdrop click — it never leaves the promise pending.
 */
@Injectable({ providedIn: 'root' })
export class HkConfirmService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);

  ask(options: HkConfirmOptions = {}): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const returnFocus = this.document.activeElement as HTMLElement | null;
      const ref = createComponent(HkConfirmDialogComponent, { environmentInjector: this.injector });
      ref.setInput('options', options);

      const subscription = ref.instance.answered.subscribe((ok) => {
        subscription.unsubscribe();
        this.appRef.detachView(ref.hostView);
        ref.destroy();
        returnFocus?.focus?.();
        resolve(ok);
      });

      this.appRef.attachView(ref.hostView);
      this.document.body.appendChild(ref.location.nativeElement);
      ref.changeDetectorRef.detectChanges();
    });
  }
}
