import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import type { Site } from '../../core/models/types';
import { ConfigService } from '../../core/services/config.service';
import { buildIframeUrl, buildPluginParams } from '../../core/utils/plugin.utils';

@Component({
  selector: 'app-iframe-plugin',
  standalone: true,
  template: `
    <div class="w-full h-full relative rounded-[10px] overflow-hidden bg-base-100">
      <iframe
        [src]="safeUrl()"
        class="w-full h-full border-0 block"
        sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals"
        loading="lazy"
        [title]="site().title || 'Plugin Widget'"
      ></iframe>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class IframePluginComponent {
  private configService = inject(ConfigService);
  private sanitizer = inject(DomSanitizer);

  site = input.required<Site>();
  sizeKey = input.required<string>();

  safeUrl = computed<SafeResourceUrl>(() => {
    const s = this.site();
    const theme = this.configService.theme();
    const themeMode = this.configService.themeMode();
    const params = buildPluginParams(s, this.sizeKey(), theme, themeMode);
    const finalUrl = buildIframeUrl(s.url, params);
    return this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
  });
}
