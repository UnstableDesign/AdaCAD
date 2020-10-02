import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ShuttlesModal } from '../../modal/shuttles/shuttles.modal';
import { Shuttle } from '../../../core/model/shuttle';
import { Draft } from '../../../core/model/draft';
import { NgForm } from '@angular/forms';



@Component({
  selector: 'app-shuttles',
  templateUrl: './shuttles.component.html',
  styleUrls: ['./shuttles.component.scss']
})


export class ShuttlesComponent implements OnInit {
  @Input() shuttles;
  @Input() warps;
  @Input() epi;
  @Output() onWarpNumChange: any = new EventEmitter();
  @Output() onEpiNumChange: any = new EventEmitter();
  @Output() onColorChange: any = new EventEmitter();
  @Output() onCreateShuttle: any = new EventEmitter();
  @Output() onShowShuttle: any = new EventEmitter();
  @Output() onHideShuttle: any = new EventEmitter();

  width = 0;
  selected = 0;
  warp_locked = false;


  constructor(private dialog: MatDialog) { }

  ngOnInit() {
    this.width = this.warps / this.epi;

  }

  openDialog(shuttle) {
    var create = false;

    if (!shuttle) {
      shuttle = new Shuttle();
      create = true;
    }

    const dialogRef = this.dialog.open(ShuttlesModal, 
      {data: { shuttle: shuttle, warps: this.warps }, width: '650px' });

    dialogRef.afterClosed().subscribe(result => {
      if (!create) {
        this.shuttles[result.id] = result;
      } else {
        this.onCreateShuttle.emit({shuttle: result});
      }
    });
  }

  colorChange(e) {
    this.onColorChange.emit();
  }


  warpChange(f: NgForm) {
    console.log(f.value);
    console.log(f.controls['warps']);
    f.controls['width'].setValue(f.value.warps / f.value.epi);
    this.onWarpNumChange.emit({warps: f.value.warps})
  }

  epiChange(f: NgForm) {
    console.log(f.value);
    f.controls['width'].setValue(f.value.warps / f.value.epi);   
    this.onEpiNumChange.emit({epi: f.value.epi});

  }

  widthChange(f: NgForm) {
    console.log(f.value);
    if(this.warp_locked){
      f.controls['epi'].setValue(Math.ceil(f.value.warps / f.value.width));   
    }else{
      f.controls['warps'].setValue(Math.ceil(f.value.width * f.value.epi));   
      this.onWarpNumChange.emit({warps: f.value.warps})
    }
   

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

}
