import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ConnectionModal } from '../../modal/connection/connection.modal';
import { ShuttlesModal } from '../../modal/shuttles/shuttles.modal';
import { Shuttle } from '../../../core/model/shuttle';
import { Draft } from '../../../core/model/draft';
import { NgForm } from '@angular/forms';
import { PatternModal } from '../../modal/pattern/pattern.modal';
import { Pattern } from '../../../core/model/pattern';
import { PatternService } from '../../../core/provider/pattern.service';
import * as _ from 'lodash';




@Component({
  selector: 'app-design',
  templateUrl: './design.component.html',
  styleUrls: ['./design.component.scss']
})


export class DesignComponent implements OnInit {
  @Input() brush;
  @Input() collapsed;
  @Input() favorites;
  @Input() shuttles;
  @Input() warp_systems;
  @Input() epi;
  @Input() warps;
  @Input() wefts;
  @Input() units;
  @Input() width;
  @Input() zoom;
  @Input() view;
  @Input() frames;
  @Input() treadles;
  @Input() loomtype;
  @Input() loomtypes;
  @Input() density_units;
  @Input()  patterns;
  @Output() onBrushChange: any = new EventEmitter();
  @Output() onFill: any = new EventEmitter();
  @Output() onMask: any = new EventEmitter();
  @Output() onPaste: any = new EventEmitter();
  @Output() onCopy: any = new EventEmitter();
  @Output() onClear: any = new EventEmitter();
  @Output() onConnectionCreate: any = new EventEmitter();
  @Output() onLabelCreate: any = new EventEmitter();
  @Output() onWarpNumChange: any = new EventEmitter();
  @Output() onWeftNumChange: any = new EventEmitter();
  @Output() onEpiNumChange: any = new EventEmitter();
  @Output() onUnitChange: any = new EventEmitter();
  @Output() onThicknessChange: any = new EventEmitter();
  @Output() onColorChange: any = new EventEmitter();
  @Output() onCreateShuttle: any = new EventEmitter();
  @Output() onCreateWarpSystem: any = new EventEmitter();
  @Output() onShowShuttle: any = new EventEmitter();
  @Output() onHideShuttle: any = new EventEmitter();
  @Output() onViewChange: any = new EventEmitter();
  @Output() onZoomChange: any = new EventEmitter();
  @Output() onLoomTypeChange = new EventEmitter();
  @Output() onFrameChange = new EventEmitter();
  @Output() onTreadleChange = new EventEmitter();
  @Output() onPatternChange: any = new EventEmitter();
  @Output() onCreatePattern: any = new EventEmitter();
  @Output() onRemovePattern: any = new EventEmitter();

  selected = 0;
  warp_locked = false;
  loom = ""; 


  copy = false;

  constructor(private dialog: MatDialog) { 
  }

  ngOnInit() {

  }

  openConnectionDialog() {

    this.onConnectionCreate.emit();
  }

  openLabelDialog() {

    this.onLabelCreate.emit();
  }

  brushChange(e: any) {
     if (e.target.name) {
      this.brush = e.target.name;
    }

    var obj: any = {};
    obj.name = this.brush;
    this.onBrushChange.emit(obj);
  }

  fillEvent(e, id) {
    var obj: any = {};
    obj.id = id;
    this.onFill.emit(obj);
  }

  copyEvent(e) {
    this.onCopy.emit();
    this.copy = true;
  }

  clearEvent(e) {
    this.onClear.emit();
  }

  maskEvent(e, id) {
    var obj: any = {};
    obj.id = id;
    this.onMask.emit(obj);
  }

  pasteEvent(e, type) {
    var obj: any = {};
    obj.type = type;
    this.onPaste.emit(obj);
  }

  openDialog(type, shuttle) {
    var create = false;

    if (!shuttle) {
      shuttle = new Shuttle();
      create = true;
    }

    const dialogRef = this.dialog.open(ShuttlesModal, 
      {data: { shuttle: shuttle, warps: this.warps, type: type, }, width: '650px' });

    dialogRef.afterClosed().subscribe(result => {
      if (type == "weft"){

        if (!create) {
          this.shuttles[result.id] = result;
        } else {
          this.onCreateShuttle.emit({shuttle: result});
        }

      }else{

        if (!create) {
          this.warp_systems[result.id] = result;
        } else {
          this.onCreateWarpSystem.emit({shuttle: result});
        }

      }
    });
  }



  colorChange(e) {
    this.onColorChange.emit();
  }


  warpChange(f: NgForm) {
    if(!f.value.warps){
     f.value.warps = 2;
     this.warps = f.value.warps;
    }

    this.onWarpNumChange.emit({warps: f.value.warps})
  }

  weftChange(f: NgForm) {
    if(!f.value.wefts){
      f.value.wefts = 2;
      this.wefts = 2;
    } 
    this.onWeftNumChange.emit({wefts: f.value.wefts})
  }

  epiChange(f: NgForm) {
    if(!f.value.epi){
      f.value.epi = 1;
      this.epi = f.value.epi;
    } 
    this.onEpiNumChange.emit({epi: f.value.epi});

  }

  thicknessChange(id: any, value: number) {
    this.onThicknessChange.emit();

  }

  widthChange(f: NgForm) {

    if(!f.value.width){
      f.value.width = 1;
      this.width = f.value.width;
    } 

    if(this.warp_locked){
      var new_epi = (this.units == "in") ? f.value.warps / f.value.width : (10 * f.value.warps / f.value.width);
      this.onEpiNumChange.emit({epi: new_epi});
    }else{
      var new_warps = (this.units === "in") 
      ? Math.ceil(f.value.width * f.value.epi) : 
      Math.ceil((10 * f.value.warps / f.value.width));

      this.onWarpNumChange.emit({warps: new_warps})
    }
   

  }


  viewChange(e:any){
    this.onViewChange.emit(e.value);
  }

  zoomChange(e:any, source: string){
    console.log("source", source)
    e.source = source;
    this.onZoomChange.emit(e);
  }

  loomChange(e:any){
    console.log("loom change", e.value.loomtype);
    this.onLoomTypeChange.emit(e.value);
  }

  unitChange(e:any){
    console.log("unit change", e.value.unit);
    this.onUnitChange.emit(e.value);
  }


  visibleButton(id, visible) {
    if (visible) {
      this.onShowShuttle.emit({shuttleId: id});
    } else {
      this.onHideShuttle.emit({shuttleId: id});
    }
  }

  handleFile(e: any) {
    console.log(e);
   
  }

  openPatternDialog(pattern) {
    console.log("open dialog")
    var create = false;

    if (!pattern) {
      pattern = new Pattern();
      create = true;
    }

    const dialogRef = this.dialog.open(PatternModal, 
      {data: pattern });

    dialogRef.afterClosed().subscribe(result => {
      if (!create) {
        this.patterns[result.id] = result;
      } else {
        this.onCreatePattern.emit({pattern: result});
      }

      var obj: any = {};
      obj.patterns = _.cloneDeep(this.patterns);
      this.onPatternChange.emit(obj);
    });
  }

  print(e) {
    console.log(e);
  }

  updateFavorite(p) {

    this.patterns[p].favorite = !this.patterns[p].favorite;

    var obj:any = {};
    obj.patterns = _.cloneDeep(this.patterns);

    this.onPatternChange.emit(obj);
  }


  removePattern(pattern) {
    this.onRemovePattern.emit({pattern: pattern});
  }

  updateMinTreadles(f: NgForm){
    //validate the input
    if(!f.value.treadles){
      f.value.treadles = 2; 
      this.treadles = f.value.treadles;
    } 

    f.value.treadles = Math.ceil(f.value.treadles);
    this.onTreadleChange.emit({value: f.value.treadles});
  }

  updateMinFrames(f: NgForm){
    if(!f.value.frames){
      f.value.frames = 2; 
      this.frames = f.value.frames;
    } 
    f.value.frames = Math.ceil(f.value.frames);

    this.onFrameChange.emit({value: f.value.frames});
  }


}
