import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelDescription, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { hexToRgb, Material, updateMaterialIds } from 'adacad-drafting-lib';
import { createMaterial, setMaterialID } from 'adacad-drafting-lib/material';
import { DraftNode, MaterialsStateChange } from '../../model/datatypes';
import { DesignmodesService } from '../../provider/designmodes.service';
import { MaterialMap, MaterialsService } from '../../provider/materials.service';
import { StateService } from '../../provider/state.service';
import { TreeService } from '../../provider/tree.service';


@Component({
  selector: 'app-material-modal',
  templateUrl: './material.modal.html',
  styleUrls: ['./material.modal.scss'],
  imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription, MatFormField, MatLabel, MatInput, ReactiveFormsModule, MatSuffix, MatButton, MatMenuTrigger, MatMenu, MatDialogActions, MatDialogClose]
})



export class MaterialModal {
  private dm = inject(DesignmodesService);
  ms = inject(MaterialsService);
  private tree = inject(TreeService);
  private fb = inject(FormBuilder);
  private state = inject(StateService);

  @Output() onMaterialChange: any = new EventEmitter();

  replacements: Array<number> = [];
  types: any;
  newshuttle: Material = createMaterial({});
  addmaterial: boolean = false;

  // Reactive forms
  materialsForm: FormGroup;
  newMaterialForm: FormGroup;
  allmaterials: Array<Material> = [];

  constructor() {
    const ms = this.ms;

    ms.getShuttles().forEach((el, ndx) => {
      this.replacements.push((ndx + 1 % this.ms.getShuttles().length));
    });

    this.initializeForms();
  }

  ngOnInit() {

    this.ms.getShuttles().forEach((el, ndx) => {
      this.allmaterials.push((<Material>{
        id: el.id,
        name: el.name,
        color: el.color,
        rgb: el.rgb,
        diameter: el.diameter,
        notes: el.notes
      }));
    });

    this.updateMaterialsForm();

  }

  private initializeForms() {
    // Initialize new material form
    this.newMaterialForm = this.fb.group({
      name: [''],
      color: ['#000000'],
      diameter: [0],
      notes: ['']
    });

    // Initialize materials form (will be populated in ngOnInit)
    this.materialsForm = this.fb.group({
      materials: this.fb.array([])
    });


  }

  private updateMaterialsForm() {
    const materialsArray = this.materialsForm.get('materials') as FormArray;
    materialsArray.clear();

    this.ms.getShuttles().forEach((material, index) => {
      materialsArray.push(this.fb.group({
        id: [material.id],
        name: [material.name],
        color: [material.color],
        diameter: [material.diameter],
        notes: [material.notes || '']
      }));
    });
  }

  get materialsFormArray(): FormArray {
    return this.materialsForm.get('materials') as FormArray;
  }


  diameterChange() {

  }


  materialColorChange(id: number, e: any) {
    const material = this.ms.getShuttle(id);
    material.rgb = hexToRgb(e);
    // Update the form control as well
    const materialsArray = this.materialsFormArray;
    const materialIndex = materialsArray.controls.findIndex(control => control.get('id')?.value === id);
    if (materialIndex !== -1) {
      materialsArray.at(materialIndex).get('color')?.setValue(e);
    }
  }

  addMaterial() {

  }




  /**
   * handles user input of delete event and reads the "replace" value to reassign draft
   * @param index  - the shuttle to delete
   */
  delete(index: number, replacement_id: number) {

    if (this.ms.getShuttles().length == 1) return;

    if (confirm("Are you sure you want to delete this material")) {
      this.replacements[index] = replacement_id;


      const map: Array<MaterialMap> = this.ms.deleteShuttle(index);
      const dn: Array<DraftNode> = this.tree.getDraftNodes();


      dn.forEach(dn => {
        dn.draft.rowShuttleMapping = updateMaterialIds(dn.draft.rowShuttleMapping, map, this.replacements[index]);
        dn.draft.colShuttleMapping = updateMaterialIds(dn.draft.colShuttleMapping, map, this.replacements[index]);

      });

      //remove this from replacements
      this.replacements = this.replacements.filter((el, ndx) => ndx != index);
      //map remaning replacement values to valid indices 
      this.replacements = this.replacements.map(el => (el % this.ms.getShuttles().length));

      this.onMaterialChange.emit();
    }
  }

  addNewShuttle() {
    if (this.newMaterialForm.valid) {
      const formValue = this.newMaterialForm.value;
      const newMaterial = createMaterial({
        name: formValue.name,
        color: formValue.color,
        diameter: formValue.diameter,
        notes: formValue.notes
      });

      setMaterialID(newMaterial, this.ms.getShuttles().length);
      newMaterial.rgb = hexToRgb(newMaterial.color.trim());
      this.ms.addShuttle(newMaterial);

      // Reset the form
      this.newMaterialForm.reset({
        name: '',
        color: '#000000',
        diameter: 0,
        notes: ''
      });

      // Update the materials form array
      this.updateMaterialsForm();
    }
  }

  save() {
    // Sync form changes back to the materials service


    this.syncFormToMaterials();

    const change: MaterialsStateChange = {
      originator: 'MATERIALS',
      type: 'UPDATED',
      before: this.allmaterials.slice(),
      after: this.ms.getShuttles().slice()
    }
    this.state.addStateChange(change);
    this.onMaterialChange.emit();
  }

  private syncFormToMaterials() {
    const materialsArray = this.materialsFormArray;
    materialsArray.controls.forEach((control, index) => {
      const formValue = control.value;
      const material = this.ms.getShuttle(formValue.id);
      if (material) {
        material.name = formValue.name;
        material.color = formValue.color;
        material.diameter = formValue.diameter;
        material.notes = formValue.notes;
        material.rgb = hexToRgb(formValue.color);
      }
    });


  }

  ngOnDestroy() {
  }


}
