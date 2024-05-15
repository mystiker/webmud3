import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WidgetsModule } from '@mudlet3/frontend/features/widgets';
import { PrimeModule } from '@mudlet3/frontend/shared';
import { MenuModule } from '../menu/menu.module';
import { MudclientComponent } from './mudclient/mudclient.component';
import { MudspanComponent } from './mudspan/mudspan.component';

@NgModule({
  declarations: [MudclientComponent, MudspanComponent],
  imports: [
    CommonModule,
    BrowserModule,
    PrimeModule,
    BrowserAnimationsModule,
    FormsModule,
    WidgetsModule,
    MenuModule,
  ],
  exports: [MudclientComponent],
})
export class MudModule {}
