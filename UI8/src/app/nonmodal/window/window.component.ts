import { Component, Input, ViewChild, Output, EventEmitter, ComponentFactoryResolver, AfterViewInit, ViewContainerRef, ChangeDetectorRef } from '@angular/core';
import { MyDynamicComponent } from './my-dynamic.component';
import { WindowConfig } from '../window-config';
import { EditorComponent } from '../editor/editor.component';
import { IResizeEvent } from 'angular2-draggable/lib/models/resize-event';
import { WindowsService } from '../windows.service';
import { DirlistComponent } from '../dirlist/dirlist.component';
import { ConfigviewerComponent } from '../configviewer/configviewer.component';

@Component({
  selector: 'app-window',
  templateUrl: './window.component.html',
  styleUrls: ['./window.component.css',"../../../../node_modules/angular2-draggable/css/resizable.min.css"]
})
export class WindowComponent implements AfterViewInit {
  @Input('config') config : WindowConfig;
  @Output('menuAction') menuAction= new EventEmitter<string>();
  @ViewChild('windowsHost', {static:false,read: ViewContainerRef}) windowsHost: ViewContainerRef;
  interval:any;

  public lockDrag : boolean = false;
  public cwidth : number = 218;
  public cheight : number = 218-71;
  public cposx : number = 100;
  public cposy : number = 100;
  public moving: boolean = false;
  private cri: MyDynamicComponent; 

  private updateMySize(twidth,theight) {
    this.cwidth = twidth - 4;
    this.cheight = theight-71;
    this.cri.inMsg = "resize:"+this.cwidth+":"+this.cheight;
  }

  private updateMyPosition(posx,posy,move) {
    this.cposx = posx;
    this.cposy = posy;
    this.moving = move;
    if (move) {
      this.cri.inMsg = "moving:"+this.cposx+":"+this.cposy;
    } else {
      this.cri.inMsg = "endMove:"+this.cposx+":"+this.cposy;
    }
  }

  ngAfterViewInit(): void {
    this.loadComponent();
  }
  loadComponent() {
    let self = this;
    var cmp: any;
    if (typeof this.windowsHost === 'undefined') {
      console.error("windowsHost undefined");
      return;
    }
    switch (this.config.component) {
      case 'EditorComponent': cmp = EditorComponent; break;
      case 'DirlistComponent': cmp = DirlistComponent; break;
      case 'ConfigviewerComponent': cmp = ConfigviewerComponent; break;
      default: console.log("Unknown Component:",this.config.component); return;
    }
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(cmp);
    this.windowsHost.clear();

    let componentRef = this.windowsHost.createComponent(componentFactory);
    this.cri = (<MyDynamicComponent>componentRef.instance);
    this.cri.config = this.config;
    this.cri.outMsg.subscribe((x:string) => {
      console.log("outMsg: ",x);
      self.config.outGoingEvents.emit(x);
    }, err => {
      console.log("outMsg-Error: ",err);
      self.config.outGoingEvents.error(err);
    }, () => {
      console.log("outMsg-complete");
      self.config.outGoingEvents.complete();
    });
    this.winsrv.getDownStream().subscribe((x:string)=>{
      let exp = x.split(":");
      console.log("DownStream: ",x);
      if (exp[0] == self.config.windowid) {
        self.cri.inMsg = exp.slice(1).join(":");
      }
    },(err:any)=>{
      console.log("DownStream-error: ",err)
    },()=>{
      console.log("DownStream-complete");
    })
    this.cdRef.detectChanges();
  }

  onMenuAction(what) {
    console.log('menuAction',this.config.windowid,what);
    switch (what) {
      case 'lock':
        this.lockDrag = !this.lockDrag;
        if (this.lockDrag) {
          this.menuAction.emit(this.config.windowid+':lock');
        } else {
          this.menuAction.emit(this.config.windowid+':unlock');
        }
        return;
      case 'save':
        this.cri.inMsg = 'save';
        this.menuAction.emit(this.config.windowid+':save');
        return;
      case 'cancel':
        this.menuAction.emit(this.config.windowid+':cancel');
        return;
    }
  }

  onResizeStart(event:IResizeEvent) {
    this.updateMySize(event.size.width,event.size.height);
  }

  onResizing(event:IResizeEvent) {
    this.updateMySize(event.size.width,event.size.height);
  }

  onResizeStop(event:IResizeEvent) {
    this.updateMySize(event.size.width,event.size.height);
  }

  onMoveEnd(event: Object) {
    console.log('onMoveEnd:',event);
    this.updateMyPosition(event["x"],event["y"],false);
  }

  onMoving(event: Object) {
    this.updateMyPosition(event["x"],event["y"],true);
  }

	constructor(private componentFactoryResolver: ComponentFactoryResolver,private cdRef : ChangeDetectorRef,private winsrv : WindowsService) {}

}
