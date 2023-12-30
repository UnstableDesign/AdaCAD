import { Component } from '@angular/core';
import { System } from '../../core/model/datatypes';
import { SystemsService } from '../../core/provider/systems.service';
import { MaterialsService } from '../../core/provider/materials.service';

@Component({
  selector: 'app-material-settings',
  templateUrl: './material-settings.component.html',
  styleUrls: ['./material-settings.component.scss']
})
export class MaterialSettingsComponent {

  warp_systems: Array<System>; 
  weft_systems: Array<System>; 

  constructor(public ms: MaterialsService, private ss: SystemsService){


    this.warp_systems = [ss.getWarpSystem(0), ss.getWarpSystem(1), ss.getWarpSystem(2)];
    this.weft_systems = [ss.getWeftSystem(0), ss.getWeftSystem(1), ss.getWeftSystem(2)];

  }



}
