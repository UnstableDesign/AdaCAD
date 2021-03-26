import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-loom',
  templateUrl: './loom.component.html',
  styleUrls: ['./loom.component.scss']
})




export class LoomComponent implements OnInit {



  @Input() epi;
  @Input() warps;
  @Input() wefts;
  @Input() units;
  @Input() width;
  @Input() frames;
  @Input() treadles;
  @Input() loomtype;
  @Input() loomtypes;
  @Input() density_units;
  @Output() onLoomTypeChange = new EventEmitter();
  @Output() onFrameChange = new EventEmitter();
  @Output() onTreadleChange = new EventEmitter();
  @Output() onWarpNumChange: any = new EventEmitter();
  @Output() onWeftNumChange: any = new EventEmitter();
  @Output() onEpiNumChange: any = new EventEmitter();
  @Output() onUnitChange: any = new EventEmitter();
 
  warp_locked = false;
  loom = ""; 

  constructor() { }

  ngOnInit() {
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


  loomChange(e:any){
    console.log("loom change", e.value.loomtype);
    this.onLoomTypeChange.emit(e.value);
  }

  unitChange(e:any){
    console.log("unit change", e.value.unit);
    this.onUnitChange.emit(e.value);
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



}
