import {
  CharacterData,
  MudSignals,
  WindowConfig,
} from '@mudlet3/frontend/shared';

import { IAnsiData } from '@mudlet3/frontend/features/ansi';
import { IMudMessage } from './mud-message';

// Todo[myst] very bad interface since it is the mudemenu.component. Use composition over inheritance.
export interface MudSignalHandlerData {
  v: { inpType: string };
  titleService: { setTitle: (title: string) => void };
  charData: CharacterData;
  filesrv: {
    startFilesModule: () => void;
    processFileInfo: (fileInfo: any) => any;
  };
  wincfg: {
    SavedAndClose: (windowId: any) => void;
    WinError: (windowId: any, error: any) => void;
    SaveComplete: (windowId: any, closable: boolean) => void;
    newWindow: (config: WindowConfig) => string;
    findFilesWindow: (filesWindow: any, musi: MudSignals) => any;
  };
  invlist: {
    initList: (entries: any) => void;
    addItem: (entry: any) => void;
    removeItem: (entry: any) => void;
  };
  socketsService: {
    sendGMCP: (id: string, module: string, command: string, data: any) => void;
  };
  keySetters: { setLevel: (level: any) => void };
  messages: IMudMessage[];
  ansiCurrent: IAnsiData;
  togglePing: boolean;
  inpmessage: string;
  filesWindow: any;
  doFocus: () => void;
}
