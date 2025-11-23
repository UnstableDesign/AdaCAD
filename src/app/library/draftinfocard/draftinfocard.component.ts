import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { getDraftName, defaults as libDefaults, warps, wefts } from 'adacad-drafting-lib';
import { DraftStateNameChange } from '../../core/model/datatypes';
import { defaults as appDefaults } from '../../core/model/defaults';
import { OperationService } from '../../core/provider/operation.service';
import { StateService } from '../../core/provider/state.service';
import { TreeService } from '../../core/provider/tree.service';
import { DownloadComponent } from '../../core/ui/download/download.component';
import { DraftRenderingComponent } from '../../core/ui/draft-rendering/draft-rendering.component';
@Component({
  selector: 'app-draftinfocard',
  imports: [ReactiveFormsModule, DownloadComponent, MatButtonModule, MatFormField, MatInput, MatLabel, MatIconButton, MatTooltip, DraftRenderingComponent],
  templateUrl: './draftinfocard.component.html',
  styleUrl: './draftinfocard.component.scss'
})
export class DraftinfocardComponent {


  @ViewChild('draftRendering') draftRendering: DraftRenderingComponent;

  private tree = inject(TreeService);
  private ss = inject(StateService);
  private ops = inject(OperationService);


  nameForm = new FormControl('');
  notesForm = new FormControl('');
  epiForm = new FormControl<number>(0);
  ppiForm = new FormControl<number>(0);
  selectBoxForm = new FormControl<boolean>(false);
  loomUnits = null;
  loomType = null;
  warpnum = 0;
  weftnum = 0;
  oversize = false;

  inputList: Array<{ uid: string, op_name: string, inlet_name: string, type: string, value: string, category_color: string }> = [];

  @Input() id: number;
  @Output() onDraftSelectionChange = new EventEmitter<number>();
  @Output() onDraftRename = new EventEmitter<number>();
  ngOnInit() {


    this.refreshData();


  }

  ngAfterViewInit() {
    this.draftRendering.onNewDraftLoaded(this.id);
    this.draftRendering.redrawAll();
  }




  refreshData() {
    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    this.nameForm.setValue(getDraftName(draft), { emitEvent: false });
    this.notesForm.setValue(draft.notes || '', { emitEvent: false });
    this.epiForm.setValue(loom_settings.epi || libDefaults.loom_settings.epi, { emitEvent: false });
    this.ppiForm.setValue(loom_settings.ppi || libDefaults.loom_settings.ppi, { emitEvent: false });
    this.selectBoxForm.setValue(false, { emitEvent: false });
    this.loomUnits = loom_settings.units || libDefaults.loom_settings.units;
    this.loomType = loom_settings.type || libDefaults.loom_settings.type;
    this.warpnum = warps(draft.drawdown) || -1;
    this.weftnum = wefts(draft.drawdown) || -1;
    this.oversize = (this.warpnum > appDefaults.oversize_dim_threshold || this.weftnum > appDefaults.oversize_dim_threshold) ? true : false;
    this.inputList = this.getInputListForDraft(this.id);

    this.draftRendering.redrawAll();


  }


  toggleDraftSelection() {
    this.onDraftSelectionChange.emit(this.id);
  }




  /**
   * generate a list of all the different inlets to which this draft is connected. 
   * @param id 
   * @returns 
   */
  getInputListForDraft(id: number): Array<{ uid: string, op_name: string, inlet_name: string, type: string, value: string, category_color: string }> {


    this.inputList = [];
    const draft = this.tree.getDraft(id);
    let out_cxns = this.tree.getOutputsWithNdx(id);
    let out_ops = out_cxns.map(o => this.tree.getConnectionOutputWithIndex(o.tn.node.id));

    out_ops.forEach(o => {
      let op_node = this.tree.getOpNode(o.id);
      let op_obj = this.ops.getOp(op_node.name);

      this.inputList.push(
        {
          uid: Math.random().toString(36).substring(2, 15),
          op_name: op_obj.meta.displayname || op_node.name,
          inlet_name: op_obj.inlets[o.inlet]?.name || 'n/a',
          type: op_obj.inlets[o.inlet]?.type || 'n/a',
          value: op_node.inlets[o.inlet].toString(),
          category_color: this.ops.getCatColor(op_obj.meta.categories[0].name) || '#000'
        });
    });

    return this.inputList;

  }



  saveName() {
    const before_name = this.tree.getDraftName(this.id);



    this.ss.addStateChange(<DraftStateNameChange>{
      originator: 'DRAFT',
      type: 'NAME_CHANGE',
      id: this.id,
      before: before_name,
      after: this.nameForm.value
    });

    this.tree.getDraft(this.id).ud_name = this.nameForm.value;

    this.onDraftRename.emit(this.id);
    this.nameForm.markAsPristine();

  }





}
