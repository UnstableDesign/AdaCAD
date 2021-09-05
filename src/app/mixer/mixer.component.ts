import { Component, ElementRef, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PatternService } from '../core/provider/pattern.service';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { ScrollDispatcher } from '@angular/cdk/overlay';
import { Timeline } from '../core/model/timeline';
import { Bounds, DraftMap, MaterialTypes, ViewModes } from '../core/model/datatypes';
import { Pattern } from '../core/model/pattern';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import {Subject} from 'rxjs';
import { PaletteComponent } from './palette/palette.component';
import { MixerDesignComponent } from './tool/mixerdesign/mixerdesign.component';
import { Draft } from '../core/model/draft';
import { TreeService } from './provider/tree.service';
import { FileObj, FileService, LoadResponse, NodeComponentProxy, OpComponentProxy, SaveObj } from '../core/provider/file.service';
import { OperationComponent } from './palette/operation/operation.component';
import { SubdraftComponent } from './palette/subdraft/subdraft.component';
import { MixerViewComponent } from './modal/mixerview/mixerview.component';
import { MixerInitComponent } from './modal/mixerinit/mixerinit.component';
import { QuicktoolsComponent } from '../core/tool/quicktools/quicktools.component';
import { ViewportService } from './provider/viewport.service';
import { HttpClient, HttpResponse } from '@angular/common/http';

//disables some angular checking mechanisms
//enableProdMode();






@Component({
  selector: 'app-mixer',
  templateUrl: './mixer.component.html',
  styleUrls: ['./mixer.component.scss']
})
export class MixerComponent implements OnInit {

  @ViewChild(PaletteComponent, {static: false}) palette;
  @ViewChild(MixerDesignComponent, {static: false}) design_tool;
  @ViewChild(QuicktoolsComponent, {static: false}) view_tool;


  filename = "adacad_mixer";
  notes: string = "";

 /**
   * The weave Timeline object.
   * @property {Timeline}
   */
   timeline: Timeline = new Timeline();


   manual_scroll: boolean = false;

  private unsubscribe$ = new Subject();

  patterns: Array<Pattern> = [];

  collapsed:boolean = false;

  scrollingSubscription: any;

  /// ANGULAR FUNCTIONS
  /**
   * @constructor
   * ps - pattern service (variable name is initials). Subscribes to the patterns and used
   * to get and update stitches.
   * dialog - Anglar Material dialog module. Used to control the popup modals.
   */
  constructor(private dm: DesignmodesService, 
    private ps: PatternService, 
    private tree: TreeService,
    public scroll: ScrollDispatcher,
    private fs: FileService,
    private vp: ViewportService,
    private dialog: MatDialog,
    private http: HttpClient) {

    //this.dialog.open(MixerInitComponent, {width: '600px'});

    this.scrollingSubscription = this.scroll
          .scrolled()
          .subscribe((data: any) => {
            this.onWindowScroll(data);
    });
    
    this.vp.setAbsolute(16380, 16380); //max size of canvas, evenly divisible by default cell size
   
    this.patterns = this.ps.getPatterns();


  }



  private onWindowScroll(data: any) {
    if(!this.manual_scroll){
     this.palette.handleWindowScroll(data);
     this.view_tool.updateViewPort(data);
    }else{
      this.manual_scroll = false;
    }
  }

  private setScroll(delta: any) {
    this.palette.handleScroll(delta);
    this.manual_scroll = true;
   //this.view_tool.updateViewPort(data);
  }


  /**
   * A function originating in the deisgn tool that signals a design mode change and communicates it to the palette
   * @param name the name of the current design mode
   */
  private designModeChange(name: string){
    this.palette.designModeChanged();
  }

  /**
   * A function originating in the deisgn tool that signals a design mode change and communicates it to the palette
   * @param name the name of the current design mode
   */
  private inkChanged(name: string){
    // this.palette.inkChanged();
  }
  




  /**
   * this gets called when a new file is started from the topbar or a new file is reload via undo/redo
   * @param result 
   */
  loadNewFile(result: LoadResponse){
    console.log("loaded new file", result);
    this.tree.clear();
    this.palette.clearComponents();
    this.processFileData(result.data);
    this.palette.changeDesignmode('move');

  }



  /**
   * this gets called when a new file is started from the topbar
   * @param result 
   */
   importNewFile(result: LoadResponse){
    
    console.log("imported new file", result, result.data);
    this.processFileData(result.data);
    this.palette.changeDesignmode('move');

  }

  /** 
   * Take a fileObj returned from the fileservice and process
   */
  processFileData(data: FileObj){
    console.log("process file data", data);

    const id_map: Array<{old: number, new: number}> = []; 
   
    const nodes: Array<NodeComponentProxy> = data.nodes;
   
   //move through all the drafts 
    data.drafts.forEach(draft => {
    
      const np:NodeComponentProxy = nodes.find(el => el.draft_id == draft.id);
      let new_id: number = -1;
      if(np === undefined){
         new_id = this.palette.createSubDraft(draft);
      }else{
        new_id = this.palette.loadSubDraft(draft, np.bounds);
        id_map.push({old: np.node_id, new: new_id});    
      }
    });

    data.ops.forEach(opProxy => {
      const np: NodeComponentProxy = nodes.find(el => el.node_id === opProxy.node_id);
      const new_id: number = this.palette.loadOperation(opProxy.name, opProxy.params, np.bounds);
      id_map.push({old: np.node_id, new: new_id});
    });


    nodes.forEach(nodeproxy => {
     
      switch(nodeproxy.type){
      case 'cxn':
        const tn: number = data.treenodes.findIndex(node => node.node == nodeproxy.node_id);    
        if(tn !== -1){
          const old_input_id: number = data.treenodes[tn].inputs[0];
          const old_output_id: number = data.treenodes[tn].outputs[0];
          const new_input_id: number = id_map.find(el => el.old == old_input_id).new;
          const new_output_id: number = id_map.find(el => el.old == old_output_id).new;      
          const outs: any = this.palette.createConnection(new_input_id, new_output_id);
          id_map.push({old: nodeproxy.node_id, new: outs.id});

        }else{
          console.log("ERROR: cannot find treenode associated with node id: ", nodeproxy.node_id);
        }
        break;
      }
    });

    //now move through the drafts and update their parent operations
    data.treenodes.forEach( tn => {
      const np: NodeComponentProxy = nodes.find(node => node.node_id == tn.node);    
      switch(np.type){
      
      
      
        case 'draft':
          if(tn.parent != -1){
            const new_id = id_map.find(el => el.old == tn.node).new;
            const parent_id = id_map.find(el => el.old == tn.parent).new;
            const sd: SubdraftComponent = <SubdraftComponent> this.tree.getComponent(new_id);
            sd.parent_id = parent_id;
          }
        break;

        case 'op' :
          const new_op_id:number = id_map.find(el => el.old == tn.node).new;
          const op_comp: OperationComponent = <OperationComponent> this.tree.getComponent(new_op_id);
          op_comp.has_connections_in = (tn.inputs.length > 0);
          tn.outputs.forEach(out => {
            
            const out_cxn_id:number = id_map.find(el => el.old === out).new;
            const new_out_id: number = this.tree.getConnectionOutput(out_cxn_id);
            
            const draft_comp:SubdraftComponent = <SubdraftComponent> this.tree.getComponent(new_out_id);
            op_comp.outputs.push({component_id: new_out_id, draft: draft_comp.draft});
          });
        break;
      }



    });

  }
  
  ngOnInit(){
    
  }

  ngAfterViewInit() {

    this.palette.addTimelineState();


    this.http.get('assets/demo_file.ada', {observe: 'response'}).subscribe((res) => {
      console.log(res.body);
      const lr:LoadResponse = this.fs.loader.ada(res.body);
      this.loadNewFile(lr);
    }); 


 



  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  undo() {

    let so: string = this.timeline.restorePreviousMixerHistoryState();
    
    const lr: LoadResponse = this.fs.loader.ada(JSON.parse(so));
    this.loadNewFile(lr);
  }

  redo() {

    let so: string = this.timeline.restoreNextMixerHistoryState();
    const lr: LoadResponse = this.fs.loader.ada(JSON.parse(so));
    this.loadNewFile(lr);
   
  }

/**
   * Change to draw mode on keypress d
   * @returns {void}
   */
  @HostListener('window:keydown.d', ['$event'])
  private keyChangetoDrawMode(e) {
    this.dm.selectDesignMode('draw', 'design_modes');
    this.designModeChange('draw');
  }

  /**
   * Change to draw mode on keypress s
   * @returns {void}
   */
   @HostListener('window:keydown.s', ['$event'])
   private keyChangeToSelect(e) {
     this.dm.selectDesignMode('marquee','design_modes');
     this.designModeChange('marquee');
   }


     /**
   * Change to draw mode on keypress s
   * @returns {void}
   */
      @HostListener('window:keydown.m', ['$event'])
      private keyChangeToMove(e) {
        this.dm.selectDesignMode('move','design_modes');
        this.designModeChange('move');
      }
   

      operationAdded(name:string){
        this.palette.addOperation(name);
      }

/**
   * Call zoom out on Shift+o.
   * @extends WeaveComponent
   * @param {Event} shift+o
   * @returns {void}
   */
  // @HostListener('window:keydown.Shift.o', ['$event'])
  // private keyEventZoomOut(e) {
  //   console.log("zoom out");
  //   this.render.zoomOut();
  //   this.palette.rescale();
  // }


  /**
   * Sets selected area to clear
   * @extends WeaveComponent
   * @param {Event} delete key pressed
   * @returns {void}
   */

  // @HostListener('window:keydown.e', ['$event'])
  // private keyEventErase(e) {
  //   this.design_mode = {
  //     name: 'down',
  //     id: -1
  //   };
  //   this.palette.unsetSelection();

  // }

  /**
   * Sets brush to point on key control + d.
   * @extends WeaveComponent
   * @param {Event} e - Press Control + d
   * @returns {void}
   */
  // @HostListener('window:keydown.d', ['$event'])
  // private keyEventPoint(e) {
  //   this.design_mode = {
  //     name: 'up',
  //     id: -1};
  //   this.palette.unsetSelection();

  // }

  /**
   * Sets brush to select on key control + s
   * @extends WeaveComponent
   * @param {Event} e - Press Control + s
   * @returns {void}
   */
  // @HostListener('window:keydown.s', ['$event'])
  // private keyEventSelect(e) {
  //   this.design_mode = {
  //     name: 'select',
  //     id: -1};
  //   this.palette.unsetSelection();

  // }

  /**
   * Sets key control to invert on control + x
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  // @HostListener('window:keydown.x', ['$event'])
  // private keyEventInvert(e) {
  //   this.design_mode = {
  //     name: 'toggle',
  //     id: -1
  //   };
  //   this.palette.unsetSelection();

  // }

  /**
   * Sets key to copy 
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  // @HostListener('window:keydown.c', ['$event'])
  // private keyEventCopy(e) {
  //   this.onCopy();  
  // }

    /**
   * Sets key to copy 
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  // @HostListener('window:keydown.p', ['$event'])
  // private keyEventPaste(e) {
  //   this.onPaste({});
  // }


  // /**
  //  * this is called when import has been called from the sidebar
  //  * @param result 
  //  */
  // public draftUploaded(result: LoadResponse){

  //   console.log("import", result);
  //   const data: FileObj = result.data;

  //   data.drafts.forEach().

  //   const draft: Draft = new Draft(result);
  //   this.palette.addSubdraftFromDraft(draft);
  // }

  /**
   * this is called when a user pushes bring from the topbar
   * @param event 
   * @todo add interface to select which draft to export if BMP or WIF
   */
  public onSave(e: any){

    console.log(e);
    let link = e.downloadLink.nativeElement;

    switch(e.type){
      case 'jpg': 
      link.href = this.fs.saver.jpg(this.palette.getPrintableCanvas(e));
      link.download = e.name + ".jpg";
      this.palette.clearCanvas();
      break;

      case 'ada': 
      link.href = this.fs.saver.ada(
        'mixer', 
        this.tree.exportDraftsForSaving(),
        [],
        this.patterns,
        this.notes,
        false);
        link.download = e.name + ".ada";
    }
  }

  /**
   * Updates the canvas based on the weave view.
   * @extends WeaveComponent
   * @param {Event} e - view change event from design component.
   * @returns {void}
   */
  public renderChange(event: any) {

     const scale = event.value;
     this.palette.rescale(scale);



  }

 
  



  public updatePatterns(e: any) {
    // this.patterns = e.patterns;
    // this.draft.patterns = this.patterns;
  }



  public notesChanged(e:any) {
    console.log(e);
    //this.draft.notes = e;
  }

  public createPattern(e: any) {

    this.patterns.push(new Pattern({pattern: e.pattern}));
  
  }


//should this just hide the pattern or fully remove it, could create problems with undo/redo
   public removePattern(e: any) {
    this.patterns = this.patterns.filter(pattern => pattern !== e.pattern);
  }



  public toggleCollapsed(){
    this.collapsed = !this.collapsed;
  }


}
