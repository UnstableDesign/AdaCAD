import { Component, EventEmitter, Output } from '@angular/core';
import { WelcomeComponent } from '../welcome/welcome.component';
import { MatDialogRef } from '@angular/material/dialog';
import { WorkspaceService } from '../../provider/workspace.service';
import { density_units, loom_types, origin_option_list } from '../../model/defaults';

@Component({
    selector: 'app-workspace',
    templateUrl: './workspace.component.html',
    styleUrl: './workspace.component.scss',
    standalone: false
})



export class WorkspaceComponent {

  @Output() onLoomTypeOverride = new EventEmitter <any>(); 
  @Output() onDensityUnitOverride = new EventEmitter <any>(); 
  @Output() onOptimizeWorkspace = new EventEmitter <any>(); 
  @Output() onAdvanceOpsChange = new EventEmitter <any>(); 
  @Output() onDraftVisibilityChange = new EventEmitter<any>();
  @Output() onOperationSettingsChange = new EventEmitter<any>();

  unitOptions: any;
  originOptions: any;
  loomOptions: any;

 constructor(
  public ws: WorkspaceService,
  public dialogRef: MatDialogRef<WelcomeComponent>) { 
    
    this.unitOptions = density_units;
    this.loomOptions = loom_types;
    this.originOptions = origin_option_list;
 }

 optimizeWorkspace(){   
    this.onOptimizeWorkspace.emit();
}

setAdvancedOperations(val: boolean){
  this.ws.show_advanced_operations = val;
  this.onAdvanceOpsChange.emit();
}

setDraftsViewable(){
  //redraw the mixer
  this.onDraftVisibilityChange.emit();
}

overrideLoomType(){
  this.onLoomTypeOverride.emit();
}

forceJacquard(){
  this.ws.type =  'jacquard';
  this.overrideLoomType();
}

overrideDensityUnits(){
  this.onDensityUnitOverride.emit();
}

operationSettingsChange(){
  this.onOperationSettingsChange.emit();
}

hideDrafts(){
  this.ws.hide_mixer_drafts = true;
  this.setDraftsViewable();
}

setJacquardThreshold(value: number){
  console.log("VALUE", value);
  this.ws.force_jacquard_threshold = value;
}

 

}
