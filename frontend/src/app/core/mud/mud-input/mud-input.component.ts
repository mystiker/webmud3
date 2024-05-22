import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-mud-input',
  templateUrl: './mud-input.component.html',
  styleUrls: ['./mud-input.component.scss'],
})
export class MudInputComponent {
  @Output() messageSent = new EventEmitter<string>();
  public inpmessage: string = '';
  private inpHistory: string[] = [];
  private inpPointer = -1;

  constructor() {}

  sendMessage() {
    this.messageSent.emit(this.inpmessage);
    if (
      this.inpHistory.length == 0 ||
      (this.inpHistory.length > 0 && this.inpHistory[0] != this.inpmessage)
    ) {
      this.inpHistory.unshift(this.inpmessage);
    }
    this.inpmessage = '';
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onKeyUp(event: KeyboardEvent) {
    // Handling key up events for history navigation, etc.
    if (event.key === 'ArrowUp') {
      if (this.inpHistory.length <= this.inpPointer) {
        return;
      }
      if (this.inpPointer < 0) {
        if (this.inpmessage === '') {
          if (this.inpHistory.length > 0) {
            this.inpPointer = 0;
            this.inpmessage = this.inpHistory[0];
          }
        } else {
          if (
            this.inpHistory.length > 0 &&
            this.inpmessage === this.inpHistory[0]
          ) {
            return;
          }
          this.inpHistory.unshift(this.inpmessage);
          if (this.inpHistory.length > 1) {
            this.inpPointer = 1;
            this.inpmessage = this.inpHistory[1];
          } else {
            this.inpPointer = 0;
          }
        }
      } else {
        this.inpPointer++;
        if (this.inpHistory.length > this.inpPointer) {
          this.inpmessage = this.inpHistory[this.inpPointer];
        }
      }
    } else if (event.key === 'ArrowDown') {
      if (this.inpPointer < 0) {
        return;
      }
      this.inpPointer--;
      if (this.inpPointer < 0) {
        this.inpmessage = '';
      } else {
        this.inpmessage = this.inpHistory[this.inpPointer];
      }
    }
  }
}
