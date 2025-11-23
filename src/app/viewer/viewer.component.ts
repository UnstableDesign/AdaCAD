import { Component, EventEmitter, inject, Output, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSidenav, MatSidenavContainer } from '@angular/material/sidenav';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { Draft, getDraftName, warps, wefts } from 'adacad-drafting-lib/draft';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../core/provider/firebase.service';
import { OperationService } from '../core/provider/operation.service';
import { StateService } from '../core/provider/state.service';
import { TreeService } from '../core/provider/tree.service';
import { ViewerService } from '../core/provider/viewer.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { ZoomService } from '../core/provider/zoom.service';
import { DraftRenderingComponent } from '../core/ui/draft-rendering/draft-rendering.component';
import { RenameComponent } from '../core/ui/rename/rename.component';
import { SimulationComponent } from './simulation/simulation.component';
@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss'],
  imports: [ReactiveFormsModule, MatIconButton, MatButtonToggleModule, MatExpansionModule, MatFormFieldModule, MatButton, MatTooltip, DraftRenderingComponent, SimulationComponent, MatToolbar, MatSlider, MatSliderThumb, MatInput, MatMiniFabButton, MatSidenavContainer, MatSidenav]
})
export class ViewerComponent {
  private tree = inject(TreeService);
  ws = inject(WorkspaceService);
  vs = inject(ViewerService);
  zs = inject(ZoomService);
  fb = inject(FirebaseService);
  ss = inject(StateService);
  ops = inject(OperationService);
  private dialog = inject(MatDialog);



  @Output() onOpenEditor: any = new EventEmitter();
  @Output() onDraftRename: any = new EventEmitter();
  @Output() onSave: any = new EventEmitter();
  @Output() onForceFocus: any = new EventEmitter();

  @ViewChild(SimulationComponent) sim;
  @ViewChild('view_rendering') view_rendering: DraftRenderingComponent;

  // Reactive form for viewer controls

  draft_canvas: HTMLCanvasElement;
  draft_name: string = '';
  draft_notes: string = '';
  draft_cx: any;
  pixel_ratio: number = 1;
  vis_mode: string = 'color'; //sim, draft, structure, color
  view_expanded: boolean = false;
  view_controls_visible: boolean = false;
  draft_rendering_visible: boolean = true;
  filename: string = '';
  zoomLevel: FormControl;
  visMode: FormControl;
  viewFace: FormControl;
  warps: number = 0;
  wefts: number = 0;
  scale: number = 0;
  before_name: string = '';
  before_notes: string = '';
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

    this.viewFace = new FormControl('front');
    this.zoomLevel = new FormControl(0);
    this.visMode = new FormControl('color');



  }

  ngOnDestroy() {
    this.idChangeSubscription.unsubscribe();
    this.updateViewerSubscription.unsubscribe();
  }

  ngOnInit() {


    this.viewFace.valueChanges.subscribe(value => {
      if (value !== null && value !== undefined) {
        this.swapViewFace(value);
      }
    });


    this.zoomLevel.valueChanges.subscribe(value => {
      if (value !== null && value !== undefined) {
        this.zs.setZoomIndexOnViewer(value);
        this.zoomChange();
      }
    });

    this.visMode.valueChanges.subscribe(value => {
      if (value !== null && value !== undefined) {
        this.vis_mode = value;
        if (this.vis_mode === 'sim' && this.sim) {
          this.sim.loadNewDraft(this.vs.getViewerId());
        } else {
          this.redraw();
        }
      }
    });


    // this.filename = this.ws.current_file.name;
    this.scale = this.zs.getViewerZoom();

  }

  swapViewFace(face: string) {
    console.log("SWAPPING VIEW FACE TO: ", face);
    this.drawDraft(face == 'front').then(() => {
      this.centerScrollbars();
    }).catch(console.error);
  }

  toggleViewControls() {
    this.view_controls_visible = !this.view_controls_visible;
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



  updateDraftNameFromMixerEvent(name: string) {
    console.log("UPDATING DRAFT NAME FROM MIXER EVENT: ", name, this.tree.getDraftName(this.vs.getViewerId()));
    this.draft_name = name;
    this.before_name = name;

  }

  updateDraftNotesFromMixerEvent(notes: string) {
    this.draft_notes = notes;
    this.before_notes = notes;

  }


  private clearDraft() {
    //clear draft here
  }

  private loadDraft(id: number) {
    console.log("LOADING DRAFT, ID: ", id);

    // Hide draft rendering when loading new draft
    this.draft_rendering_visible = false;

    const draft = this.tree.getDraft(id);
    if (draft == null) return;

    this.before_name = getDraftName(this.tree.getDraft(id));
    this.before_notes = this.tree.getDraftNotes(id);
    console.log("LOADING DRAFT, BEFORE NAME: ", this.before_name);
    this.draft_name = this.before_name;
    this.draft_notes = this.before_notes;
    this.visMode.setValue(this.vis_mode, { emitEvent: false });

    if (draft !== null) {
      this.warps = warps(draft.drawdown);
      this.wefts = wefts(draft.drawdown);
    }

    if (this.vis_mode != 'sim') {
      this.drawDraft(this.viewFace.value == 'front')
        .then(() => {
          this.centerScrollbars();
        })
        .catch(console.error);
    } else {
      this.draft_rendering_visible = true; // Show immediately for sim mode
      this.sim.loadNewDraft(id);
    }
  }

  public renderChange() {
    this.redraw();
  }

  /**
   * redraws the current draft, usually following an update from the drawdown
   */
  private redraw() {
    // Hide draft rendering when redrawing
    if (this.vis_mode != 'sim') {
      this.draft_rendering_visible = false;
    }

    const draft = this.tree.getDraft(this.vs.getViewerId());

    this.draft_name = getDraftName(draft);

    if (draft !== null) {
      this.warps = warps(draft.drawdown);
      this.wefts = wefts(draft.drawdown);
    }

    if (this.vis_mode != 'sim') {
      this.drawDraft(this.viewFace.value == 'front').then(() => {
        this.centerScrollbars()
      }).catch(console.error);
    } else {
      this.draft_rendering_visible = true; // Show immediately for sim mode
      this.sim.loadNewDraft(this.vs.getViewerId());
    }

  }


  centerScrollbars() {
    // Skip if no draft is selected or in simulation mode
    if (this.vs.getViewerId() === -1 || this.vis_mode === 'sim') {
      return;
    }

    // Hide draft rendering until zoom is calculated
    this.draft_rendering_visible = false;

    // Use a recursive function to wait for elements to be ready
    const attemptCenter = (attempts: number = 0) => {
      const maxAttempts = 50; // Try for up to 5 seconds (50 * 100ms)

      // Get the container and draft rendering elements
      const container = document.getElementById('viewer-scale-container');
      const draftId = this.vs.getViewerId();
      const draftContainer = document.getElementById(`draft-scale-container-viewer-${draftId}`);

      if (!container || !draftContainer) {
        if (attempts < maxAttempts) {
          setTimeout(() => {
            attemptCenter(attempts + 1);
          }, 100);
        } else {
          // Show draft rendering even if we couldn't calculate zoom
          this.draft_rendering_visible = true;
        }
        return;
      }

      // Get container dimensions
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Get the canvas element to get its actual dimensions (not scaled)
      const canvas = document.getElementById(`drawdown-viewer-${draftId}`) as HTMLCanvasElement;

      if (!canvas) {
        if (attempts < maxAttempts) {
          setTimeout(() => {
            attemptCenter(attempts + 1);
          }, 100);
        }
        return;
      }

      // Get the actual canvas dimensions (width and height properties, not CSS dimensions)
      const baseDraftWidth = canvas.width;
      const baseDraftHeight = canvas.height;

      // Check if dimensions are valid (greater than 0)
      if (containerWidth === 0 || containerHeight === 0 || baseDraftWidth === 0 || baseDraftHeight === 0) {
        if (attempts < maxAttempts) {
          setTimeout(() => {
            attemptCenter(attempts + 1);
          }, 100);
        } else {
          // Show draft rendering even if we couldn't calculate zoom
          this.draft_rendering_visible = true;
        }
        return;
      }

      // Get current zoom
      const currentZoomIndex = this.zoomLevel.value;
      const currentZoom = this.zs.zoom_table[currentZoomIndex];
      const minZoom = this.zs.getZoomMin();

      // Calculate zoom factors needed to fit
      const widthFactor = containerWidth / baseDraftWidth;
      const heightFactor = containerHeight / baseDraftHeight;
      const fitZoom = Math.min(widthFactor, heightFactor);

      // Find the largest zoom index that still fits
      let bestZoomIndex = 0;

      // Access zoom_table through the service (it's a public array)
      const zoomTable = (this.zs as any).zoom_table;

      if (zoomTable && zoomTable.length > 0) {
        for (let i = 0; i < zoomTable.length; i++) {
          const zoomValue = zoomTable[i];
          const scaledWidth = baseDraftWidth * zoomValue;
          const scaledHeight = baseDraftHeight * zoomValue;

          // Check if this zoom fits within the container
          if (scaledWidth <= containerWidth && scaledHeight <= containerHeight) {
            bestZoomIndex = i;
          } else {
            // Once we exceed, stop
            break;
          }
        }
      }

      // Set the zoom if it's different from current
      if (bestZoomIndex !== currentZoomIndex) {
        this.zs.setZoomIndexOnViewer(bestZoomIndex);
        this.zoomLevel.setValue(bestZoomIndex, { emitEvent: false });
        this.zoomChange();
        // Show draft rendering after zoom change is applied
        setTimeout(() => {
          this.draft_rendering_visible = true;
        }, 50);
      } else {
        // Show draft rendering immediately if zoom didn't change
        this.draft_rendering_visible = true;
      }
    };

    // Start the attempt with a small delay to let the DOM update
    requestAnimationFrame(() => {
      setTimeout(() => {
        attemptCenter(0);
      }, 50);
    });
  }

  filenameChange() {
    this.ws.setCurrentFileName(this.filename);
    //check for connection?
  }


  viewAsSimulation() {
    this.visMode.setValue('sim');
  }

  viewAsDraft() {
    this.visMode.setValue('draft');
  }

  viewAsStructure() {
    this.visMode.setValue('structure');
  }

  viewAsColor() {
    this.visMode.setValue('color');
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

  openNameChangeDialog() {

    const dialogRef = this.dialog.open(RenameComponent, {
      data: { id: this.vs.getViewerId() }
    });

    dialogRef.afterClosed().subscribe(obj => {


      this.draft_name = this.tree.getDraftName(this.vs.getViewerId());
      this.onDraftRename.emit(this.vs.getViewerId());
    });


    this.onDraftRename.emit(this.vs.getViewerId());


  }


  clearView() {

    if (this.view_rendering !== undefined) this.view_rendering.clearAll();
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
    const out_format = (!this.getVisVariables().floats && !this.getVisVariables().use_colors) ? 'canvas' : 'array_buffer';
    this.view_rendering.rescale(this.scale, out_format);
    //TO DO re-enable this but figure out where it is being called from
    //this.drawDraft(this.id);
  }

  /**
   * draw whatever is stored in the draft object to the screen
   * @returns 
   */
  private drawDraft(front: boolean = true): Promise<any> {


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

    //if we are looking at the back face, invert and flip the draft
    if (!front) {
      const invert_op = this.ops.getOp('invert');
      const params = [];
      const drafts = [{
        drafts: [draft],
        inlet_id: 0,
        inlet_params: []
      }]

      return invert_op.perform(params, drafts).then(manipulated_draft => {
        const dd = manipulated_draft[0].draft;
        const flip_op = this.ops.getOp('flip');
        const flip_params = [{
          param: flip_op.params[0],
          val: 1
        },
        {
          param: flip_op.params[1],
          val: 0
        },];
        const flip_drafts = [{
          drafts: [dd],
          inlet_id: 0,
          inlet_params: []
        }]

        return flip_op.perform(flip_params, flip_drafts)
      }).then(manipulated_draft => {
        const dd = manipulated_draft[0].draft;

        return this.view_rendering.redraw(dd, null, null, flags).then(el => {
          return Promise.resolve(true);
        })
      });


    } else {
      //console.log("REDRAW CALLED FROM VIEW RENDERING")
      return this.view_rendering.redraw(draft, null, null, flags).then(el => {
        return Promise.resolve(true);
      })
    }





  }

}




