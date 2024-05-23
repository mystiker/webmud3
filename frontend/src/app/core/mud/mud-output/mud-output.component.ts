import { Component, Input } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IMudMessage } from '../types/mud-message';

@Component({
  selector: 'app-mud-output',
  templateUrl: './mud-output.component.html',
  styleUrls: ['./mud-output.component.scss'],
})
export class MudOutputComponent {
  private readonly linesSubject = new BehaviorSubject<IMudMessage[]>([]);

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
  public stdfg!: string;

  @Input({ required: true })
  public stdbg!: string;
}
