import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WidgetsModule } from '@mudlet3/frontend/features/widgets';
import { PrimeModule } from '@mudlet3/frontend/shared';
import { MenuModule } from '../menu/menu.module';
import { MudInputComponent } from './mud-input/mud-input.component';
import { MudOutputComponent } from './mud-output/mud-output.component';
import { MudclientComponent } from './mudclient/mudclient.component';
import { MudspanComponent } from './mudspan/mudspan.component';

@NgModule({
  declarations: [
    MudclientComponent,
    MudspanComponent,
    MudInputComponent,
    MudOutputComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    PrimeModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    WidgetsModule,
    MenuModule,
  ],
  exports: [MudclientComponent],
})
export class MudModule {}
