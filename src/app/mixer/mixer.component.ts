import { Component, ElementRef, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR } from '@angular/core';
import { PatternService } from '../core/provider/pattern.service';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { ScrollDispatcher } from '@angular/cdk/overlay';
import { Timeline } from '../core/model/timeline';
import { Pattern } from '../core/model/pattern';
import {Subject} from 'rxjs';
import { PaletteComponent } from './palette/palette.component';
import { Draft } from '../core/model/draft';
import { TreeService, TreeNode } from './provider/tree.service';
import { FileObj, FileService, LoadResponse, NodeComponentProxy, OpComponentProxy, SaveObj, TreeNodeProxy } from '../core/provider/file.service';
import { SidebarComponent } from '../core/sidebar/sidebar.component';
import { ViewportService } from './provider/viewport.service';
import { NotesService } from '../core/provider/notes.service';
import { Cell } from '../core/model/cell';
import { GloballoomService } from '../core/provider/globalloom.service';
import { Loom } from '../core/model/loom';


//disables some angular checking mechanisms
//enableProdMode();






@Component({
  selector: 'app-mixer',
  templateUrl: './mixer.component.html',
  styleUrls: ['./mixer.component.scss']
})
export class MixerComponent implements OnInit {

  @ViewChild(PaletteComponent, {static: false}) palette;
  @ViewChild(SidebarComponent, {static: false}) view_tool;


  filename = "adacad_mixer";

 /**
   * The weave Timeline object.
   * @property {Timeline}
   */
   timeline: Timeline = new Timeline();

   viewonly: boolean = false;

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
    private gl: GloballoomService,
    private notes: NotesService) {

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
    this.tree.clear();
    this.palette.clearComponents();
    console.log("loaded new file", result, result.data)
    this.processFileData(result.data).then(
      this.palette.changeDesignmode('move')
    ).catch(console.error);
    
  }



  /**
   * this gets called when a new file is started from the topbar
   * @param result 
   */
   importNewFile(result: LoadResponse){
    
    console.log("imported new file", result, result.data);
    this.processFileData(result.data).then(
      this.palette.changeDesignmode('move')
    );
  }



  /**
   * this uses the uploaded node data to create new nodes, in addition to any nodes that may already exist
   * @param nodes the nodes from the upload
   * @returns an array of uploaded ids mapped to unique ids in this instance
   */
  async loadNodes(nodes: Array<NodeComponentProxy>) : Promise<any> {

    const functions = nodes.map(n => this.tree.loadNode(<'draft'|'op'|'cxn'> n.type, n.node_id));
    return Promise.all(functions);

  }

  /**
   * uploads the relationships between the nodes as specified in a load file
   * @param id_map the map from uploaded ids to current ids generated by loadNodes
   * @param tns the uploaded treenode data
   * @returns an array of treenodes and the map associated at each tree node
   */
  async loadTreeNodes(id_map: Array<{prev_id: number, cur_id:number}>, tns: Array<TreeNodeProxy>) : Promise<Array<{tn:TreeNode,entry:{prev_id: number, cur_id: number}}>> {


    //map the old ids to the new ids
    const updated_tnp: Array<TreeNodeProxy> = tns.map(tn => {

      tn.node = id_map.find(el => el.prev_id === tn.node).cur_id;
      tn.parent = (tn.parent === null || tn.parent === -1) ? -1 : id_map.find(el => el.prev_id === tn.parent).cur_id;
      tn.inputs = tn.inputs.map(input => id_map.find(el => el.prev_id === input).cur_id);
      tn.outputs = tn.outputs.map(output => id_map.find(el => el.prev_id === output).cur_id);
      return tn;
    })

    const functions = updated_tnp.map(tn => this.tree.loadTreeNodeData(id_map, tn.node, tn.parent, tn.inputs, tn.outputs));
    return Promise.all(functions);

  }


  // /**
  //  * instantiates the screen components
  //  * @param nodes - the node proxies loaded
  //  * @param drafts - the drafts loaded
  //  * @param ops - the operations loaded
  //  */
  // async createAllComponents(nodes: Array<NodeComponentProxy>, drafts:Array<Draft>, ops: Array<OpComponentProxy>){

  //   const gen_fxns = [];

  //   nodes.forEach(nodep => {
  //     const node = this.tree.getNode(nodep.node_id);

  //     switch (node.type) {
  //       case 'draft' :
  //         const draft = drafts.find(el => el.id === nodep.draft_id);
  //         if(draft === undefined) break;
  //         gen_fxns.push(this.palette.loadSubDraft(nodep.node_id, draft, nodep)); 
  //         break;
  //       case 'op' :
  //         const op = ops.find(el => el.node_id === nodep.node_id); 
  //         if(op === undefined) Promise.reject("no op found for given id ");
  //         gen_fxns.push(this.palette.loadOperation(nodep.node_id, op.name, op.params, nodep.bounds));
  //       break;
  //       case 'cxn' :
  //         const to_from = this.tree.getConnectionsInvolving(nodep.node_id);
  //         gen_fxns.push(this.palette.loadConnection(nodep.node_id, to_from.from, to_from.to));
  //         break;
  //     }

  //     return Promise.all(gen_fxns);
  //   });


  // }

  /** 
   * Take a fileObj returned from the fileservice and process
   */
   async processFileData(data: FileObj) : Promise<string>{

    let entry_mapping = [];
    this.filename = data.filename;

    this.notes.notes.forEach(note => {
        this.palette.loadNote(note);
    });

    this.gl.inferData(data.looms.concat(this.tree.getLooms()))
    .then(el => {     
      return this.loadNodes(data.nodes)
    })
    .then(id_map => {
        entry_mapping = id_map;
        return this.loadTreeNodes(id_map, data.treenodes);
      }
    ).then(treenodes => {


      const seednodes: Array<{prev_id: number, cur_id: number}> = treenodes
        .filter(tn => this.tree.isSeedDraft(tn.tn.node.id))
        .map(tn => tn.entry);
     

      console.log("seed ndoes", seednodes);

      const seeds: Array<{entry, id, draft, loom}> = seednodes
      .map(sn =>  {

        let d = new Draft({wefts: 1, warps: 1, pattern: [[new Cell(false)]]});
        let l = new Loom(d, this.gl.min_frames, this.gl.min_treadles);

        const draft_node = data.nodes.find(node => node.node_id === sn.prev_id);

        if(draft_node !== undefined){

          const located_draft = data.drafts.find(draft => draft.id === draft_node.draft_id);
          if(located_draft === undefined){
            console.error("could not find draft with id in draft list");
            console.error("looking for draft ", draft_node.draft_id, "in ", data.drafts.map(draft => draft.id));
          }
          else{
            d.reload(located_draft);
            d.overloadId(located_draft.id);
          } 


          const located_loom = data.looms.find(loom => loom.draft_id === draft_node.draft_id);
          if(located_loom === undefined) console.error("could not find loom with this draft id ", draft_node.draft_id);
          else l = located_loom;
          
          l.recomputeLoom(d);

        }else{
          console.error("draft node could not be found")
        }

  

        d.overloadId(sn.cur_id); //do this so that all draft ids match the component / node ids
        l.draft_id = d.id;

      return {
        entry: sn,
        id: sn.cur_id,
        draft: d,
        loom: l
        }
      });

      console.log("seed nodes mapped ", seeds);


      
      const seed_fns = seeds.map(seed => this.tree.loadDraftData(seed.entry, seed.draft, seed.loom));
     
      const op_fns = data.ops.map(op => {
        const entry = entry_mapping.find(el => el.prev_id == op.node_id);
        return this.tree.loadOpData(entry, op.name, op.params)
      });
      
      return Promise.all([seed_fns, op_fns]);

    })
    .then(el => {
        return this.tree.validateNodes();
    })
    .then(el => {
      console.log("performing top level ops");

       return  this.tree.performTopLevelOps();
    })
    .then(el => {
      //delete any nodes that no longer need to exist
      this.tree.getDraftNodes()
      .filter(el => el.draft === null)
      .forEach(el => {
        if(this.tree.hasParent(el.id)){
          el.draft = new Draft({warps: 1, wefts: 1, pattern: [[new Cell(false)]]});
        } else{
          console.log("removing node ", el.id, el.type, this.tree.hasParent(el.id));
          this.tree.removeNode(el.id);
        } 
      })
    })
    .then(el => {

      return this.tree.nodes.forEach(node => {
        
        if(!(node.component === null || node.component === undefined)) return;

        const entry = entry_mapping.find(el => el.cur_id === node.id);

        switch (node.type){
          case 'draft':
            this.palette.loadSubDraft(node.id, this.tree.getDraft(node.id), data.nodes.find(el => el.node_id === entry.prev_id));
            break;
          case 'op':
            const op = this.tree.getOpNode(node.id);
            this.palette.loadOperation(op.id, op.name, op.params, data.nodes.find(el => el.node_id === entry.prev_id).bounds);
            break;
        }
      })


    }
    ).then(el => {
      return this.tree.nodes.forEach(node => {
        if(!(node.component === null || node.component === undefined)) return;
        switch (node.type){
          case 'cxn':
            this.palette.loadConnection(node.id, this.tree.getConnectionInput(node.id), this.tree.getConnectionOutput(node.id))
            break;
        }
      })
    })
    .catch(console.error);

    return Promise.resolve("all done");


  }

 


  // /** 
  //  * Take a fileObj returned from the fileservice and process
  //  */
  // processFileData(data: FileObj){

  //   //generate the notes components
  //   this.notes.notes.forEach(note => {
  //       this.palette.loadNote(note);
  //   });
   
  //   //map the draft ids in the file to the new ids created in this instance
  //   const id_map: Array<{old: number, new: number}> = []; 
   
  //   const nodes: Array<NodeComponentProxy> = data.nodes;
   
  //  //move through all the drafts, in later save files, this will only be the top level drafts
  //   data.drafts.forEach(draft => {
    
  //     const np:NodeComponentProxy = nodes.find(el => el.draft_id === draft.id);
  //     let new_id: number = -1;

  //     if(np === undefined){
  //        new_id = this.palette.createSubDraft(draft);
  //     }else{
  //       new_id = this.palette.loadSubDraft(draft, np.bounds, np.draft_visible);
  //       id_map.push({old: np.node_id, new: new_id});    
  //     }
  //   });

  //   data.ops.forEach(opProxy => {
  //     const np: NodeComponentProxy = nodes.find(el => el.node_id === opProxy.node_id);
  //     const new_id: number = this.palette.loadOperation(opProxy.name, opProxy.params, np.bounds);
  //     id_map.push({old: np.node_id, new: new_id});
  //   });


  //   nodes.forEach(nodeproxy => {
     
  //     switch(nodeproxy.type){
  //     case 'cxn':
  //       const tn: number = data.treenodes.findIndex(node => node.node == nodeproxy.node_id);    
  //       if(tn !== -1){
  //         const old_input_id: number = data.treenodes[tn].inputs[0];
  //         const old_output_id: number = data.treenodes[tn].outputs[0];
  //         const new_input_id: number = id_map.find(el => el.old == old_input_id).new;
  //         const new_output_id: number = id_map.find(el => el.old == old_output_id).new;      
  //         const outs: any = this.palette.createConnection(new_input_id, new_output_id);
  //         id_map.push({old: nodeproxy.node_id, new: outs.id});

  //       }else{
  //         console.log("ERROR: cannot find treenode associated with node id: ", nodeproxy.node_id);
  //       }
  //       break;
  //     }
  //   });

  //   //now move through the drafts and update their parent operations
  //   data.treenodes.forEach( tn => {
  //     const np: NodeComponentProxy = nodes.find(node => node.node_id == tn.node);    
  //     switch(np.type){
      
      
      
  //       case 'draft':
  //         if(tn.parent != -1){
  //           const new_id = id_map.find(el => el.old == tn.node).new;
  //           const parent_id = id_map.find(el => el.old == tn.parent).new;
  //           const sd: SubdraftComponent = <SubdraftComponent> this.tree.getComponent(new_id);
  //           sd.parent_id = parent_id;
  //         }
  //       break;

  //       case 'op' :
  //         const new_op_id:number = id_map.find(el => el.old == tn.node).new;
  //         const op_comp: OperationComponent = <OperationComponent> this.tree.getComponent(new_op_id);
  //        // op_comp.has_connections_in = (tn.inputs.length > 0);
  //         tn.outputs.forEach(out => {
            
  //           const out_cxn_id:number = id_map.find(el => el.old === out).new;
  //           const new_out_id: number = this.tree.getConnectionOutput(out_cxn_id);
            
  //           const draft_comp:SubdraftComponent = <SubdraftComponent> this.tree.getComponent(new_out_id);
  //           op_comp.outputs.push({component_id: new_out_id, draft: draft_comp.draft});
  //         });
  //       break;
  //     }



  //   });

  // }
  
  ngOnInit(){
    
  }

  ngAfterViewInit() {

    this.palette.addTimelineState();


    // this.http.get('assets/demo_file.ada', {observe: 'response'}).subscribe((res) => {
    //   console.log(res.body);
    //   const lr:LoadResponse = this.fs.loader.ada(res.body);
    //   this.loadNewFile(lr);
    // }); 


 



  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  undo() {

    let so: string = this.timeline.restorePreviousMixerHistoryState();
    
    this.fs.loader.ada(this.filename, JSON.parse(so)).then(
      lr => this.loadNewFile(lr)
    );

  
  }

  redo() {

    let so: string = this.timeline.restoreNextMixerHistoryState();
    this.fs.loader.ada(this.filename, JSON.parse(so))
    .then(lr =>  this.loadNewFile(lr));

   
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


  /**
   * this is called when a user pushes bring from the topbar
   * @param event 
   */
  public async onSave(e: any) : Promise<any>{

    const link = document.createElement('a')


    switch(e.type){
      case 'jpg': 

      return this.fs.saver.jpg(this.palette.getPrintableCanvas(e))
      .then(href => {
        link.href= href;
        link.download = e.name + ".jpg";
        this.palette.clearCanvas();
        link.click();
      });

      break;

      case 'wif': 
         this.palette.downloadVisibleDraftsAsWif();
         return Promise.resolve(null);
      break;

      case 'ada': 
      this.fs.saver.ada(
        'mixer', 
        this.tree.exportDraftsForSaving(),
        this.tree.exportLoomsForSaving(),
        false).then(href => {
          link.href = href;
          link.download = e.name + ".ada";
          link.click();
        })
      break;

      case 'bmp':
        this.palette.downloadVisibleDraftsAsBmp();
        return Promise.resolve(null);
      break;
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

 
  
  public globalLoomChange(e: any){
    console.log("global loom change");
    this.tree.updateLooms();
    
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

  public createNote(){
    this.palette.createNote();
  }


  /**
   * something in the materials library changed, check to see if
   * there is a modal showing materials open and update it if there is
   */
   public materialChange() {
    console.log('material change')

    this.palette.redrawOpenModals();
 }


 


}
