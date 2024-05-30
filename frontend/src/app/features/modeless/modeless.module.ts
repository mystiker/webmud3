import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrimeModule } from '@mudlet3/frontend/shared';

import { CharStatComponent } from './char-stat/char-stat.component';
import { DirlistComponent } from './dirlist/dirlist.component';
import { EditorComponent } from './editor/editor.component';
import { FlexibleAreaComponent } from './flexible-area/flexible-area.component';
import { KeyoneComponent } from './keyone/keyone.component';
import { KeypadComponent } from './keypad/keypad.component';
import { KeypadConfigComponent } from './keypad-config/keypad-config.component';
import { ResizableDraggableComponent } from './resizable-draggable/resizable-draggable.component';
import { WindowComponent } from './window/window.component';

@NgModule({
  declarations: [
    ResizableDraggableComponent,
    FlexibleAreaComponent,
    WindowComponent,
    DirlistComponent,
    EditorComponent,
    KeypadComponent,
    KeypadConfigComponent,
    KeyoneComponent,
    CharStatComponent,
  ],
  imports: [CommonModule, FormsModule, PrimeModule],
  providers: [],
  exports: [
    ResizableDraggableComponent,
    FlexibleAreaComponent,
    WindowComponent,
  ],
})
export class ModelessModule {}
