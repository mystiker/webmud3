import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WidgetsModule } from '@mudlet3/frontend/features/widgets';
import { PrimeModule } from '@mudlet3/frontend/shared';
import { MudInputComponent } from 'src/app/core/mud/mud-input/mud-input.component';
import { MudspanComponent } from 'src/app/core/mud/mudspan/mudspan.component';
import { MenuModule } from '../menu/menu.module';
import { MudclientComponent } from './mudclient/mudclient.component';

@NgModule({
  declarations: [MudclientComponent, MudspanComponent, MudInputComponent],
  imports: [
    CommonModule,
    BrowserModule,
    PrimeModule,
    BrowserAnimationsModule,
    FormsModule,
    WidgetsModule,
    MenuModule,
  ],
  exports: [MudclientComponent, MudspanComponent],
})
export class MudModule {}
