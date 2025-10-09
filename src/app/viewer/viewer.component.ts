import { Component, EventEmitter, inject, Output, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatMiniFabButton } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { Draft, getDraftName, warps, wefts } from 'adacad-drafting-lib/draft';
import { Subscription } from 'rxjs';
import { DraftStateNameChange } from '../core/model/datatypes';
import { FirebaseService } from '../core/provider/firebase.service';
import { StateService } from '../core/provider/state.service';
import { TreeService } from '../core/provider/tree.service';
import { ViewerService } from '../core/provider/viewer.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { ZoomService } from '../core/provider/zoom.service';
import { DraftRenderingComponent } from '../core/ui/draft-rendering/draft-rendering.component';
import { SimulationComponent } from './simulation/simulation.component';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss'],
  imports: [ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatButton, MatTooltip, MatMenuTrigger, MatMenu, MatMenuItem, DraftRenderingComponent, SimulationComponent, MatToolbar, MatSlider, MatSliderThumb, MatInput, MatMiniFabButton]
})
export class ViewerComponent {
  private tree = inject(TreeService);
  ws = inject(WorkspaceService);
  vs = inject(ViewerService);
  zs = inject(ZoomService);
  fb = inject(FirebaseService);
  ss = inject(StateService);


  @Output() onOpenEditor: any = new EventEmitter();
  @Output() onDraftRename: any = new EventEmitter();
  @Output() onSave: any = new EventEmitter();
  @Output() onForceFocus: any = new EventEmitter();

  @ViewChild(SimulationComponent) sim;
  @ViewChild('view_rendering') view_rendering: DraftRenderingComponent;

  // Reactive form for viewer controls

  draft_canvas: HTMLCanvasElement;
  draft_cx: any;
  pixel_ratio: number = 1;
  vis_mode: string = 'color'; //sim, draft, structure, color
  view_expanded: boolean = false;
  filename: string = '';
  draftName: FormControl;
  zoomLevel: FormControl;

  warps: number = 0;
  wefts: number = 0;
  scale: number = 0;
  before_name: string = '';

  idChangeSubscription: Subscription;
  updateViewerSubscription: Subscription;


  constructor() {

    this.idChangeSubscription = this.vs.showing_id_change$.subscribe(data => {
      if (data == -1) this.clearDraft();
      else this.loadDraft(data);
    })

    this.vs.update_viewer$.subscribe(data => {
      this.redraw();
    })

    this.draftName = new FormControl('');
    this.zoomLevel = new FormControl(0);



  }

  ngOnDestroy() {
    this.idChangeSubscription.unsubscribe();
    this.updateViewerSubscription.unsubscribe();
  }

  ngOnInit() {


    // Subscribe to form changes
    this.draftName.valueChanges.subscribe(value => {
      //do nothing, broadcast change on enter
    });

    this.zoomLevel.valueChanges.subscribe(value => {
      if (value !== null && value !== undefined) {
        this.zs.setZoomIndexOnViewer(value);
        this.zoomChange();
      }
    });


    // this.filename = this.ws.current_file.name;
    this.scale = this.zs.getViewerZoom();

  }


  getVisVariables() {
    switch (this.vis_mode) {
      case 'sim':
      case 'draft':
        return { use_colors: false, floats: false };
      case 'structure':
        return { use_colors: false, floats: true };
      case 'color':
        return { use_colors: true, floats: true };
    }
  }


  /**
   * called when a name update has taken place in the mixer so we can update the form here. 
   * @returns 
   */
  onRenameSubmit() {

    if (this.vs.getViewerId() == -1) return;

    const draft = this.tree.getDraft(this.vs.getViewerId());
    const draftName = this.draftName.value;
    draft.ud_name = draftName;

    this.ss.addStateChange(<DraftStateNameChange>{
      originator: 'DRAFT',
      type: 'NAME_CHANGE',
      id: this.vs.getViewerId(),
      before: this.before_name,
      after: draftName
    });


    this.before_name = getDraftName(this.tree.getDraft(this.vs.getViewerId()));
    this.onDraftRename.emit(this.vs.getViewerId());
    //broadcast that this changed. 
  }

  updateDraftNameFromMixerEvent(name: string) {
    console.log("UPDATING DRAFT NAME FROM MIXER EVENT: ", name, this.tree.getDraftName(this.vs.getViewerId()));
    this.draftName.setValue(name, { emitEvent: false });
    this.before_name = name;

  }

  // renameDraft(name: string) {
  //   this.before_name = getDraftName(this.tree.getDraft(this.id));
  //   this.draftName.setValue(this.before_name, { emitEvent: false });
  // }

  private clearDraft() {
    //clear draft here
  }

  private loadDraft(id: number) {
    console.log("LOADING DRAFT, ID: ", id);


    const draft = this.tree.getDraft(id);
    if (draft == null) return;

    this.before_name = getDraftName(this.tree.getDraft(id));
    console.log("LOADING DRAFT, BEFORE NAME: ", this.before_name);
    this.draftName.setValue(this.before_name, { emitEvent: false });

    if (draft !== null) {
      this.warps = warps(draft.drawdown);
      this.wefts = wefts(draft.drawdown);
    }

    if (this.vis_mode != 'sim') {
      this.drawDraft()
        .then(() => {
          this.centerScrollbars();
        })
        .catch(console.error);
    } else this.sim.loadNewDraft(id);
  }

  /**
   * redraws the current draft, usually following an update from the drawdown
   */
  private redraw() {

    const draft = this.tree.getDraft(this.vs.getViewerId());

    this.draftName.setValue(getDraftName(draft), { emitEvent: false });

    if (draft !== null) {
      this.warps = warps(draft.drawdown);
      this.wefts = wefts(draft.drawdown);
    }

    if (this.vis_mode != 'sim') {
      this.drawDraft().then(() => {
        this.centerScrollbars()
      }).catch(console.error);
    } else this.sim.loadNewDraft(this.vs.getViewerId());

  }


  centerScrollbars() {
    // let div = document.getElementById('static_draft_view');
    // let rect = document.getElementById('viewer-scale-container').getBoundingClientRect();
    // div.scrollTop = div.scrollHeight/2;
    // div.scrollLeft = div.scrollWidth/2;
    // div.scrollTo({
    //   top: rect.height/2,
    //   left: rect.width/2
    // })
  }

  filenameChange() {
    this.ws.current_file.name = this.filename;
    this.fb.writeFileMetaData(this.ws.current_file);
  }


  viewAsSimulation() {
    this.vis_mode = 'sim';
    this.sim.loadNewDraft(this.vs.getViewerId());

  }

  viewAsDraft() {
    this.vis_mode = 'draft';
    this.redraw();
  }

  viewAsStructure() {
    this.vis_mode = 'structure';
    this.redraw();
  }

  viewAsColor() {
    this.vis_mode = 'color';
    this.redraw();
  }



  openEditor() {
    this.onOpenEditor.emit(this.vs.getViewerId());
  }

  /**
   * called when the pin button is pressed
   * if the viewer has a pin, it will clear the pin
   * otherwise, it will set the pin to the current viewer id
   */
  onTogglePinPressed() {
    if (this.vs.hasPin) {
      this.vs.clearPin();
    } else {
      this.vs.setPin(this.vs.getViewerId())
    }
  }


  clearView() {

    this.view_rendering.clearAll();
    //this.viewerForm.patchValue({ draftName: 'no draft selected' });
    this.warps = 0;
    this.wefts = 0;
  }

  saveAs(format: string) {
    this.onSave.emit(format);
  }

  //when expanded, someone can set the zoom from the main zoom bar
  //this is called, then, to rescale the view
  zoomChange() {

    this.scale = this.zs.getViewerZoom();
    this.view_rendering.scale = this.scale;
    this.view_rendering.rescale(this.scale);
    //TO DO re-enable this but figure out where it is being called from
    //this.drawDraft(this.id);
  }

  /**
   * draw whatever is stored in the draft object to the screen
   * @returns 
   */
  private drawDraft(): Promise<any> {


    const draft: Draft = this.tree.getDraft(this.vs.getViewerId());

    if (draft == null || draft == undefined) {
      this.clearView();
      return Promise.resolve(false);
    }


    let flags = {
      drawdown: true,
      use_colors: (this.vis_mode == 'color'),
      use_floats: (this.vis_mode !== 'draft'),
      show_loom: false
    }

    //console.log("REDRAW CALLED FROM VIEW RENDERING")
    return this.view_rendering.redraw(draft, null, null, flags).then(el => {
      return Promise.resolve(true);
    })



  }

}




