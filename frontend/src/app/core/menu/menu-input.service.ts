import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Diese Klasse bilded alle Abhängigkeiten ab, die für die aktuell für die Menüsteuerung benötigt werden.
 */
@Injectable({
  providedIn: 'root',
})
export class MenuInputService {
  private connectedSubject = new BehaviorSubject<boolean>(false);

  get connected$(): Observable<boolean> {
    return this.connectedSubject.asObservable();
  }

  setConnected(value: boolean): void {
    console.log('[myst] MenuInputService:setConnected set', value);
    this.connectedSubject.next(value);
  }
}
