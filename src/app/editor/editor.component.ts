import { Component, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';

import { ScrollDispatcher } from '@angular/cdk/overlay';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatLabel } from '@angular/material/form-field';
import { MatTooltip } from '@angular/material/tooltip';
import { LoomSettings } from 'adacad-drafting-lib';
import { createCell, Drawdown, getDraftName } from 'adacad-drafting-lib/draft';
import { getLoomUtilByType } from 'adacad-drafting-lib/loom';
import { Subscription } from 'rxjs';
import { OpNode, RenderingFlags } from '../core/model/datatypes';
import { draft_pencil } from '../core/model/defaults';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { FileService } from '../core/provider/file.service';
import { MaterialsService } from '../core/provider/materials.service';
import { RenderService } from '../core/provider/render.service';
import { StateService } from '../core/provider/state.service';
import { SystemsService } from '../core/provider/systems.service';
import { TreeService } from '../core/provider/tree.service';
import { ViewerService } from '../core/provider/viewer.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { ZoomService } from '../core/provider/zoom.service';
import { DraftRenderingComponent } from '../core/ui/draft-rendering/draft-rendering.component';
import { LoomComponent } from './loom/loom.component';
import { RepeatsComponent } from './repeats/repeats.component';



@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  imports: [MatAccordion, MatButtonModule, MatTooltip, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatLabel, MatButtonToggleGroup, MatButtonToggle, FormsModule, ReactiveFormsModule, LoomComponent, DraftRenderingComponent]
})
export class EditorComponent implements OnInit {
  private dialog = inject(MatDialog);
  private fs = inject(FileService);
  dm = inject(DesignmodesService);
  scroll = inject(ScrollDispatcher);
  ms = inject(MaterialsService);
  private ss = inject(SystemsService);
  private state = inject(StateService);
  private ws = inject(WorkspaceService);
  private tree = inject(TreeService);
  render = inject(RenderService);
  vs = inject(ViewerService);
  private zs = inject(ZoomService);



  @ViewChild(DraftRenderingComponent, { static: true }) weaveRef: DraftRenderingComponent;
  @ViewChild(LoomComponent) loom;

  @Input() hasFocus: boolean;
  @Output() saveChanges: any = new EventEmitter();
  @Output() updateMixer: any = new EventEmitter();
  @Output() cloneDraft: any = new EventEmitter();
  @Output() createDraft: any = new EventEmitter();;
  @Output() onEditMaterials: any = new EventEmitter();

  id: number = -1;

  parentOp: string = '';

  actions_modal: MatDialogRef<RepeatsComponent, any>;

  copy: Drawdown;

  selected;

  collapsed: boolean = false;

  dims: any;

  draftelement: any;

  draftname: string = "";

  scrollingSubscription: any;

  warp_locked: boolean = false;

  viewer_expanded: boolean = false;

  draw_modes: Array<{ value: string, viewValue: string, icon: string, id: number, color: string }> = [];

  selected_material_id: any = -1;

  current_view = 'draft';

  scale: number = 0;

  pencil: string;

  // Reactive Forms controls
  editingModeForm: FormControl; //edit from drawdown or loom
  pencilForm: FormControl;

  dressing_info: Array<{ label: string, value: string }> = [];

  onRedrawCompleteSubscription: Subscription;
  onLoad: boolean = false; // a flag used to call teh centering function after the first draw


  constructor() {



    this.copy = [[createCell(false)]];

  }


  ngOnInit() {

    this.pencil = "toggle";
    this.dm.cur_draft_edit_source = 'drawdown';

    // Initialize form controls
    this.editingModeForm = new FormControl(this.dm.cur_draft_edit_source);
    this.pencilForm = new FormControl(this.pencil);

    // Subscribe to editing mode changes
    this.editingModeForm.valueChanges.subscribe(value => {
      if (value !== null && value !== undefined) {
        this.dm.cur_draft_edit_source = value;
        this.swapEditingStyleClicked();
      }
    });

    // Subscribe to pencil changes
    this.pencilForm.valueChanges.subscribe(value => {
      if (value !== null && value !== undefined) {
        this.pencil = value;
        if (value.startsWith('material_')) {
          this.selected_material_id = value.split('_')[1];
        } else {
          this.selected_material_id = -1;
        }
        this.selectPencil();
      }
    });

  }

  ngAfterViewInit() {
    this.scale = this.zs.getEditorZoom();
    this.updatePencils();
    this.onRedrawCompleteSubscription = this.weaveRef.redrawComplete.subscribe(draft => {
      this.drawdownUpdated();
    });
  }

  ngOnDestroy() {
    if (this.onRedrawCompleteSubscription) this.onRedrawCompleteSubscription.unsubscribe();
  }

  updatePencils() {
    this.draw_modes = draft_pencil
      .filter(mode => mode.value !== 'material')
      .map(mode => ({ value: mode.value, viewValue: mode.viewValue, icon: mode.icon, id: -1, color: '' }));

    this.ms.materials.forEach(material => {
      this.draw_modes.push({ value: 'material_' + material.id, viewValue: material.name, icon: "fas fa-paintbrush", id: material.id, color: material.color });
    });
  }

  /**
   * Updates the form controls when values change programmatically
   */
  updateFormControls(): void {
    if (this.editingModeForm) {
      this.editingModeForm.setValue(this.dm.cur_draft_edit_source, { emitEvent: false });
    }
    if (this.pencilForm) {
      this.pencilForm.setValue(this.pencil, { emitEvent: false });
    }
  }



  updateWeavingInfo() {


    const loom = this.tree.getLoom(this.id);
    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    if (loom == null || draft == null || loom_settings == null) return;

    let utils = getLoomUtilByType(loom_settings.type);
    this.dressing_info = utils.getDressingInfo(draft.drawdown, loom, loom_settings);


  }


  selectRegions() {
    this.weaveRef.unsetSelection();
    this.dm.selectDraftEditingMode('select');
    this.weaveRef.setDraftEditMode('select');
  }

  editMaterials() {
    //swap editing mode to library and scroll down to materials section
    this.onEditMaterials.emit();
  }


  clearSelection() {
    this.weaveRef.unsetSelection();
  }



  clearAll() {
    // console.log("Clearing Detail Viewer ");
    this.id == -1;
    this.weaveRef.id == -1;
    this.weaveRef.clearAll();
  }


  expandViewer() {
    this.viewer_expanded = !this.viewer_expanded;
  }

  enableEdits() {
    this.createDraftCopy(this.id);
    this.loom.redrawPanel();
  }

  /**
   * called from "Add Draft" button
   */
  createNewDraft() {
    //copy over the loom settings
    const obj = {
      type: this.loom.getValue('loomtype'),
      epi: this.loom.getValue('epi'),
      ppi: this.loom.getValue('ppi'),
      units: this.loom.getValue('units'),
      frames: this.loom.getValue('frames'),
      treadles: this.loom.getValue('treadles'),
      warps: this.loom.getValue('warps'),
      wefts: this.loom.getValue('wefts'),
      origin: 'newdraft'
    }

    this.createDraft.emit(obj);
  }

  /**
   * copies an uneditable draft into a new node that is able to be edited. 
   * @param id 
   */
  createDraftCopy(id: number) {

    //copy over the loom settings
    const old_loom_settings: LoomSettings = this.tree.getLoomSettings(id);
    const loom_settings = {
      type: old_loom_settings.type,
      epi: old_loom_settings.epi,
      units: old_loom_settings.units,
      frames: old_loom_settings.frames,
      treadles: old_loom_settings.treadles
    }

    let loom = this.tree.getLoom(id);
    let draft = this.tree.getDraft(id);
    this.cloneDraft.emit({ draft, loom, loom_settings });
  }


  /**
  * placholder for any code we need to run when we focus on this view
  */
  onFocus(id: number) {
    console.log("ON FOCUS ", id)
    this.loadDraft(id);


  }

  onClose() {
    // this.id = -1;
    // this.weaveRef.id == -1;
  }



  clearDraft() {
    this.id = -1;
  }

  setParentOp(id: number) {
    const hasParent = this.tree.hasParent(id);
    if (!hasParent) this.parentOp = '';
    else {
      let pid = this.tree.getSubdraftParent(id);
      let opNode: OpNode = this.tree.getOpNode(pid);
      this.parentOp = opNode.name;
    }

  }





  /**
  * given an id, it proceeds to load the draft and loom associated with that id. 
  * onLoad, this should default to the settings associated with this draft node. All draft nodes should have 
  */
  loadDraft(id: number) {

    if (id == -1) return;

    this.id = id;
    const draft = this.tree.getDraft(id);
    const loom = this.tree.getLoom(id);
    let ls = this.tree.getLoomSettings(id);

    this.loom.loadLoom(id); //loads the current loom information into the sidebar
    this.setParentOp(id);
    if (this.parentOp !== '') this.weaveRef.view_only = true;
    else this.weaveRef.view_only = false;

    this.onLoad = true;
    this.weaveRef.onNewDraftLoaded(id); //this should load and draw everything in the renderer


    this.draftname = getDraftName(draft);
    this.updateWeavingInfo();

    const loom_fns = [];

    switch (ls.type) {
      case 'jacquard':
        this.dm.selectDraftEditSource('drawdown');
        this.weaveRef.setDraftEditSource('drawdown');
        break;
      case 'direct':
      case 'frame':
        this.dm.selectDraftEditSource('loom');
        this.weaveRef.setDraftEditSource('loom');
        const utils = getLoomUtilByType(ls.type);
        utils.computeLoomFromDrawdown(draft.drawdown, ls).then(loom => {
          this.tree.setLoom(id, loom); //this would trigger a subsequent update. 
          this.onLoad = true; //reset this flag so the draw updates
        });
        break;
      default:
        this.dm.selectDraftEditSource('drawdown');
        this.weaveRef.setDraftEditSource('drawdown');
    }




  }

  updateLoom() {
    this.loom.refreshLoom();
  }





  public onCloseDrawer() {
    this.weaveRef.unsetSelection();
  }


  public designModeChange(e: any) {
    this.weaveRef.unsetSelection();

  }

  // public materialChange() {
  //   this.saveChanges.emit();
  //   this.forceRedraw()

  // }



  public drawdownUpdated() {
    if (this.onLoad) {
      this.zoomToFit();
      this.onLoad = false;
      return;
    }
    console.log("DRAWDOWN UPDATED", this.id)

  }



  // addTimelineState(){

  //   this.fs.saver.ada()
  //   .then(so => {
  //     this.state.addMixerHistoryState(so);
  //   });
  // }


  public forceRedraw() {
    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);
    const flags: RenderingFlags = {
      u_drawdown: true,
      u_threading: true,
      u_tieups: true,
      u_treadling: true,
      u_warp_sys: true,
      u_warp_mats: true,
      u_weft_sys: true,
      u_weft_mats: true,
      use_colors: false,
      use_floats: false,
      show_loom: this.loom.getValue('loomtype') !== 'jacquard'
    };
    this.weaveRef.redraw(draft, loom, loom_settings, flags);
    this.weaveRef.redrawComplete.subscribe(draft => {
      this.drawdownUpdated();
    });
  }

  public loomSettingsUpdated() {


    if (this.id == -1) return;



    const draft = this.tree.getDraft(this.id);
    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    console.log("LOOM SETTINGS UPDATED", loom_settings.units)


    this.loom.type = loom_settings.type;
    this.loom.units = loom_settings.units;

    if (loom_settings.type === 'jacquard') {
      this.dm.selectDraftEditSource('drawdown');
      this.weaveRef.setDraftEditSource('drawdown');
    }

    this.forceRedraw(); //should just be called from the loom update
    this.updateWeavingInfo();
    this.saveChanges.emit();

  }




  unsetSelection() {
    this.weaveRef.unsetSelection();
  }



  // public redrawSimulation(){
  //   this.redrawViewer.emit();

  // }






  public onScroll() {
  }

  /**
  * Weave reference masks pattern over selected area.
  * @extends WeaveComponent
  * @param {Event} e - mask event from design component.
  * @returns {void}
  */
  public onMask(e) {
    // console.log(e);
    // var p = this.draft.patterns[e.id].pattern;
    // this.weaveRef.maskArea(p);
    // this.redraw();
  }







  /// PUBLIC FUNCTIONS
  /**
  * 
  * @extends WeaveComponent
  * @returns {void}
  */
  public print(e) {
    console.log(e);
  }





  // }



  public updateSelection(e: any) {
    if (!this.weaveRef.hasSelection()) return;
    if (e.copy !== undefined) this.copy = e;
    // if(e.id !== undefined) this.simRef.updateSelection(e.start, e.end);
  }






  public toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }


  /**
  *
  * tranfers on save from header to draft viewer
  */
  // public onSave(e: any) {
  //   this.weaveRef.onSave(e);
  // }



  // drawModeChange(name: string) {
  //   this.dm.selectDraftEditingMode('draw');
  //   this.dm.selectPencil(name);
  //   this.weaveRef.unsetSelection();
  // }

  openActions() {
    if (this.actions_modal != undefined && this.actions_modal.componentInstance != null) return;

    this.actions_modal = this.dialog.open(RepeatsComponent,
      {
        disableClose: true,
        maxWidth: 350,
        hasBackdrop: false,
        data: { id: this.id }
      });


    this.actions_modal.componentInstance.onUpdateWarpShuttles.subscribe(event => { if (this.id !== -1) this.weaveRef.updateWarpShuttles(event) });
    this.actions_modal.componentInstance.onUpdateWarpSystems.subscribe(event => { if (this.id !== -1) this.weaveRef.updateWarpSystems(event) });
    this.actions_modal.componentInstance.onUpdateWeftShuttles.subscribe(event => { if (this.id !== -1) this.weaveRef.updateWeftShuttles(event) });
    this.actions_modal.componentInstance.onUpdateWeftSystems.subscribe(event => { if (this.id !== -1) this.weaveRef.updateWeftSystems(event) });


  }

  selectPencil() {
    console.log("SELECT PENCIL CALLED", this.pencil)
    this.weaveRef.unsetSelection();

    switch (this.pencil) {

      case 'select':
        this.dm.selectDraftEditingMode('select');
        this.weaveRef.setDraftEditMode('select');
        break;

      case 'up':
      case 'down':
      case 'toggle':
      case 'unset':
        this.dm.selectDraftEditingMode('draw');
        this.dm.selectPencil(this.pencil);
        this.weaveRef.setDraftEditMode('draw');
        this.weaveRef.setPencil(this.pencil);
        break;

      default:
        this.dm.selectDraftEditingMode('draw');
        this.dm.selectPencil('material');
        const split = this.pencil.split('_');
        const material_id = split[1];
        this.selected_material_id = parseInt(material_id);
        this.weaveRef.selected_material_id = parseInt(material_id);
        this.weaveRef.setPencil('material');
        this.weaveRef.setDraftEditMode('draw');
        break;

    }

  }




  /**
   * when a change of scale is  made to the editor, we do not change the scale of teh underlying component. We just set that to 1 (max) and we scale the local container here. 
   */
  renderChange() {
    this.scale = this.zs.getEditorZoom();
    const container: HTMLElement = document.getElementById('editor-scale-container');
    container.style.transform = 'scale(' + this.scale + ')';
    container.style.transformOrigin = 'left top';

  }





  swapEditingStyleClicked() {
    if (this.id == -1) return;

    console.log("SWAP EDITING STYLE CLICKED", this.loom.getValue('loomtype'), this.dm.cur_draft_edit_source)
    if (this.loom.getValue('loomtype') !== 'jacquard') {

      if (this.dm.cur_draft_edit_source == 'drawdown') {
        console.log("SELECTING DRAWDOWN")
        this.weaveRef.setDraftEditSource('drawdown');
      } else {
        console.log("SELECTING LOOM")
        this.weaveRef.setDraftEditSource('loom');
      }

    } else {
      this.dm.selectDraftEditSource('drawdown');
      this.weaveRef.setDraftEditSource('drawdown');
    }

  }

  /**
   * Adjusts the scale of the rendering such that the entire view is visible and as large as possible
   */
  zoomToFit() {
    // Skip if no draft is selected
    console.log("ZOOMING TO FIT EDITOR", this.id);
    if (this.id === -1) {
      return;
    }

    // Use a recursive function to wait for elements to be ready
    const attemptZoomToFit = (attempts: number = 0) => {
      const maxAttempts = 50; // Try for up to 5 seconds (50 * 100ms)

      // Get the container and canvas elements
      const container = document.getElementById('editor-draft-container');
      const rendering = document.getElementById(`editor_draft_rendering`);
      const drawdownCanvas = document.getElementById(`drawdown-editor-${this.id}`) as HTMLCanvasElement;
      const threadingCanvas = document.getElementById(`threading-editor-${this.id}`) as HTMLCanvasElement;
      const treadlingCanvas = document.getElementById(`treadling-editor-${this.id}`) as HTMLCanvasElement;



      if (!container || !rendering) {
        if (attempts < maxAttempts) {
          setTimeout(() => {
            attemptZoomToFit(attempts + 1);
          }, 100);
        }
        return;
      }

      // Get container dimensions
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;


      // Get the actual canvas dimensions (width and height properties, not CSS dimensions)
      const renderingRect = rendering.getBoundingClientRect();
      const baseDraftWidth = renderingRect.width;
      const baseDraftHeight = renderingRect.height;


      // Check if dimensions are valid (greater than 0)
      if (containerWidth === 0 || containerHeight === 0 || baseDraftWidth === 0 || baseDraftHeight === 0) {
        if (attempts < maxAttempts) {
          setTimeout(() => {
            attemptZoomToFit(attempts + 1);
          }, 100);
        }
        return;
      }

      // Calculate zoom factors needed to fit
      const widthFactor = containerWidth / (drawdownCanvas.width + treadlingCanvas.width);
      const heightFactor = containerHeight / (drawdownCanvas.height + threadingCanvas.height);
      const fitZoom = Math.min(widthFactor, heightFactor);
      this.zs.setEditorIndexFromZoomValue(fitZoom);
      this.renderChange();
    };

    // Start the attempt with a small delay to let the DOM update
    requestAnimationFrame(() => {
      setTimeout(() => {
        attemptZoomToFit(0);
      }, 50);
    });
  }




}
