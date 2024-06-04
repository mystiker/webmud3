import { EventEmitter, Injectable, Output } from '@angular/core';
import { MenuItem, MenuItemCommandEvent } from 'primeng/api';
import { BehaviorSubject, Observable } from 'rxjs';

import { MudService } from '../../core/mud/mud.service';
import { MenuState, MenuType } from './types/menu-state';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private menuStateSubject = new BehaviorSubject<MenuState>({
    menuType: MenuType.OTHER,
    items: [],
  });

  get menuState$(): Observable<MenuState> {
    return this.menuStateSubject.asObservable();
  }

  @Output()
  public readonly disconnectClicked = new EventEmitter<MenuItemCommandEvent>();

  @Output()
  public readonly connectClicked = new EventEmitter<MenuItemCommandEvent>();

  constructor(mudService: MudService) {
    // Todo[myst]: Entweder direkt berechnen ohne Subscribe oder Unsubscribe onDestroy
    mudService.connectedToMud$.subscribe((connected) => {
      this.updateMenuItems(connected);
    });
  }

  public updateMenuState(partialState: Partial<MenuState>) {
    const currentState = this.menuStateSubject.value;
    const newState = { ...currentState, ...partialState };
    this.menuStateSubject.next(newState);
  }

  private updateMenuItems(connected: boolean) {
    const connectItem: MenuItem = {
      id: 'MUD:CONNECT',
      label: 'Verbinden',
      icon: 'pi pi-sign-in',
      command: (event: MenuItemCommandEvent) => {
        this.connectClicked.emit(event);
      },
    };

    const disconnectItem: MenuItem = {
      id: 'MUD:DISCONNECT',
      label: 'Trennen',
      icon: 'pi pi-sign-out',
      command: (event: MenuItemCommandEvent) => {
        this.disconnectClicked.emit(event);
      },
    };

    const items: MenuItem[] = [
      // {
      //   id: 'MUD:MENU',
      //   label: 'MUD',
      //   icon: 'pi pi-power-off',
      //   command: (event: MenuItemCommandEvent) =>
      //     this.emitMenuItemClicked(event),
      // },
      connected ? disconnectItem : connectItem,
      // {
      //   id: 'MUD:NUMPAD',
      //   label: 'Numpad',
      //   icon: 'pi pi-key',
      //   command: (event: MenuItemCommandEvent) =>
      //     this.emitMenuItemClicked(event),
      // },
      // {
      //   id: 'MUD:VIEW',
      //   label: 'Farben',
      //   icon: 'pi pi-eye',
      //   command: (event: MenuItemCommandEvent) =>
      //     this.emitMenuItemClicked(event),
      // },
      // {
      //   id: 'MUD:SCROLL',
      //   label: 'Scroll',
      //   icon: connected ? 'pi pi-play' : 'pi pi-pause',
      //   command: (event: MenuItemCommandEvent) =>
      //     this.emitMenuItemClicked(event),
      // },
    ];

    this.updateMenuState({ items });

    console.log('[Menu-Service] Menu items updated', items);
  }
}
