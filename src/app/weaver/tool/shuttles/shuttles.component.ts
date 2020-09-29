import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ShuttlesModal } from '../../modal/shuttles/shuttles.modal';
import { Shuttle } from '../../../core/model/shuttle';
import { Draft } from '../../../core/model/draft';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-shuttles',
  templateUrl: './shuttles.component.html',
  styleUrls: ['./shuttles.component.scss']
})
export class ShuttlesComponent implements OnInit {
  @Input() shuttles;
  @Input() wefts;
  @Input() warps;
  @Input() epi;
  @Output() onWeftNumChange: any = new EventEmitter();
  @Output() onWarpNumChange: any = new EventEmitter();
  @Output() onEpiNumChange: any = new EventEmitter();
  @Output() onColorChange: any = new EventEmitter();
  @Output() onCreateShuttle: any = new EventEmitter();
  @Output() onShowShuttle: any = new EventEmitter();
  @Output() onHideShuttle: any = new EventEmitter();

  selected = 0;
  weft_form = new FormControl('');
  warp_form = new FormControl('');
  epi_form = new FormControl('');

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
    this.epi_form.value = this.epi;
    this.weft_form.value = this.wefts;
    this.warp_form.value = this.warps;

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


  weftChange() {
    console.log(this.weft_form);
    this.onWeftNumChange.emit({weft_num: this.weft_form.value});
  }


  warpChange() {
    console.log("warp change");
    this.onWarpNumChange.emit({warp_num: this.warp_form.value});
  }

  epiChange() {
    this.onEpiChange.emit({epi: this.epi_form.value});
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
