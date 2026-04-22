import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { demoRuntimeMode } from './demo-runtime-mode';
import { resolveDemoBffBaseUrl } from './core/bff-url';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  protected readonly runtimeMode = demoRuntimeMode;
  protected readonly bffBaseUrl = resolveDemoBffBaseUrl();
}
