import { Injectable } from '@angular/core';
import { IAnsiData } from '@mudlet3/frontend/features/ansi';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MudService {
  private readonly outputLines = new BehaviorSubject<IAnsiData[]>([]);

  public readonly outputLines$: Observable<IAnsiData[]> =
    this.outputLines.asObservable();

  public getCurrentOutputLines(): IAnsiData[] {
    return this.outputLines.value;
  }

  public addOutputLine(...line: Partial<IAnsiData>[]): void {
    this.outputLines.next([
      ...this.outputLines.value,
      ...(line as IAnsiData[]),
    ]);
  }
}
