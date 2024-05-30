import { Injectable } from '@angular/core';

import { DefaultWebmudConfig } from './models/default-webmud-config';
import config from './models/mud_config.json';
import { IMudConfig } from './types/mud-config';
import { IWebmudConfig } from './types/webmud-config';

@Injectable({
  providedIn: 'root',
})
export class MudConfigService {
  public readonly webConfig: IWebmudConfig = DefaultWebmudConfig;

  public data: IMudConfig = {};

  constructor() {}

  load(): Promise<IMudConfig> {
    return new Promise<IMudConfig>((resolve) => {
      this.data = config;

      resolve(config);

      // this.http.get(getBaseLocation() + 'config/mud_config.json').subscribe(
      //   (response) => {
      //     // console.log('USING server-side configuration');
      //     this.data = Object.assign({}, defaults || {}, response || {});
      //     console.log('server-side-scope:', this.data);
      //     resolve(this.data);
      //   },
      //   () => {
      //     // console.log('USING default configuration, scope local');
      //     this.data = Object.assign({}, defaults || {});
      //     console.log('default-scope:', this.data);
      //     resolve(this.data);
      //   },
      // );
    });
  }
}
