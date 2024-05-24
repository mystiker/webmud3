import {
  AfterViewChecked,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IMudMessage } from '../../types/mud-message';

@Component({
  selector: 'app-mud-output',
  templateUrl: './mud-output.component.html',
  styleUrls: ['./mud-output.component.scss'],
})
export class MudOutputComponent implements AfterViewChecked {
  private readonly linesSubject = new BehaviorSubject<IMudMessage[]>([]);

  @ViewChild('container', { static: true })
  private readonly outputContainer!: ElementRef;

  protected readonly lines$: Observable<IMudMessage[]> =
    this.linesSubject.asObservable();

  public get lines(): IMudMessage[] {
    return this.linesSubject.value;
  }

  @Input({ required: true })
  public set lines(value: IMudMessage[]) {
    this.linesSubject.next(value);
  }

  @Input({ required: true })
  public foregroundColor!: string;

  @Input({ required: true })
  public backgroundColor!: string;

  public ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.outputContainer.nativeElement.scrollTop =
      this.outputContainer.nativeElement.scrollHeight;
  }
}