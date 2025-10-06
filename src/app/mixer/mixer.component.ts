import { AsyncPipe } from '@angular/common';
import { Component, enableProdMode, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltip, MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { Draft, initDraftWithParams, initLoom, OperationClassification } from 'adacad-drafting-lib';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DraftExistenceChange, DraftNodeProxy, NodeComponentProxy, NoteStateChange, OpExistenceChanged, Point } from '../core/model/datatypes';
import { defaults } from '../core/model/defaults';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { FileService } from '../core/provider/file.service';
import { NotesService } from '../core/provider/notes.service';
import { OperationService } from '../core/provider/operation.service';
import { StateService } from '../core/provider/state.service';
import { TreeService } from '../core/provider/tree.service';
import { ViewerService } from '../core/provider/viewer.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { ZoomService } from '../core/provider/zoom.service';
import { BlankdraftModal } from '../core/ui/blankdraft/blankdraft.modal';
import { NoteComponent } from './palette/note/note.component';
import { PaletteComponent } from './palette/palette.component';
import { SubdraftComponent } from './palette/subdraft/subdraft.component';
import { MultiselectService } from './provider/multiselect.service';
import { ViewportService } from './provider/viewport.service';

//disables some angular checking mechanisms
enableProdMode();




/** Custom options the configure the tooltip's default show/hide delays. */
export const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 1000,
  touchendHideDelay: 1000,
  position: 'right',
  disableTooltipInteractivity: true,

};


@Component({
  selector: 'app-mixer',
  templateUrl: './mixer.component.html',
  styleUrls: ['./mixer.component.scss'],
  providers: [{ provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults }],
  imports: [MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatButton, MatTooltip, MatFormField, MatLabel, MatInput, FormsModule, ReactiveFormsModule, MatSlideToggle, PaletteComponent, AsyncPipe]
})
export class MixerComponent {
  dm = inject(DesignmodesService);
  private tree = inject(TreeService);
  private fs = inject(FileService);
  ws = inject(WorkspaceService);
  vp = inject(ViewportService);
  private notes = inject(NotesService);
  private dialog = inject(MatDialog);
  ops = inject(OperationService);
  private vs = inject(ViewerService);
  private ss = inject(StateService);
  zs = inject(ZoomService);
  private multiselect = inject(MultiselectService);



  @ViewChild(PaletteComponent) palette: PaletteComponent;

  @Input() is_fullscreen: boolean;
  @Output() onOpenInEditor: any = new EventEmitter();


  origin_options: any = null;
  loading: boolean = false;
  manual_scroll: boolean = false;
  scrollingSubscription: any;
  selected_nodes_copy: any = null;


  /** variables for operation search */

  classifications: Array<OperationClassification> = [];
  op_tree: any = [];
  filteredOptions: Observable<any>;
  searchForm: FormControl;
  search_error: any;

  /// ANGULAR FUNCTIONS
  /**
   * @constructor
   * ps - pattern service (variable name is initials). Subscribes to the patterns and used
   * to get and update stitches.
   * dialog - Anglar Material dialog module. Used to control the popup modals.
   */
  constructor() {

    this.searchForm = new FormControl();

    this.classifications = this.ops.getOpClassifications();

    this.vp.setAbsolute(defaults.mixer_canvas_width, defaults.mixer_canvas_height); //max size of canvas, evenly divisible by default cell size

    this.op_tree = this.makeOperationsList();
  }


  ngOnInit() {

    this.filteredOptions = this.searchForm.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  operationLevelToggleChange(event: any) {
    this.ws.show_advanced_operations = event.checked;
    this.refreshOperations();

  }

  refreshOperations() {

    this.op_tree = this.makeOperationsList();
    this.filteredOptions = this.searchForm.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  makeOperationsList() {

    function alphabetical(a, b) {
      if (a.display_name < b.display_name) {
        return -1;
      }
      if (a.display_name > b.display_name) {
        return 1;
      }
      return 0;
    }


    const op_list = this.classifications.map(classification => {
      return {
        class_name: classification.category_name,
        color: classification.color,
        ops: classification.op_names
          .map(op => { return { name: op, display_name: this.ops.getDisplayName(op), advanced: this.ops.idAdvanced(op) } })
          .filter(op => {
            if (this.ws.show_advanced_operations) {
              return true;
            } else {
              return op.advanced === false;
            }
          })
      }
    });


    op_list.forEach(el => {
      el.ops.sort(alphabetical);
    })

    return op_list;



  }


  /**
   * adds the first of the filtered list of operations to the workspace
   */
  public enter() {


    const value = this.searchForm.value.toLowerCase();

    //run the filter function again without the classification titles
    let tree = this.op_tree.reduce((acc, classification) => {
      return acc.concat(classification.ops
        .filter(option => option.display_name.toLowerCase().includes(value)));
    }, []);

    if (tree.length > 0) this.addOperation(tree[0].name);

    this.searchForm.setValue('');


  }


  private _filter(value: string): any[] {

    const filterValue = value.toLowerCase();

    let tree = this.op_tree.map(classification => {
      return {
        class_name: classification.class_name,
        color: classification.color,
        ops: classification.ops
          .filter(option => option.display_name.toLowerCase().includes(filterValue))
      }
    });

    tree = tree.filter(classification => classification.ops.length > 0);

    if (tree.length == 0) {
      this.search_error = "no operations match this search"
    } else {
      this.search_error = '';
    }

    return tree;



  }

  setScroll(delta: any) {
    this.palette.handleScroll(delta);
    this.manual_scroll = true;
    //this.view_tool.updateViewPort(data);
  }



  /**
   * called when an operation is selected manually from the list on the sidebar on on ENTER in the search window
   * @param name 
   */
  addOperation(name: string) {

    let id = this.palette.addOperation(name);
    this.searchForm.setValue('');
    const outputs = this.tree.getNonCxnOutputs(id);
    if (outputs.length > 0) this.vs.setViewer(outputs[0]);

    const change: OpExistenceChanged = {
      originator: 'OP',
      type: 'CREATED',
      node: this.tree.getNode(id),
      inputs: this.tree.getInwardConnectionProxies(id),
      outputs: this.tree.getOutwardConnectionProxies(id)
    }
    this.ss.addStateChange(change);
  }



  onRefreshViewer() {
    this.vs.updateViewer();
  }


  performAndUpdateDownstream(obj_id: number) {
    this.palette.performAndUpdateDownstream(obj_id);
  }


  // addOp(event: any) {
  //   this.palette.addOperation(event)
  // }

  /**
   * called when add new draft is clicked form the sidebar. 
   */
  addDraftClicked() {
    console.log("ADD DRAFT CLICKED ", this.tree.nodes.slice());


    const dialogRef = this.dialog.open(BlankdraftModal);

    dialogRef.componentInstance.onNewDraftCreated.subscribe(obj => {
      console.log("Dialog Ref Component Listerned creating draft", this.tree.nodes.slice());

      console.log("OBJ", obj)
      if (obj == null || obj == undefined) return;



      const draft = initDraftWithParams({ warps: obj.warps, wefts: obj.wefts });
      const loom = initLoom(obj.warps, obj.wefts, this.ws.min_frames, this.ws.min_treadles);
      const loom_settings = this.ws.getWorkspaceLoomSettings();

      this.palette.createSubDraft(draft, loom, loom_settings).then(instance => {
        const change: DraftExistenceChange = {
          originator: 'DRAFT',
          type: 'CREATED',
          node: this.tree.getNode(instance.id),
          inputs: [],
          outputs: []
        }
        this.ss.addStateChange(change);
      }

      ).catch(console.error)
    });
  }

  /**
   * triggers a series of actions to occur when the view is switched from editor to mixer
   * @param edited_id the id of the draft that was last edited in the other mode. 
   */
  onFocus(edited_draft_id: number) {

    if (edited_draft_id == -1 || edited_draft_id == null) return;

    const sd: SubdraftComponent = <SubdraftComponent>this.tree.getComponent(edited_draft_id);
    if (sd !== null && sd !== undefined) sd.redrawExistingDraft();


    const outlet_ops_connected = this.tree.getNonCxnOutputs(edited_draft_id);
    let fns = outlet_ops_connected.map(el => this.performAndUpdateDownstream(el));
    Promise.all(fns);

    //DO TO MAKE SURE USERS CAN TOGGLE ON MIXER DRAFTS
    this.dm.selectDraftEditingMode('draw');
    this.dm.selectPencil('toggle');

  }

  /**
   * called when toggling away from to mixer
   */
  onClose() {

  }


  bumpDataflow() {
    let offset = 200;
    let ops = this.tree.getOperations().filter(el => el !== null);
    let drafts = this.tree.getDrafts().filter(el => el !== null);
    let notes = this.notes.getComponents().filter(el => el !== null);;

    ops.forEach(op => {
      op.topleft.x += offset;
      op.topleft.y += offset;
      op.setPosition(op.topleft)
    });

    drafts.forEach(draft => {
      draft.topleft.x += offset;
      draft.topleft.y += offset;
      draft.setPosition(draft.topleft)
    });


    notes.forEach(note => {
      note.topleft.x += offset;
      note.topleft.y += offset;
      note.setPosition(note.topleft);
    });

    this.palette.redrawConnections();



  }



  zoomChange(zoom_index: any) {
    this.zs.setZoomIndexOnMixer(zoom_index)
    this.palette.rescale();

  }


  changeDesignMode(mode) {
    // this.palette.changeDesignMode(mode);
  }


  /**
   * TODO, this likely doesn't work
   * Called from import bitmaps to drafts features. The drafts have already been imported and sent to this function, 
   * which now needs to draw them to the workspace
   * @param drafts 
   */
  loadDrafts(drafts: any) {

    // const loom:Loom = {
    //   threading:[],
    //   tieup:[],
    //   treadling: []
    // };

    // const loom_settings:LoomSettings = {
    //   type:this.ws.type,
    //   epi: this.ws.epi,
    //   units: this.ws.units,
    //   frames: this.ws.min_frames,
    //   treadles: this.ws.min_treadles

    // }

    // let topleft = this.vp.getTopLeft();

    // let max_h = 0;
    // let cur_h = topleft.y + 20; //start offset from top
    // let cur_w = topleft.x + 50;
    // let zoom_factor = defaults.mixer_cell_size / this.zs.getMixerZoom();
    // let x_margin = 20 / zoom_factor;
    // let y_margin = 40 / zoom_factor;

    // let view_width = this.vp.getWidth() * zoom_factor;

    // drafts.forEach(draft => {


    //   const id = this.tree.createNode("draft", null, null);
    //   this.tree.loadDraftData({prev_id: null, cur_id: id,}, draft, loom, loom_settings, true);
    //   this.palette.loadSubDraft(id, draft, null, null, this.zs.getMixerZoom());

    //   //position the drafts so that they don't all overlap. 
    //    max_h = (wefts(draft.drawdown)*defaults.mixer_cell_size > max_h) ? wefts(draft.drawdown)*defaults.mixer_cell_size : max_h;

    //    let approx_w = warps(draft.drawdown);

    //    //300 because each draft is defined as having min-width of 300pm
    //    let w = (approx_w*defaults.mixer_cell_size > 300) ? approx_w *defaults.mixer_cell_size : 300 / zoom_factor;

    //    let dn = this.tree.getNode(id);
    //    dn.component.topleft = {x: cur_w, y: cur_h};

    //    cur_w += (w + x_margin);
    //    if(cur_w > view_width){
    //     cur_w = topleft.x + 50;
    //     cur_h += (max_h+y_margin);
    //     max_h = 0;
    //    }


    // });

    // this.palette.addTimelineState();


  }



  clearView(): void {

    if (this.palette !== undefined) this.palette.clearComponents();
    this.notes.clear();
    this.vp.clear();

  }

  ngOnDestroy(): void {
    // this.unsubscribe$.next(0);
    // this.unsubscribe$.complete();
  }


  onCopySelections() {
    const selections = this.multiselect.copySelections();
    this.selected_nodes_copy = selections;
  }


  togglePanMode() {
    if (this.dm.isSelectedMixerEditingMode('pan')) {
      this.dm.selectMixerEditingMode('move');
    } else {
      this.dm.selectMixerEditingMode('pan');
    }
    this.palette.designModeChanged();

  }

  toggleSelectMode() {
    if (this.dm.isSelectedMixerEditingMode('marquee')) {
      this.dm.selectMixerEditingMode('move');

    } else {
      this.dm.selectMixerEditingMode('marquee');

    }
    this.palette.designModeChanged();
  }




  operationAdded(name: string) {
    this.palette.addOperation(name);
  }


  // printMixer(){
  //   console.log("PRINT MIXER", "get bounding box of the elements and print")
  //   var node = document.getElementById('scrollable-container');
  //     htmlToImage.toPng(node, {width: 16380/2, height: 16380/2})
  //     .then(function (dataUrl) {

  //       // var win = window.open('about:blank', "_new");
  //       // win.document.open();
  //       // win.document.write([
  //       //     '<html>',
  //       //     '   <head>',
  //       //     '   </head>',
  //       //     '   <body onload="window.print()" onafterprint="window.close()">',
  //       //     '       <img src="' + dataUrl + '"/>',
  //       //     '   </body>',
  //       //     '</html>'
  //       // ].join(''));
  //       // win.document.close();

  //       const link = document.createElement('a')
  //       link.href= dataUrl;
  //       link.download = "mixer.jpg"
  //       link.click();




  //     })
  //     .catch(function (error) {
  //       console.error('oops, something went wrong!', error);
  //     });

  // }



  /**
   * Updates the canvas based on the weave view.
   */
  public renderChange() {
    this.palette.rescale();
  }


  /**
   * Updates the canvas based on the weave view.
   */
  public zoomChangeExternal(event: any) {
    this.palette.rescale();
  }




  public notesChanged(e: any) {
    console.log(e);
  }



  /**
   * Called internally when loading files
   * @param note 
   */
  public createNote(note) {

    this.palette.createNote(note);
  }

  /**
   * Called when create New Note is Clicked
   */
  public createNewNote() {
    const nc: NoteComponent = this.palette.createNote(null);

    const change: NoteStateChange = {
      originator: 'NOTE',
      type: 'CREATED',
      before: null,
      after: this.notes.get(nc.id)
    }
    this.ss.addStateChange(change);
  }


  public loadSubDraft(id: number, d: Draft, nodep: NodeComponentProxy, draftp: DraftNodeProxy) {
    console.log("LOADING SUBDRAFT from Mixer", id, this.tree.nodes.slice());
    this.palette.loadSubDraft(id, d, nodep, draftp);
  }

  loadOperation(id: number, name: string, params: Array<any>, inlets: Array<any>, topleft: Point) {
    this.palette.loadOperation(id, name, params, inlets, topleft)
  }

  loadConnection(id: number) {
    this.palette.loadConnection(id);
  }

  centerView() {
    this.palette.centerView();
  }






  /**
   * something in the materials library changed, check to see if
   * there is a modal showing materials open and update it if there is
   */
  public materialChange() {

    this.palette.redrawAllSubdrafts();


  }

  public redrawAllSubdrafts() {
    this.palette.redrawAllSubdrafts();
  }



  /**
   * the drafts stored in adacad are ALWAYs oriented with 0,0 as the top left corner
   * any origin change is merely the rendering flipping the orientation. 
   * when the global settings change, the data itself does NOT need to change, only the rendering
   * @param e 
   */
  originChange(value: number) {

    this.palette.redrawAllSubdrafts(); //force a redraw so that the weft/warp system info is up to date

  }


  /**
   * communicates an id of a subdraft upstream to open it within the editor 
   * @param id 
   */
  openDraftInEditor(id: number) {
    this.onOpenInEditor.emit(id);
  }

  explode() {
    this.palette.explode();
  }

}