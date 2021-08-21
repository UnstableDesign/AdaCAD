import { Component, Input, Output, OnInit,EventEmitter } from '@angular/core';
import { System } from '../../model/system';
import { DesignmodesService } from '../../provider/designmodes.service';

@Component({
  selector: 'app-quicktools',
  templateUrl: './quicktools.component.html',
  styleUrls: ['./quicktools.component.scss']
})
export class QuicktoolsComponent implements OnInit {

  @Input() draft;
  @Input() loom;
  @Input() timeline;

  @Output() onUndo: any = new EventEmitter();
  @Output() onRedo: any = new EventEmitter();
  @Output() onDesignModeChange: any = new EventEmitter();


  //design mode options
  mode_draw: any;


  weft_systems: Array<System>;
  warp_systems: Array<System>;

  


  constructor(private dm: DesignmodesService) { 


  }

  ngOnInit() {
    this.weft_systems = this.draft.weft_systems;
    this.warp_systems = this.draft.warp_systems;
  }

  select(){
    var obj: any = {};
     obj.name = "select";
     obj.target = "design_modes";
     this.onDesignModeChange.emit(obj);
  }

  drawModeChange(name: string) {

     var obj: any = {};
     obj.name = name;
     obj.target = "draw_modes";
     this.onDesignModeChange.emit(obj);
  }

  drawWithMaterial(material_id: number){
    var obj: any = {};
    obj.name = 'material';
    obj.target = 'draw_modes';
    obj.id = material_id;
    this.onDesignModeChange.emit(obj);
  }



  undoClicked(e:any) {
    this.onUndo.emit();
  }

  redoClicked(e:any) {
    this.onRedo.emit();
  }

}
