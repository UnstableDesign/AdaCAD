import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { loom_types, density_units } from '../../model/defaults';
import { MatFormField, MatInput, MatLabel, MatSuffix } from '@angular/material/input';
import { MatOption, MatSelect, MatSelectModule } from '@angular/material/select';
import { WorkspaceService } from '../../provider/workspace.service';

@Component({
  selector: 'app-loomsettings',
  imports: [MatFormField, MatLabel, MatSelect, MatInput, MatSuffix, MatOption, ReactiveFormsModule, FormsModule, MatSelectModule],
  templateUrl: './loomsettings.component.html',
  styleUrl: './loomsettings.component.scss',
})
export class LoomsettingsComponent {


  ws = inject(WorkspaceService);

  loomTypes = loom_types;
  densityUnits = density_units;

  epi: FormControl<number>;
  ppi: FormControl<number>;
  units: FormControl<string>;
  frames: FormControl<number>;
  treadles: FormControl<number>;
  type: FormControl<string>;

  constructor() {
    this.epi = new FormControl<number>(this.ws.epi);
    this.ppi = new FormControl<number>(this.ws.ppi);
    this.units = new FormControl<string>(this.ws.units);
    this.frames = new FormControl<number>(this.ws.min_frames);
    this.treadles = new FormControl<number>(this.ws.min_treadles);
    this.type = new FormControl<string>(this.ws.type);



    this.epi.valueChanges.subscribe(value => {
      this.ws.epi = value;
    });
    this.ppi.valueChanges.subscribe(value => {
      this.ws.ppi = value;
    });
    this.units.valueChanges.subscribe(value => {
      this.ws.units = <'in' | 'cm'>value;
    });
    this.frames.valueChanges.subscribe(value => {
      this.ws.min_frames = value;
    });
    this.treadles.valueChanges.subscribe(value => {
      this.ws.min_treadles = value;
    });
    this.type.valueChanges.subscribe(value => {
      this.ws.type = value;

      switch (value) {
        case 'jacquard':
          this.frames.disable();
          this.treadles.disable();
          break;
        case 'direct':
          this.frames.enable();
          this.treadles.disable();
          break;
        case 'frame':
          this.frames.enable();
          this.treadles.enable();
          break;
        default:
          this.frames.enable();
          this.treadles.enable();
      }
    });


  }

  ngOnInit() {
    this.initializeForm();
  }


  initializeForm() {
    this.epi.setValue(this.ws.epi, { emitEvent: false });
    this.ppi.setValue(this.ws.ppi, { emitEvent: false });
    this.units.setValue(this.ws.units, { emitEvent: false });
    this.frames.setValue(this.ws.min_frames, { emitEvent: false });
    this.treadles.setValue(this.ws.min_treadles, { emitEvent: false });
    this.type.setValue(this.ws.type);
  }

}


