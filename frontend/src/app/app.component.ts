import { Component, HostListener } from '@angular/core';

import { ServerConfigService } from './shared/server-config.service';
import { WindowService } from './shared/window.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    public wincfg: WindowService,
    public srvcfg: ServerConfigService,
  ) {
    this.onResize();
  }

  OnMenuAction(event: string, winid: string, other: any) {
    console.debug('appComponent-OnMenuAction', event, winid);
    this.wincfg.OnMenuAction(event, winid, other);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: undefined) {
    this.wincfg.setWindowsSize(window.innerHeight, window.innerWidth);
  }
}
