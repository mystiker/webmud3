import { ElementRef } from '@angular/core';

export function scroll(mudBlock?: ElementRef, scroller?: ElementRef) {
  mudBlock?.nativeElement.scrollTo(scroller?.nativeElement.scrollLeft, 0);
}
