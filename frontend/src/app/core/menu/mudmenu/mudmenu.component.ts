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

  @Output() menuAction: EventEmitter<MenuItemCommandEvent>;

  constructor(private menuSrv: MenuService) {
    this.menuState$ = this.menuSrv.menuState$;

    this.menuAction = this.menuSrv.menuItemClicked;
  }
}
