import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {MatDialog, MatDialogConfig} from "@angular/material";
import { LayersModal } from '../../modal/layers/layers.modal';
import { Layer } from '../../../core/model/layer';

@Component({
  selector: 'app-layers',
  templateUrl: './layers.component.html',
  styleUrls: ['./layers.component.scss']
})
export class LayersComponent implements OnInit {
  @Input() layers;
  @Input() warps;
  @Output() onColorChange: any = new EventEmitter();
  @Output() onCreateLayer: any = new EventEmitter();
  @Output() onShowLayer: any = new EventEmitter();
  @Output() onHideLayer: any = new EventEmitter();

  selected = 0;

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
  }

  openDialog(layer) {
    var create = false;

    if (!layer) {
      layer = new Layer();
      create = true;
    }

    const dialogRef = this.dialog.open(LayersModal, 
      {data: { layer: layer, warps: this.warps }, width: '650px' });

    dialogRef.afterClosed().subscribe(result => {
      if (!create) {
        this.layers[result.id] = result;
      } else {
        this.onCreateLayer.emit({layer: result});
      }
    });
  }

  colorChange(e) {
    this.onColorChange.emit();
  }


  visibleButton(id, visible) {
    if (visible) {
      this.onShowLayer.emit({layerId: id});
    } else {
      this.onHideLayer.emit({layerId: id});
    }
  }
}
