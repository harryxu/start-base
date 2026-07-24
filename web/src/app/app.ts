import { Component, inject } from '@angular/core';
import { HomeComponent } from './features/home/home.component';
import { ConfigService } from './core/services/config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HomeComponent],
  template: `<app-home />`,
})
export class App {
  configService = inject(ConfigService);
}
