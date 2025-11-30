import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { setMaxArea } from 'adacad-drafting-lib';
import { defaults, density_units, loom_types, origin_option_list } from '../../model/defaults';
import { WorkspaceService } from '../../provider/workspace.service';
import { WelcomeComponent } from '../welcome/welcome.component';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
  imports: [MatDialogTitle, ReactiveFormsModule, MatLabel, CdkScrollable, MatFormField, MatHint, MatInput, MatDialogContent, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatRadioGroup, FormsModule, MatRadioButton, MatButton, MatSlideToggle]
})



export class WorkspaceComponent {
  ws = inject(WorkspaceService);
  dialogRef = inject<MatDialogRef<WelcomeComponent>>(MatDialogRef);


  @Output() onLoomTypeOverride = new EventEmitter<any>();
  @Output() onDensityUnitOverride = new EventEmitter<any>();
  @Output() onOptimizeWorkspace = new EventEmitter<any>();
  @Output() onAdvanceOpsChange = new EventEmitter<any>();
  @Output() onDraftVisibilityChange = new EventEmitter<any>();
  @Output() onOperationSettingsChange = new EventEmitter<any>();

  unitOptions: any;
  originOptions: any;
  loomOptions: any;

  oversizeDimForm: FormControl;
  maxAreaForm: FormControl;

  constructor() {

    this.unitOptions = density_units;
    this.loomOptions = loom_types;
    this.originOptions = origin_option_list;
  }

  ngOnInit() {

    this.oversizeDimForm = new FormControl(this.ws.oversize_dim_threshold);
    this.oversizeDimForm.valueChanges.subscribe(value => {
      this.ws.setOversizeRendering(value);
    });

    this.maxAreaForm = new FormControl(defaults.max_simulation_area);
    this.maxAreaForm.valueChanges.subscribe(value => {
      setMaxArea(value);
    });

  }

  optimizeWorkspace() {
    this.onOptimizeWorkspace.emit();
  }

  setAdvancedOperations(val: boolean) {
    this.ws.show_advanced_operations = val;
    this.onAdvanceOpsChange.emit();
  }

  setDraftsViewable() {
    //redraw the mixer
    this.onDraftVisibilityChange.emit();
  }

  overrideLoomType() {
    this.onLoomTypeOverride.emit();
  }

  forceJacquard() {
    this.ws.type = 'jacquard';
    this.overrideLoomType();
  }

  overrideDensityUnits() {
    this.onDensityUnitOverride.emit();
  }

  operationSettingsChange() {
    this.onOperationSettingsChange.emit();
  }

  hideDrafts() {
    this.ws.hide_mixer_drafts = true;
    this.setDraftsViewable();
  }

  setJacquardThreshold(value: number) {
    this.ws.force_jacquard_threshold = value;
  }



}
