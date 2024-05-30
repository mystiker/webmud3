import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PrimeModule } from '@mudlet3/frontend/shared';

import { MudmenuComponent } from './mud-menu/mud-menu.component';

@NgModule({
  declarations: [MudmenuComponent],
  imports: [CommonModule, PrimeModule],
  exports: [MudmenuComponent],
})
export class MenuModule {}
