import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItemCommandEvent } from 'primeng/api';
import { Observable } from 'rxjs';
import { MenuInputService } from '../menu-input.service';
import { MenuService } from '../menu.service';
import { MenuState } from '../types/menu-state';

@Component({
  selector: 'app-mudmenu',
  templateUrl: './mudmenu.component.html',
  styleUrls: ['./mudmenu.component.scss'],
})
export class MudmenuComponent {
  public readonly menuState$: Observable<MenuState>;

  @Input() set connected(conn: boolean) {
    this.menuInputService.setConnected(conn);
  }

  @Output() menuAction: EventEmitter<MenuItemCommandEvent>;

  constructor(
    private menuSrv: MenuService,
    private menuInputService: MenuInputService,
  ) {
    this.menuState$ = this.menuSrv.menuState$;

    this.menuAction = this.menuSrv.menuItemClicked;
  }
}
