import { ElementRef } from '@angular/core';

export function doFocus(
  v: any,
  changeFocus: number,
  previousFoxus: number,
  mudInputLine?: ElementRef,
  mudInputArea?: ElementRef,
) {
  let FirstFocus = undefined;
  previousFoxus = changeFocus;
  if (v.inpType != 'text' && typeof mudInputLine !== 'undefined') {
    FirstFocus = mudInputLine.nativeElement;
    changeFocus = 1;
  } else if (v.inpType == 'text' && typeof mudInputArea !== 'undefined') {
    FirstFocus = mudInputArea.nativeElement;
  } else if (v.inpType != 'text') {
    changeFocus = 2;
    return { changeFocus, previousFoxus };
  } else if (v.inpType == 'text') {
    changeFocus = -2;
    return { changeFocus, previousFoxus };
  }
  if (FirstFocus) {
    FirstFocus.focus();
    FirstFocus.select();
  }
  return { changeFocus, previousFoxus };
}
