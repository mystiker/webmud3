import { EventEmitter, Injectable, Output } from '@angular/core';
import { MenuItem, MenuItemCommandEvent } from 'primeng/api';
import { BehaviorSubject, Observable } from 'rxjs';
import { MenuInputService } from './menu-input.service';
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
  public readonly menuItemClicked = new EventEmitter<MenuItemCommandEvent>();

  constructor(private menuInputService: MenuInputService) {
    // Subscribe to input service changes and update the menu state
    this.menuInputService.connected$.subscribe((connected) => {
      console.log(`MenuService: Connected state changed to ${connected}`);
      this.updateMenuItems(connected);
    });
  }

  public updateMenuState(partialState: Partial<MenuState>) {
    const currentState = this.menuStateSubject.value;
    const newState = { ...currentState, ...partialState };
    this.menuStateSubject.next(newState);
    console.log('MenuService: Updated menu state', newState);
  }

  private updateMenuItems(connected: boolean) {
    const items: MenuItem[] = [
      {
        id: 'MUD:MENU',
        label: 'MUD',
        icon: 'pi pi-power-off',
        command: (event: MenuItemCommandEvent) =>
          this.emitMenuItemClicked(event),
      },
      {
        id: 'MUD:CONNECT',
        label: 'Verbinden',
        icon: 'pi pi-sign-in',
        disabled: connected,
        command: (event: MenuItemCommandEvent) =>
          this.emitMenuItemClicked(event),
      },
      {
        id: 'MUD:DISCONNECT',
        label: 'Trennen',
        icon: 'pi pi-sign-out',
        disabled: !connected,
        command: (event: MenuItemCommandEvent) =>
          this.emitMenuItemClicked(event),
      },
      {
        id: 'MUD:NUMPAD',
        label: 'Numpad',
        icon: 'pi pi-key',
        command: (event: MenuItemCommandEvent) =>
          this.emitMenuItemClicked(event),
      },
      {
        id: 'MUD:VIEW',
        label: 'Farben',
        icon: 'pi pi-eye',
        command: (event: MenuItemCommandEvent) =>
          this.emitMenuItemClicked(event),
      },
      {
        id: 'MUD:SCROLL',
        label: 'Scroll',
        icon: connected ? 'pi pi-play' : 'pi pi-pause',
        command: (event: MenuItemCommandEvent) =>
          this.emitMenuItemClicked(event),
      },
    ];

    this.updateMenuState({ items });
    console.log('MenuService: Menu items updated', items);
  }

  private emitMenuItemClicked(event: MenuItemCommandEvent) {
    console.log('MenuService: Menu item event triggered', event);
    this.menuItemClicked.emit(event);
  }
}
