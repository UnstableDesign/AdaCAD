import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MaterialModal } from '../../modal/material/material.modal';
import { ShuttlesModal } from '../../modal/shuttles/shuttles.modal';
import { Material } from '../../../core/model/material';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";

@Component({
  selector: 'app-materials',
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.scss']
})
export class MaterialsComponent implements OnInit {


  @Input() materials: any;
  @Input() material_types: any;
  @Output() onColorChange: any = new EventEmitter();
  @Output() onThicknessChange: any = new EventEmitter();
  @Output() onCreateMaterial: any = new EventEmitter();

  constructor(private dialog: MatDialog) { 
  
  }

  ngOnInit() {
  }

  openDialog(material) {

  	console.log("open material", material);

    var create = false;

    if (!material) {
      material = new Material();
      create = true;
    }

    const dialogRef = this.dialog.open(MaterialModal, 
      {data: { material: material, material_types:this.material_types}, width: '650px' });

    dialogRef.afterClosed().subscribe(result => {

    	console.log(result);
        if (!create) {
          this.materials[result.id] = result;
        } else {
          this.onCreateMaterial.emit({material: result});
        }
    });
  }

  thicknessChange(id:number, thickness:number) {
  	this.materials[id].setThickness(thickness);
    this.onThicknessChange.emit();
  }

  colorChange(e) {
    this.onColorChange.emit();
  }

}
