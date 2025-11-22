import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { getDraftName, defaults as libDefaults, warps, wefts } from 'adacad-drafting-lib';
import { defaults as appDefaults } from '../../core/model/defaults';
import { TreeService } from '../../core/provider/tree.service';
import { DraftRenderingComponent } from '../../core/ui/draft-rendering/draft-rendering.component';
@Component({
  selector: 'app-draftinfocard',
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatLabel, MatIconButton, MatTooltip, DraftRenderingComponent],
  templateUrl: './draftinfocard.component.html',
  styleUrl: './draftinfocard.component.scss'
})
export class DraftinfocardComponent {


  private tree = inject(TreeService);

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

  @Input() id: number;
  @Output() onDraftSelectionChange = new EventEmitter<number>();

  ngOnInit() {


    this.refreshData();


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
  }


  toggleDraftSelection() {
    this.onDraftSelectionChange.emit(this.id);
  }

  downloadDraft() {

    //placeholder

  }





}
