import { Component, EventEmitter, Output } from '@angular/core';
import { MenuItemCommandEvent } from 'primeng/api';
import { Observable } from 'rxjs';
import { MenuService } from '../menu.service';
import { MenuState } from '../types/menu-state';

@Component({
  selector: 'app-mudmenu',
  templateUrl: './mudmenu.component.html',
  styleUrls: ['./mudmenu.component.scss'],
})
export class MudmenuComponent {
  public readonly menuState$: Observable<MenuState>;

  @Output()
  public disconnectClicked: EventEmitter<MenuItemCommandEvent>;

  @Output()
  public connectClicked: EventEmitter<MenuItemCommandEvent>;

  constructor(private menuService: MenuService) {
    this.menuState$ = this.menuService.menuState$;

    this.disconnectClicked = this.menuService.disconnectClicked;
    this.connectClicked = this.menuService.connectClicked;
  }
}
