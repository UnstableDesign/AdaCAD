import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { DesignmodesService } from '../../../mixer/provider/designmodes.service';
import { InkService } from '../../../mixer/provider/ink.service';
import * as _ from 'lodash';



@Component({
  selector: 'app-mixerdesign',
  templateUrl: './mixerdesign.component.html',
  styleUrls: ['./mixerdesign.component.scss']
})


export class MixerDesignComponent implements OnInit {
  @Input()  view_mode;
  @Output() onDesignModeChange: any = new EventEmitter();
  @Output() onInkChange: any = new EventEmitter();

  button_color = "#ff4081";


  selected = 0;

  constructor(private design_modes: DesignmodesService, private inks: InkService) { 
  }

  ngOnInit() {

  }

  inkChanged(e:any){
    console.log("changing to", e.target.name);
    this.inks.select(e.target.name);
    this.onInkChange.emit(e.target.name);
  }




  designModeChange(e: any) {
    this.design_modes.select(e.target.name);
    this.onDesignModeChange.emit(e.target.name);
  }

  drawWithMaterial(e: any){
  
  }

 



















}
