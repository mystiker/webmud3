import { Injectable } from '@angular/core';
import { AnsiData } from '@mudlet3/frontend/features/ansi';
import { BehaviorSubject, Observable } from 'rxjs';

import { ColorSettings } from './../../shared/color-settings';
import { MudMessage } from './mud-signals';

export interface MudClientState {
  connected: boolean;
  scrollLock: boolean;
  sizeCalculated: boolean;
  inpType: string;
  refWidth: number;
  refHeight: number;
  stdfg: string;
  stdbg: string;
  scrollTop: number;
  cs: ColorSettings;
  mudlines: AnsiData[];
  inpMessage?: string;
  messages: MudMessage[];
  changeFocus: number;
  previousFocus: number;
}

@Injectable({
  providedIn: 'root',
})
export class MudClientStateService {
  private stateSubject = new BehaviorSubject<MudClientState>({
    connected: false,
    scrollLock: true,
    sizeCalculated: false,
    inpType: 'text',
    refWidth: 615,
    refHeight: 320,
    stdfg: 'white',
    stdbg: 'black',
    scrollTop: 0,
    cs: {
      invert: false,
      blackOnWhite: false,
      colorOff: false,
      localEchoColor: '#a8ff00',
      localEchoBackground: '#000000',
      localEchoActive: true,
    },
    mudlines: [],
    messages: [],
    changeFocus: 1,
    previousFocus: 1,
  });

  get state$(): Observable<MudClientState> {
    return this.stateSubject.asObservable();
  }

  updateState(partialState: Partial<MudClientState>) {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...partialState };
    this.stateSubject.next(newState);
  }

  getState(): MudClientState {
    return this.stateSubject.value;
  }
}
