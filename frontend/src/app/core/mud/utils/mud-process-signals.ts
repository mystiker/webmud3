import {
  CharacterData,
  MudSignals,
  WindowConfig,
} from '@mudlet3/frontend/shared';

import { MudSignalHandlerData } from '../types/mud-signal-handler-data';
import { mudProcessData } from './mud-process-data';
import { tableOutput } from './table-output';

export function mudProcessSignals(
  id: string,
  data: MudSignalHandlerData,
  musi?: MudSignals,
) {
  console.debug('mudclient-socketService.mudReceiveSignals', id, musi?.signal);

  if (musi === undefined) {
    throw new Error(
      'mudclient-socketService.mudReceiveSignals: musi is undefined and shall not be?!',
    );
  }

  let audio: any, newfile: any, filewincfg: WindowConfig;
  let nooldcfg, newcfg, xsplit;

  switch (musi.signal) {
    case 'NOECHO-START':
      data.v.inpType = 'password';
      data.doFocus();
      break;
    case 'NOECHO-END':
      data.v.inpType = 'text';
      data.doFocus();
      break;
    case 'name@mud':
      data.titleService.setTitle(musi.id);
      data.charData = new CharacterData(musi.id);
      if (typeof musi.wizard !== 'undefined') {
        data.filesrv.startFilesModule();
      }
      return;
    case 'status':
      data.charData.setStatus(musi.id);
      return;
    case 'vitals':
      data.charData.setVitals(musi.id);
      return;
    case 'stats':
      data.charData.setStats(musi.id);
      return;
    case 'Input.CompleteText':
      data.inpmessage = musi.id;
      return;
    case 'Input.CompleteChoice':
      mudProcessData(data, id, [null, tableOutput([musi.id.toString()], 78)]);
      return;
    case 'Input.CompleteNone':
      return;
    case 'Sound.Play.Once':
      audio = new Audio();
      audio.src = musi.playSoundFile;
      audio.load();
      audio.play();
      break;
    case 'Files.URL':
      newfile = data.filesrv.processFileInfo(musi.fileinfo);
      if (newfile.alreadyLoaded) {
        console.log('Files.URL-alreadyLoaded', id, newfile);
      } else {
        newfile.save04_closing = function (windowsid: any) {
          console.debug('Files.URL-save04_closing', id, windowsid);
          data.wincfg.SavedAndClose(windowsid);
        };
        newfile.save05_error = function (windowsid: any, error: any) {
          console.error('Files.URL-save05_error', id, windowsid, error);
          data.wincfg.WinError(windowsid, error);
        };
        newfile.save06_success = function (windowsid: any) {
          console.debug('Files.URL-save06_success', id, windowsid);
          data.wincfg.SaveComplete(windowsid, newfile.closable);
        };
        console.log('Files.URL-firstLoad', id, newfile);
        filewincfg = new WindowConfig();
        filewincfg.component = 'EditorComponent';
        filewincfg.data = newfile;
        filewincfg.dontCancel = true;
        if (typeof newfile.title !== 'undefined' && newfile.title != '') {
          filewincfg.wtitle = newfile.title;
        } else {
          filewincfg.wtitle = newfile.filename;
          filewincfg.tooltip = newfile.file;
        }
        if (!newfile.newfile) {
          newfile.load(function (err: any, data: any) {
            if (typeof err === 'undefined') {
              newfile.content = data;
              newfile.oldContent = data;
              filewincfg.data = newfile;
              filewincfg.save = true;
              const windowsid = data.wincfg.newWindow(filewincfg);
              newfile.relateWindow(windowsid);
            }
          });
        } else {
          newfile.content = '';
          newfile.oldContent = '';
          filewincfg.data = newfile;
          filewincfg.save = true;
          const windowsid = data.wincfg.newWindow(filewincfg);
          newfile.relateWindow(windowsid);
        }
      }
      return;
    case 'Files.Dir':
      nooldcfg = typeof data.filesWindow === 'undefined';
      newcfg = data.wincfg.findFilesWindow(data.filesWindow, musi);
      data.filesWindow = newcfg;
      if (nooldcfg) {
        data.filesWindow.outGoingEvents.subscribe(
          (x: string) => {
            console.debug('Files.Dir-outGoingEvents', id, x);
            xsplit = x.split(':');
            switch (xsplit[0]) {
              case 'FileOpen':
                data.socketsService.sendGMCP(id, 'Files', 'OpenFile', {
                  file: xsplit[1] + xsplit[2],
                });
                break;
              case 'ChangeDir':
                if (xsplit[2] == '../') {
                  data.socketsService.sendGMCP(id, 'Files', 'ChDir', {
                    dir: xsplit[2],
                  });
                } else {
                  data.socketsService.sendGMCP(id, 'Files', 'ChDir', {
                    dir: xsplit[1] + xsplit[2],
                  });
                }
                break;
            }
          },
          (err: any) => {
            console.error('Files.Dir-outGoingEvents-Error', id, err);
          },
          () => {
            console.debug('Files.Dir-outGoingEvents-complete', id);
          },
        );
      }
      return;
    case 'Core.Ping':
      data.togglePing = !data.togglePing;
      return;
    case 'Numpad.SendLevel':
      data.keySetters.setLevel(musi.numpadLevel);
      return;
    case 'Core.GoodBye':
      console.log(
        'mudclient-socketService.mudReceiveSignals: new stuff-',
        musi,
      );
      return;
    case 'Char.Items.List':
      data.invlist.initList(musi.invEntries);
      return;
    case 'Char.Items.Add':
      data.invlist.addItem(musi.invEntry);
      return;
    case 'Char.Items.Remove':
      data.invlist.removeItem(musi.invEntry);
      return;
    default:
      console.info(
        'mudclient-socketService.mudReceiveSignals UNKNOWN',
        id,
        musi.signal,
      );
      return;
  }
}
