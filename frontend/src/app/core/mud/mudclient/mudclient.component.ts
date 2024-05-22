import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  CharacterData,
  KeypadData,
  WindowConfig,
  WindowService,
} from '@mudlet3/frontend/shared';
import { CookieService } from 'ngx-cookie-service';
import { ColorSettings } from '../../../shared/color-settings';
import { InventoryList } from '../../../shared/inventory-list';
import { FilesService } from '../files.service';

import {
  DefaultFormattingData,
  IAnsiData,
  decodeBinaryBase64,
} from '@mudlet3/frontend/features/ansi';

import { MudConfig } from '@mudlet3/frontend/features/mudconfig';
import { Observable } from 'rxjs';
import { MudService } from '../mud.service';
import { IMudMessage } from '../types/mud-message';
import { doFocus } from '../utils/do-focus';
import { onKeyDown, onKeyUp } from '../utils/keyboard-handler';
import { sendMessage } from '../utils/send-message';
import { tableOutput } from '../utils/table-output';

@Component({
  selector: 'app-mudclient',
  templateUrl: './mudclient.component.html',
  styleUrls: ['./mudclient.component.scss'],
})
export class MudclientComponent implements AfterViewChecked {
  @Input({ required: true })
  public cfg!: MudConfig;

  @ViewChild('mudBlock', { static: false })
  public mudBlock?: ElementRef;

  @ViewChild('mudInputLine', { static: false })
  public mudInputLine?: ElementRef;

  @ViewChild('mudInputArea', { static: false })
  public mudInputArea?: ElementRef;

  @ViewChild('mudMenu', { static: false })
  public mudMenu?: ElementRef;

  @ViewChild('scroller', { static: false })
  public scroller?: ElementRef;

  private mudName = 'disconnect';
  public mudc_id: string | undefined;
  public ansiCurrent: IAnsiData;
  public inpmessage: string = ''; // Todo[myst]: nonsense
  private inpHistory: string[] = [];
  public messages: IMudMessage[] = [];

  public readonly mudLines$: Observable<IAnsiData[]>;

  public v = {
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

  public keySetters: KeypadData = new KeypadData(); // Todo[myst]: nonsense;

  private d = {
    ref_height_ratio: 1,
    mudc_height: 90,
    mudc_width: 80,
    startCnt: 0,
  };

  public togglePing = false;
  private inpPointer = -1;
  public filesWindow: WindowConfig = new WindowConfig(); // Todo[myst]: nonsense;
  public charStatsWindow: WindowConfig = new WindowConfig(); // Todo[myst]: nonsense;
  public charData: CharacterData = new CharacterData(''); // Todo[myst]: nonsense
  public invlist: InventoryList;
  public changeFocus = 1;
  public previousFoxus = 1;

  constructor(
    private cdRef: ChangeDetectorRef,
    public filesrv: FilesService,
    public wincfg: WindowService,
    public titleService: Title,
    private cookieService: CookieService,
    // Todo: Make this private
    public readonly mudService: MudService,
  ) {
    this.mudLines$ = this.mudService.outputLines$;

    this.mudService.connectedStatus$.subscribe((connected) => {
      this.v.connected = connected;
    });

    this.invlist = new InventoryList();
    this.ansiCurrent = {
      text: '',
      ...DefaultFormattingData,
    };
    this.mudc_id = 'one';

    const ncs = this.cookieService.get('mudcolors');
    if (ncs != '') {
      this.cs = JSON.parse(decodeBinaryBase64(ncs));
    }
    if (this.cs.blackOnWhite) {
      this.v.stdfg = 'black';
      this.v.stdbg = 'white';
    } else {
      this.v.stdfg = 'white';
      this.v.stdbg = 'black';
    }
  }

  onMessageSent(message: string) {
    this.mudService.sendMessage(message);
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
    let numpadOther, other;
    let numpadSplit: string[] = [];
    switch (act.item.id) {
      case 'MUD:CONNECT':
        this.changeFocus = -4;
        this.mudService.connect(this.mudName, this.cfg);
        return;
      case 'MUD:DISCONNECT':
        this.mudService.disconnect();
        return;
      default:
        console.info('No registered menu entry for ', act.item.id);
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
      this.mudService.socketsService,
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
      this.mudService.socketsService,
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
      this.mudService.getCurrentOutputLines(),
      this.mudService.ioMud,
      this.mudService.socketsService,
    );
  }

  // calculateSizing() {
  //   if (
  //     this.mudBlock === undefined ||
  //     this.mudMenu === undefined ||
  //     this.mudInputArea === undefined
  //   ) {
  //     throw new Error('mudBlock, mudMenu or mudInputArea is undefined');
  //   }

  //   const ow = this.mudBlock.nativeElement.offsetWidth;
  //   let tmpheight = this.wincfg.getViewPortHeight();
  //   tmpheight -= this.mudMenu.nativeElement.offsetHeight;
  //   tmpheight -= 2 * this.mudInputArea.nativeElement.offsetHeight;
  //   tmpheight = Math.floor(
  //     Math.floor(tmpheight / this.d.ref_height_ratio) *
  //       this.d.ref_height_ratio +
  //       0.5,
  //   );
  //   const other = this;
  //   setTimeout(function () {
  //     other.v.ref_height = tmpheight;
  //     other.cdRef.detectChanges();
  //   });
  //   if (this.d.mudc_height != Math.floor(tmpheight / this.d.ref_height_ratio)) {
  //     this.d.mudc_height = Math.floor(
  //       tmpheight / (this.d.ref_height_ratio + 1),
  //     );
  //     this.d.startCnt++;
  //     if (
  //       this.d.startCnt == 1 &&
  //       typeof this.mudc_id === 'undefined'
  //       //  && this.cfg.autoConnect
  //     ) {
  //       this.mudService.connect(this.mudName, this.cfg);
  //     }
  //   }
  // }

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

    let tmpwidth = this.wincfg.getViewPortWidth() / 1.0125;
    if (!this.v.sizeCalculated) {
      this.doFocus();
      // tmpwidth = this.mudTest?.nativeElement.offsetWidth * 1.0125;
      // this.d.ref_height_ratio = this.mudTest?.nativeElement.offsetHeight / 25.0;
      setTimeout(function () {
        other.v.ref_width = tmpwidth;
        other.v.sizeCalculated = true;
        other.cdRef.detectChanges();
      });
    } else if (this.d.startCnt <= 0) {
      // this.calculateSizing();
    }
    if (this.changeFocus != this.previousFoxus) {
      this.doFocus();
    }
  }
}
