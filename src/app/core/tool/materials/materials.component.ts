import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { Shuttle } from '../../../core/model/shuttle';
import { MaterialModal } from '../../modal/material/material.modal';

@Component({
  selector: 'app-materials',
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.scss']
})
export class MaterialsComponent implements OnInit {


  @Input() shuttles: any;
  @Input() material_types: any;
  @Output() onColorChange: any = new EventEmitter();
  @Output() onThicknessChange: any = new EventEmitter();
  @Output() onCreateShuttle: any = new EventEmitter();

  constructor(private dialog: MatDialog) { 
   
  }

  ngOnInit() {
  }

  openDialog(shuttle) {


    var create = false;

    if (!shuttle) {
      shuttle = new Shuttle();
      create = true;
    }

    const dialogRef = this.dialog.open(MaterialModal, 
      {data: {shuttle: shuttle, material_types:this.material_types}, width: '650px' });

    dialogRef.afterClosed().subscribe(result => {

    	console.log(result);
        if (!create) {
          this.shuttles[result.id] = result;
          this.onColorChange.emit();
        } else {
          this.onCreateShuttle.emit({shuttle: result});
        }
    });
  }

  thicknessChange(id:number, thickness:number) {
  	this.shuttles[id].setThickness(thickness);
    this.onThicknessChange.emit();
  }

  colorChange(e) {
    this.onColorChange.emit();
  }

}
