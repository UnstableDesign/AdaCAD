import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ConnectionModal } from '../../modal/connection/connection.modal';
import { ShuttlesModal } from '../../modal/shuttles/shuttles.modal';
import { Shuttle } from '../../../core/model/shuttle';
import { Draft } from '../../../core/model/draft';
import { NgForm } from '@angular/forms';





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
  @Input() zoom;
  @Input() view;
  @Input() frames;
  @Input() treadles;
  @Input() loomtype;
  @Input() loomtypes;
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
  @Output() onEpiNumChange: any = new EventEmitter();
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

  width = 0;
  selected = 0;
  warp_locked = false;
  loom = ""; 


  copy = false;

  constructor(private dialog: MatDialog) { }

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
      {data: { shuttle: shuttle, warps: this.warps, type: type}, width: '650px' });

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
    f.controls['width'].setValue(f.value.warps / f.value.epi);
    this.onWarpNumChange.emit({warps: f.value.warps})
  }

  epiChange(f: NgForm) {
    f.controls['width'].setValue(f.value.warps / f.value.epi);   
    this.onEpiNumChange.emit({epi: f.value.epi});

  }

  widthChange(f: NgForm) {
    if(this.warp_locked){
      f.controls['epi'].setValue(f.value.warps / f.value.width);   
    }else{
      f.controls['warps'].setValue(Math.ceil(f.value.width * f.value.epi));   
      this.onWarpNumChange.emit({warps: f.value.warps})
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
    console.log("loom change", e);
    this.onLoomTypeChange.emit(e.value);
  }

  frameChange(e:any){
    console.log("frame change", e);
    this.onFrameChange.emit(e.value);
  }

  treadleChange(e:any){
    console.log("treadle change", e);
    this.onTreadleChange.emit(e.value);
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
    console.log("remove pattern", pattern);
    this.onRemovePattern.emit({pattern: pattern});
  }


}
