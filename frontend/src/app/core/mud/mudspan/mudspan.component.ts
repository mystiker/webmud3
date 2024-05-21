import { Component, Input } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { IAnsiData } from 'src/app/features/ansi/types/ansi-data';

@Component({
  selector: 'app-mudspan',
  templateUrl: './mudspan.component.html',
  styleUrls: ['./mudspan.component.scss'],
})
export class MudspanComponent {
  // private a2h?: IAnsiData;

  // public myclasses: string = '';
  // public fg: string = '';
  // public bg: string = '';
  // public txt: string = '';
  // public bow = false;
  // public invert = false;
  // public _colorOff = false;
  // public echoFlag = true;
  // public echoCol = '#a8ff00';
  // public echoBak = '#000000';
  // public tt = '';

  private lineSubject = new BehaviorSubject<IAnsiData | null>(null);

  public readonly line$ = this.lineSubject.asObservable();

  public readonly classes$: Observable<string | null>;

  constructor() {
    this.classes$ = this.line$.pipe(
      map((line) => {
        if (!line) return null;
        let classes = '';
        if (line.bold) classes += ' bold';
        if (line.italic) classes += ' italic';
        if (line.underline) classes += ' underline';
        if (line.blink) classes += ' blink';
        if (line.crossedout) classes += ' crossedout';
        if (line.faint) classes += ' faint';
        if (classes) classes = classes.trim();
        return classes === '' ? null : classes;
      }),
    );

    this.line$.subscribe((line) => {
      console.log('line', line);
    });
  }

  public get line(): IAnsiData | null {
    return this.lineSubject.value;
  }

  @Input()
  public set line(value: IAnsiData | null) {
    this.lineSubject.next(value);
  }

  // private calcFgBg() {
  //   let lfg, lbg;
  //   if (typeof this.a2h === 'undefined' || this._colorOff) {
  //     if (this.bow || this.invert) {
  //       this.fg = '#000000';
  //       this.bg = '#ffffff';
  //     } else {
  //       this.fg = '#ffffff';
  //       this.bg = '#000000';
  //     }
  //     return;
  //   }
  //   if (this.a2h.reverse) {
  //     lfg = this.a2h.bgcolor;
  //     lbg = this.a2h.fgcolor;
  //   } else {
  //     lfg = this.a2h.fgcolor;
  //     lbg = this.a2h.bgcolor;
  //   }
  //   if (this.invert) {
  //     lfg = invColor(lfg);
  //     lbg = invColor(lbg);
  //   }
  //   // if (typeof this.a2h.text !== 'undefined' && this.a2h.text != '') {
  //   //   // no change
  //   // } else if (typeof this.a2h.mudEcho !== 'undefined') {
  //   //   if (this.echoFlag) {
  //   //     this.txt = this.a2h.mudEcho;
  //   //     lfg = this.echoCol;
  //   //     lbg = this.echoBak;
  //   //   } else {
  //   //     this.txt = '';
  //   //   }
  //   // }
  //   if (!this.bow) {
  //     this.fg = lfg;
  //     this.bg = lbg;
  //   } else {
  //     this.fg = invertGrayscale(lfg);
  //     this.bg = invertGrayscale(lbg);
  //   }

  //   if (this.a2h.concealed) {
  //     this.fg = this.bg;
  //   }
  // }

  // @Input() set blackToWhite(bow: boolean) {
  //   if (this.bow == bow) {
  //     return;
  //   }
  //   this.bow = bow;
  //   this.calcFgBg();
  // }

  // @Input() set invertFlag(flag: boolean) {
  //   if (this.invert == flag) {
  //     return;
  //   }
  //   this.invert = flag;
  //   this.calcFgBg();
  // }

  // @Input() set colorOff(flag: boolean) {
  //   if (this._colorOff == flag) {
  //     return;
  //   }
  //   this._colorOff = flag;
  //   this.calcFgBg();
  // }

  // @Input() set localEchoActive(flag: boolean) {
  //   if (this.echoFlag == flag) {
  //     return;
  //   }
  //   this.echoFlag = flag;
  //   this.calcFgBg();
  // }

  // @Input() set localEchoColor(col: string) {
  //   if (this.echoCol == col) {
  //     return;
  //   }
  //   this.echoCol = col;
  //   this.calcFgBg();
  // }

  // @Input() set localEchoBackground(col: string) {
  //   if (this.echoBak == col) {
  //     return;
  //   }
  //   this.echoBak = col;
  //   this.calcFgBg();
  // }

  // @Input() set ansi2html(ansi: IAnsiData) {
  //   if (ansi === undefined) {
  //     return;
  //   }

  //   this.a2h = ansi;
  //   // this.tt = ansi.timeString;
  //   this.calcFgBg();
  //   this.myclasses = '';
  //   if (ansi.bold) {
  //     this.myclasses += ' bold';
  //   }
  //   if (ansi.italic) {
  //     this.myclasses += ' italic';
  //   }
  //   if (ansi.underline) {
  //     this.myclasses += ' underline';
  //   }
  //   if (ansi.blink) {
  //     this.myclasses += ' blink';
  //   }
  //   if (ansi.crossedout) {
  //     this.myclasses += ' crossedout';
  //   }
  //   if (ansi.faint) {
  //     this.myclasses += ' faint';
  //   }
  //   if (this.myclasses != '') {
  //     this.myclasses = this.myclasses.substr(1);
  //   }
  //   // Todo: MudEcho Mudspan handling überarbeiten
  //   // if (typeof ansi.text !== 'undefined' && ansi.text != '') {
  //   //   this.txt = ansi.text;
  //   // } else if (typeof ansi.mudEcho !== 'undefined' && this.echoFlag) {
  //   //   this.txt = ansi.mudEcho;
  //   // } else {
  //   //   this.txt = '';
  //   // }
  // }
}
