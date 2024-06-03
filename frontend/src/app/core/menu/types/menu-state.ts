import { MenuItem } from 'primeng/api';

export interface MenuState {
  menuType: MenuType;
  items: MenuItem[];
}

export enum MenuType {
  OTHER = 'OTHER',
  MUD_CLIENT = 'MUD_CLIENT',
  EDITOR = 'EDITOR',
}
