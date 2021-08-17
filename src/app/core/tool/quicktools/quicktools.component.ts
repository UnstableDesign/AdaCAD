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
     this.onDesignModeChange.emit(obj);
  }

  designModeChange(name: string) {

    console.log("mode change", name);
     var obj: any = {};
     obj.name = name;
     this.onDesignModeChange.emit(obj);
  }

  drawWithMaterial(material_id: number){
    var obj: any = {};
    obj.name = 'material';
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
