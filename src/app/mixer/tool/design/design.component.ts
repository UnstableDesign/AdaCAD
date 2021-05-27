import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { DesignmodesService } from '../../../core/provider/designmodes.service';
import { InkService } from '../../../core/provider/ink.service';
import * as _ from 'lodash';



@Component({
  selector: 'app-design',
  templateUrl: './design.component.html',
  styleUrls: ['./design.component.scss']
})


export class DesignComponent implements OnInit {
  @Input()  view_mode;
  @Input()  materials;
  @Output() onDesignModeChange: any = new EventEmitter();

  button_color = "#ff4081";


  selected = 0;

  constructor(private design_modes: DesignmodesService, private inks: InkService, private dialog: MatDialog) { 
  }

  ngOnInit() {

  }

  inkChanged(e:any){
    this.inks.select(e.target.name);
  }


  designModeChange(e: any) {
    this.design_modes.select(e.target.name);
    this.onDesignModeChange.emit(e.target.name);
  }

  drawWithMaterial(e: any){
  
  }

 



















}
