import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  ViewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { KeypadConfigComponent } from '@mudlet3/frontend/features/modeless';
import { MudConfig } from '@mudlet3/frontend/features/mudconfig';
import { ColorSettingsComponent } from '@mudlet3/frontend/features/settings';
import { IoMud, SocketsService } from '@mudlet3/frontend/features/sockets';
import {
  CharacterData,
  KeypadData,
  ServerConfigService,
  WINDOW,
  WindowConfig,
  WindowService,
} from '@mudlet3/frontend/shared';
import { CookieService } from 'ngx-cookie-service';
import { DialogService } from 'primeng/dynamicdialog';
import { ColorSettings } from '../../../shared/color-settings';
import { InventoryList } from '../../../shared/inventory-list';
import { FilesService } from '../files.service';
import { MudMessage, MudSignalHelpers } from '../mud-signals';
import { WebmudConfig } from '../webmud-config';

import { AnsiData, AnsiService } from '@mudlet3/frontend/features/ansi';
import { doFocus } from '../utils/do-focus';
import { onKeyDown, onKeyUp } from '../utils/keyboard-handler';
import { scroll } from '../utils/scroll';
import { sendMessage } from '../utils/send-message';
import { tableOutput } from '../utils/table-output';

@Component({
  selector: 'app-mudclient',
  templateUrl: './mudclient.component.html',
  styleUrls: ['./mudclient.component.scss'],
})
export class MudclientComponent implements AfterViewChecked {
  @Input({ required: true }) cfg!: WebmudConfig;

  @ViewChild('mudBlock', { static: false })
  public mudBlock?: ElementRef;

  @ViewChild('mudInputLine', { static: false })
  public mudInputLine?: ElementRef;

  @ViewChild('mudInputArea', { static: false })
  public mudInputArea?: ElementRef;

  @ViewChild('mudTest', { static: false })
  public mudTest?: ElementRef;

  @ViewChild('mudMenu', { static: false })
  public mudMenu?: ElementRef;

  @ViewChild('scroller', { static: false })
  public scroller?: ElementRef;

  public v = {
    // visualize-parameters
    connected: false,
    scrollLock: true,
    sizeCalculated: false,
    sizeCalculated2: false,
    inpType: 'text',
    ref_width: 615,
    ref_height: 320,
    stdfg: 'white',
    stdbg: 'black',
    scrolltop: 0,
  };
  public cs: ColorSettings = {
    invert: false,
    blackOnWhite: false,
    colorOff: false,
    localEchoColor: '#a8ff00',
    localEchoBackground: '#000000',
    localEchoActive: true,
  };
  public keySetters: KeypadData = new KeypadData();
  private d = {
    ref_height_ratio: 1,
    mudc_height: 90,
    mudc_width: 80,
    startCnt: 0,
  };
  private mudName = 'disconnect';
  public mudc_id: string | undefined;
  private ioMud?: IoMud;
  public mudlines: AnsiData[] = [];
  private ansiCurrent: AnsiData;
  public inpmessage?: string;
  private inpHistory: string[] = [];
  public togglePing = false;
  private inpPointer = -1;
  public messages: MudMessage[] = [];
  public filesWindow?: WindowConfig;
  public charStatsWindow?: WindowConfig;
  public charData?: CharacterData;
  public invlist: InventoryList;
  public changeFocus = 1;
  public previousFoxus = 1;

  private obs_connect: any;
  private obs_data: any;
  private obs_debug: any;
  private obs_signals: any;

  scroll() {
    scroll(this.mudBlock, this.scroller);
  }

  doFocus() {
    const result = doFocus(
      this.v,
      this.changeFocus,
      this.previousFoxus,
      this.mudInputLine,
      this.mudInputArea,
    );
    this.changeFocus = result.changeFocus;
    this.previousFoxus = result.previousFoxus;
  }

  menuAction(act: any) {
    console.log('menuAction', act);
    let numpadOther, other;
    let numpadSplit: string[] = [];
    switch (act.item.id) {
      case 'MUD:MENU':
        return; // no action/with submenu!
      default:
        if (act.item.id.startsWith('MUD:CONNECT:')) {
          const mudkey = act.item.id.split(':')[2];
          console.log(act.item.id);
          this.mudName = mudkey;
          this.connect();
          this.changeFocus = -3;
        }
        return;
      case 'MUD:CONNECT':
        if (
          typeof this.cfg !== 'undefined' &&
          typeof this.cfg.mudname !== 'undefined' &&
          this.cfg.mudname !== ''
        ) {
          this.mudName = this.cfg.mudname;
          this.connect();
          this.changeFocus = -4;
        }
        return;
      case 'MUD:DISCONNECT':
        this.mudName = 'disconnect';
        this.connect();
        return;
      case 'MUD:SCROLL':
        this.v.scrollLock = !this.v.scrollLock;
        return;
      case 'MUD:NUMPAD':
        this.dialogService.open(KeypadConfigComponent, {
          data: {
            keypad: this.keySetters,
            cb: this.menuAction,
            cbThis: this,
          },
          header: 'NumPad-Belegung',
          width: '90%',
        });
        return;
      case 'MUD:NUMPAD:RETURN':
        numpadOther = act.item.cbThis;
        numpadOther.keySetters = act.item.keypad;
        console.log('MUD:NUMPAD:RETURN', act.item.event);
        numpadSplit = act.item.event.split(':');
        if (numpadSplit[2] == 'undefined') {
          numpadSplit[2] = '';
        }
        numpadOther.keySetters.addKey(
          numpadSplit[0],
          numpadSplit[1],
          numpadSplit.slice(2).join(':'),
        );
        numpadOther.socketsService.sendGMCP(
          numpadOther.mudc_id,
          'Numpad',
          'Update',
          {
            prefix: numpadSplit[0],
            key: numpadSplit[1],
            value: numpadSplit.slice(2).join(':'),
          },
        );
        return;
      case 'MUD:VIEW':
        this.dialogService.open(ColorSettingsComponent, {
          data: {
            cs: this.cs,
            cb: this.menuAction,
            v: this.v,
            cbThis: this,
          },
          header: 'Change Colors',
          width: '40%',
        });
        return;
      case 'MUD_VIEW:COLOR:RETURN':
        this.cs = act.item.cs;
        other = act.item.cbThis;
        if (this.cs.blackOnWhite) {
          this.v.stdfg = 'black';
          this.v.stdbg = 'white';
        } else {
          this.v.stdfg = 'white';
          this.v.stdbg = 'black';
        }
        other.cookieService.set(
          'mudcolors',
          other.ansiService.toBinaryBase64(JSON.stringify(this.cs)),
        );
        return;
    }
  }

  public tableOutput(words: string[], screen: number): string {
    return tableOutput(words, screen);
  }

  sendMessage() {
    sendMessage(
      this.inpmessage,
      this.mudc_id,
      this.v,
      this.inpHistory,
      this,
      this.socketsService,
    );
  }

  onKeyDown(event: KeyboardEvent) {
    onKeyDown(
      event,
      this.v,
      this.keySetters,
      this.mudc_id,
      this.inpmessage,
      this,
      this.socketsService,
      this.sendMessage.bind(this),
    );
  }

  onKeyUp(event: KeyboardEvent) {
    onKeyUp(
      event,
      this.v,
      this.inpHistory,
      this.inpPointer,
      this.inpmessage,
      this.mudlines,
      this.ioMud,
      this.socketsService,
    );
  }

  private connect() {
    console.log('S95-mudclient-connecting-1', this.mudName);
    if (this.mudName.toLowerCase() == 'disconnect') {
      if (this.mudc_id) {
        if (this.ioMud !== undefined) {
          this.ioMud.disconnectFromMudClient(this.mudc_id);
          this.ioMud = undefined;
        }
        console.info('S95-mudclient-disconnect', this.mudc_id);
        if (this.obs_debug) this.obs_debug.unsubscribe();
        if (this.obs_data) this.obs_data.unsubscribe();
        if (this.obs_signals) this.obs_signals.unsubscribe();
        if (this.obs_connect) this.obs_connect.unsubscribe(); // including disconnect
        this.v.connected = false;
        this.mudc_id = undefined;
        return;
      }
    }
    const other = this;
    const mudOb: MudConfig = {
      mudname: this.mudName,
      height: this.d.mudc_height,
      width: this.d.mudc_width,
    }; // TODO options???
    this.titleService.setTitle(
      this.srvcfgService.getWebmudName() + ' ' + this.mudName,
    ); // TODO portal!!!
    if (this.cfg.autoUser != '') {
      mudOb['user'] = this.cfg.autoUser;
      mudOb['token'] = this.cfg.autoToken;
      mudOb['password'] = this.cfg.autoPw || '';
    }
    console.log('S95-mudclient-connecting-2', mudOb);
    this.obs_connect = this.socketsService.mudConnect(mudOb).subscribe(
      (ioResult) => {
        switch (ioResult.IdType) {
          case 'IoMud:SendToAllMuds':
            if (other.ioMud !== undefined) {
              MudSignalHelpers.mudProcessData(other, other.ioMud.MudId, [
                ioResult.MsgType,
                undefined,
              ]);
            }

            return;
          case 'IoMud':
            other.ioMud = ioResult.Data as IoMud;

            if (this.ioMud === undefined) {
              return;
            }

            other.v.connected = this.ioMud.connected;

            switch (ioResult.MsgType) {
              case 'mud-connect':
                other.mudc_id = other.ioMud.MudId;
                other.v.connected = true;
                return;
              case 'mud-signal':
                MudSignalHelpers.mudProecessSignals(
                  other,
                  ioResult.musi,
                  other.ioMud.MudId,
                );
                return;
              case 'mud-output':
                MudSignalHelpers.mudProcessData(other, other.ioMud.MudId, [
                  ioResult.ErrorType,
                  undefined,
                ]);
                return;
              case 'mud-disconnect':
                other.v.connected = false;
                MudSignalHelpers.mudProcessData(other, other.ioMud.MudId, [
                  ioResult.ErrorType,
                  undefined,
                ]);
                return;
              default:
                console.warn('S96-unknown MsgType with IoMud', ioResult);
            }
            break;
          default:
            console.warn('S96-unknown idType', ioResult);
        }
      },
      (error) => {
        console.error(error);
      },
    );
    return;
  }

  getViewPortHeight(): number {
    return this.window.innerHeight;
  }

  getViewPortWidth(): number {
    return this.window.innerWidth;
  }

  calculateSizing() {
    if (
      this.mudBlock === undefined ||
      this.mudMenu === undefined ||
      this.mudInputArea === undefined
    ) {
      throw new Error('mudBlock, mudMenu or mudInputArea is undefined');
    }

    const ow = this.mudBlock.nativeElement.offsetWidth;
    let tmpheight = this.getViewPortHeight();
    tmpheight -= this.mudMenu.nativeElement.offsetHeight;
    tmpheight -= 2 * this.mudInputArea.nativeElement.offsetHeight;
    tmpheight = Math.floor(
      Math.floor(tmpheight / this.d.ref_height_ratio) *
        this.d.ref_height_ratio +
        0.5,
    );
    const other = this;
    setTimeout(function () {
      other.v.ref_height = tmpheight;
      other.cdRef.detectChanges();
    });
    if (this.d.mudc_height != Math.floor(tmpheight / this.d.ref_height_ratio)) {
      this.d.mudc_height = Math.floor(
        tmpheight / (this.d.ref_height_ratio + 1),
      );
      console.debug(
        'MudSize ',
        String(this.d.mudc_width) +
          'x' +
          this.d.mudc_height +
          ' <= ' +
          ow +
          'x' +
          tmpheight,
      );
      this.d.startCnt++;
      if (
        this.d.startCnt == 1 &&
        typeof this.mudc_id === 'undefined' &&
        this.cfg.autoConnect
      ) {
        this.connect();
      }
      if (typeof this.mudc_id !== undefined) {
      }
    }
  }

  focusFunction(what: string) {
    console.log('get focus', what);
  }

  focusOutFunction(what: string) {
    console.log('out focus', what);
  }

  ngAfterViewChecked(): void {
    const other = this;

    if (
      this.v.scrollLock &&
      this.mudBlock &&
      this.mudBlock.nativeElement.scrollTop !=
        this.mudBlock.nativeElement.scrollHeight
    ) {
      setTimeout(() => {
        if (this.mudBlock !== undefined) {
          this.mudBlock.nativeElement.scrollTop =
            this.mudBlock.nativeElement.scrollHeight;
        }
      });
    }

    let tmpwidth = this.getViewPortWidth() / 1.0125;
    if (!this.v.sizeCalculated) {
      this.doFocus();
      tmpwidth = this.mudTest?.nativeElement.offsetWidth * 1.0125;
      this.d.ref_height_ratio = this.mudTest?.nativeElement.offsetHeight / 25.0;
      setTimeout(function () {
        other.v.ref_width = tmpwidth;
        other.v.sizeCalculated = true;
        other.cdRef.detectChanges();
      });
    } else if (this.d.startCnt <= 0) {
      this.calculateSizing();
    }
    if (this.changeFocus != this.previousFoxus) {
      this.doFocus();
    }
  }

  constructor(
    @Inject(WINDOW) private window: Window,
    private cdRef: ChangeDetectorRef,
    private ansiService: AnsiService,
    private dialogService: DialogService,
    private socketsService: SocketsService,
    public filesrv: FilesService,
    public wincfg: WindowService,
    private srvcfgService: ServerConfigService,
    private titleService: Title,
    private cookieService: CookieService,
  ) {
    this.invlist = new InventoryList();
    this.ansiCurrent = new AnsiData();
    this.mudc_id = 'one';

    const ncs = this.cookieService.get('mudcolors');
    if (ncs != '') {
      this.cs = JSON.parse(ansiService.fromBinaryBase64(ncs));
    }
    if (this.cs.blackOnWhite) {
      this.v.stdfg = 'black';
      this.v.stdbg = 'white';
    } else {
      this.v.stdfg = 'white';
      this.v.stdbg = 'black';
    }
  }
}
