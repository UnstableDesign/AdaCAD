import { Component, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';

import { ScrollDispatcher } from '@angular/cdk/overlay';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatDivider } from '@angular/material/divider';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatLabel } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltip } from '@angular/material/tooltip';
import { LoomSettings } from 'adacad-drafting-lib';
import { createCell, Drawdown, getDraftName, warps, wefts } from 'adacad-drafting-lib/draft';
import { getLoomUtilByType } from 'adacad-drafting-lib/loom';
import { Subscription } from 'rxjs';
import { DraftNode, DraftNodeBroadcast, OpNode, RenderingFlags } from '../core/model/datatypes';
import { draft_pencil, paste_options } from '../core/model/defaults';
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
  imports: [MatAccordion, MatTabsModule, MatButtonModule, MatDivider, MatTooltip, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatLabel, MatButtonToggleGroup, MatButtonToggle, FormsModule, ReactiveFormsModule, LoomComponent, DraftRenderingComponent]
})
export class EditorComponent implements OnInit {
  private dialog = inject(MatDialog);
  private fs = inject(FileService);
  scroll = inject(ScrollDispatcher);
  ms = inject(MaterialsService);
  private ss = inject(SystemsService);
  private state = inject(StateService);
  private ws = inject(WorkspaceService);
  private tree = inject(TreeService);
  render = inject(RenderService);
  vs = inject(ViewerService);
  private zs = inject(ZoomService);


  @ViewChild(LoomComponent) loom: LoomComponent;
  @ViewChild(DraftRenderingComponent, { static: true }) weaveRef: DraftRenderingComponent;

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

  draw_modes: Array<{ value: string, viewValue: string, icon: string, id: number, color: string }> = [];

  current_view = 'draft';

  scale: number = 0;

  designActions: Array<any> = [];

  // Reactive Forms controls
  editingModeForm: FormControl; //edit from drawdown or loom
  pencilForm: FormControl;
  selectRegionsForm: FormControl;



  pencilMode: 'select' | 'draw' = 'select';
  pencilModeForm: FormControl;


  dressing_info: Array<{ label: string, value: string }> = [];

  onRedrawCompleteSubscription: Subscription;
  onLoad: boolean = false; // a flag used to call teh centering function after the first draw


  onDraftValueChangeSubscription: Subscription;

  onSelectionEventSubscription: Subscription;
  hasSelection: boolean = false;
  hasCopy: boolean = false;


  //subscribes to mouse events on the redering
  //this can be used to trigger mode. 
  draftRenderingEventSubscription: Subscription;


  eventTargetSetSubscription: Subscription;
  pencilChangeSubscription: Subscription;

  constructor() {



    this.copy = [[createCell(false)]];
    this.designActions = paste_options.map(opt => ({ value: opt.value, viewValue: opt.viewValue, icon: opt.icon, enabled: true }));
  }


  ngOnInit() {

    if (this.weaveRef != null) {
      this.weaveRef.setDraftEditSource('drawdown');
      this.weaveRef.setPencil('toggle');
    }

    // Initialize form controls
    this.editingModeForm = new FormControl('drawdown');
    this.pencilForm = new FormControl('toggle');


    /**
     * controls switching between the modes for reacting to UI via the sidebar
     */
    this.pencilModeForm = new FormControl('draw');
    this.pencilModeForm.valueChanges.subscribe(value => {
      if (value !== null && value !== undefined) {
        this.selectPencilMode(value);
      }
    });

    // Subscribe to editing mode changes
    this.editingModeForm.valueChanges.subscribe(value => {
      if (value !== null && value !== undefined && this.weaveRef) {
        this.weaveRef.setDraftEditSource(value);
        this.swapEditingStyleClicked();
      }
    });

    // Subscribe to pencil changes
    this.pencilForm.valueChanges.subscribe(value => {
      console.log("PENCIL FORM VALUE CHANGES", value);
      if (value !== null && value !== undefined) {
        this.selectPencil(value, 'ui');
      }
    });



  }

  ngAfterViewInit() {
    this.scale = this.zs.getEditorZoom();
    this.updatePencils();
    this.onRedrawCompleteSubscription = this.weaveRef.redrawComplete.subscribe(draft => {
      this.drawdownUpdated();
    });
    this.onSelectionEventSubscription = this.weaveRef.selection.selectionEventSubject.subscribe(event => {
      this.processSelectionEvent(event);
    });

    this.eventTargetSetSubscription = this.weaveRef.eventTargetSet$.subscribe(target => {

      this.eventTargetSet(target);
    });

    this.pencilChangeSubscription = this.weaveRef.pencilChange$.subscribe(pencil => {
      this.selectPencil(pencil, 'rendering');
    });
  }

  ngOnDestroy() {
    if (this.onRedrawCompleteSubscription) this.onRedrawCompleteSubscription.unsubscribe();
    if (this.onDraftValueChangeSubscription) this.onDraftValueChangeSubscription.unsubscribe();
    if (this.onSelectionEventSubscription) this.onSelectionEventSubscription.unsubscribe();
    if (this.eventTargetSetSubscription) this.eventTargetSetSubscription.unsubscribe();
    if (this.pencilChangeSubscription) this.pencilChangeSubscription.unsubscribe();
  }

  updatePencils() {
    this.draw_modes = draft_pencil
      .filter(mode => mode.value !== 'material')
      .map(mode => ({ value: mode.value, viewValue: mode.viewValue, icon: mode.icon, id: -1, color: '' }));

    this.ms.materials.forEach(material => {
      this.draw_modes.push({ value: 'material_' + material.id, viewValue: material.name, icon: "fas fa-paintbrush", id: material.id, color: material.color });
    });
  }

  eventTargetSet(target: HTMLElement) {
    if (target == null) return;
    if (target.id == null) return;
    const sourceArr = target.id.split('-');
    if (sourceArr.length == 0) return;
    const source = sourceArr[0];

    const loom_settings = this.tree.getLoomSettings(this.id);

    switch (source) {
      case 'drawdown':
        this.designActions.forEach(action => {
          action.enabled = true;
        });
        break;
      case 'threading':
        this.designActions.forEach(action => {

          if (action.value == 'invert') action.enabled = false;
          else action.enabled = true;
        });
        break;

      case 'tieups':
        this.designActions.forEach(action => {
          action.enabled = true;
        });
        break;
      case 'treadling':

        switch (loom_settings.type) {
          case 'direct':
            this.designActions.forEach(action => {
              action.enabled = true;
            });
            break;
          default:
            this.designActions.forEach(action => {
              if (action.value == 'invert') action.enabled = false;
              else action.enabled = true;
            });
            break;
        }
        break;

      case 'warp':
        this.designActions.forEach(action => {
          if (action.value == 'shift_up' || action.value == 'flip_x' || action.value == "invert") action.enabled = false;
          else action.enabled = true;
        });

        break;
      case 'weft':
        this.designActions.forEach(action => {
          if (action.value == 'shift_left' || action.value == 'flip_y' || action.value == "invert") action.enabled = false;
          else action.enabled = true;
        });

        break;
    }



  }


  /**
   * emitted from the selection component. 
   * @param event 
   */
  processSelectionEvent(event: 'none' | 'started' | 'dragging' | 'stopped' | 'copy') {
    switch (event) {
      case 'started':
      case 'dragging':
      case 'stopped':
        this.hasSelection = true;
        break;
      case 'none':
        this.hasSelection = false;
        this.hasCopy = this.weaveRef.selection.has_copy;
        break;
      case 'copy':
        this.hasCopy = true;
        break;
    }

  }

  designActionChange(action: string) {
    console.log("DESIGN ACTION CHANGE", action);
    this.weaveRef.selection.designActionChange(action);
  }


  copySelection() {
    if (this.hasSelection) this.weaveRef.selection.copyArea();
  }

  pasteSelection() {
    if (this.hasSelection && this.weaveRef.selection.has_copy) this.weaveRef.selection.onPaste('original');
  }

  /**
   * Updates the form controls when values change programmatically
   */
  updateFormControls(update: DraftNodeBroadcast): void {

    const type = update.loom_settings.type;

    switch (type) {
      case 'jacquard':
        this.editingModeForm.setValue('drawdown');
        this.editingModeForm.get('loom')?.disable({ emitEvent: false });
        break;
      default:
        this.editingModeForm.get('loom')?.enable({ emitEvent: false });
        break;
    }

    this.updateWeavingInfo();
  }



  updateWeavingInfo() {


    const loom = this.tree.getLoom(this.id);
    const draft = this.tree.getDraft(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);

    if (loom == null || draft == null || loom_settings == null) return;

    let utils = getLoomUtilByType(loom_settings.type);
    this.dressing_info = utils.getDressingInfo(draft.drawdown, loom, loom_settings);


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




  enableEdits() {
    this.createDraftCopy(this.id);
  }

  /**
   * called from "Add Draft" button
   */
  createNewDraft() {
    //copy over the loom settings
    const loom_settings = this.tree.getLoomSettings(this.id);
    const draft = this.tree.getDraft(this.id);
    const obj = {
      type: loom_settings.type,
      epi: loom_settings.epi,
      ppi: loom_settings.ppi,
      units: loom_settings.units,
      frames: loom_settings.frames,
      treadles: loom_settings.treadles,
      warps: warps(draft.drawdown),
      wefts: wefts(draft.drawdown),
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
    const draftNode = this.tree.getNode(id) as DraftNode;
    let ls = this.tree.getLoomSettings(id);

    this.setParentOp(id);
    if (this.parentOp !== '') this.weaveRef.view_only = true;
    else this.weaveRef.view_only = false;

    this.onLoad = true;
    this.weaveRef.onNewDraftLoaded(id); //this should load and draw everything in the renderer
    // Initialize design modes on the draft-rendering component
    this.loom.loadLoom(id); //loads the current loom information into the sidebar

    this.draftname = getDraftName(draft);

    if (this.onDraftValueChangeSubscription) this.onDraftValueChangeSubscription.unsubscribe();
    this.onDraftValueChangeSubscription = draftNode.onValueChange.subscribe(broadcast => {
      this.updateFormControls(broadcast);
    });





  }


  public onCloseDrawer() {
    this.weaveRef.unsetSelection();
  }


  public designModeChange(e: any) {
    this.weaveRef.unsetSelection();

  }


  public drawdownUpdated() {
    if (this.onLoad) {
      this.zoomToFit();
      this.onLoad = false;
      return;
    }
    console.log("DRAWDOWN UPDATED", this.id)

  }



  public forceRedraw() {
    console.log("FORCE REDRAW", this.id);
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
      show_loom: loom_settings.type !== 'jacquard'
    };

    //set a small timeout for the CSS to update
    setTimeout(() => {
      this.weaveRef.redraw(draft, loom, loom_settings, flags);
      this.weaveRef.redrawComplete.subscribe(draft => {
        this.drawdownUpdated();
      });
    }, 1000);
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



  /**
   * triggered VIA UI button click or key code, 
   * this is only a categorization used in the editor
   * @param mode 
   */
  selectPencilMode(mode: string) {


    switch (mode) {
      case 'select':
        this.pencilModeForm.setValue('select', { emitEvent: false });
        this.selectPencil('select', 'ui');
        break;
      case 'draw':
        this.pencilModeForm.setValue('draw', { emitEvent: false });
        this.selectPencil('toggle', 'ui');
        break;
    }

  }




  selectPencil(pencil: string, origin: string = 'ui') {

    switch (pencil) {

      case 'select':
        if (origin == 'ui') this.weaveRef.setPencil('select');
        this.pencilForm.setValue('select', { emitEvent: false });
        this.pencilModeForm.setValue('select', { emitEvent: false });
        break;

      case 'up':
      case 'down':
      case 'toggle':
      case 'unset':
        if (origin == 'ui') this.weaveRef.setPencil(pencil);
        this.pencilForm.setValue(pencil, { emitEvent: false });
        this.pencilModeForm.setValue('draw', { emitEvent: false });
        break;

      default:
        const split = pencil.split('_');
        const material_id = split[1];
        if (origin == 'ui') this.weaveRef.setPencil('material', parseInt(material_id));
        this.pencilForm.setValue('material_' + material_id, { emitEvent: false });
        this.pencilModeForm.setValue('draw', { emitEvent: false });
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

    const loom_settings = this.tree.getLoomSettings(this.id);

    console.log("SWAP EDITING STYLE CLICKED", loom_settings.type, this.weaveRef.draft_edit_source)
    if (loom_settings.type !== 'jacquard') {

      if (this.weaveRef.isSelectedDraftEditSource('drawdown')) {
        console.log("SELECTING DRAWDOWN")
        this.weaveRef.setDraftEditSource('drawdown');
      } else {
        console.log("SELECTING LOOM")
        this.weaveRef.setDraftEditSource('loom');
      }

    } else {
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
