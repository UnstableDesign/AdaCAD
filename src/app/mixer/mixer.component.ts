import { Component, ElementRef, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, enableProdMode } from '@angular/core';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { ScrollDispatcher } from '@angular/cdk/overlay';
import {Subject} from 'rxjs';
import { PaletteComponent } from './palette/palette.component';
import { TreeService} from './provider/tree.service';
import { Draft, Loom, FileObj, Node, LoadResponse, NodeComponentProxy, OpComponentProxy, SaveObj, TreeNodeProxy, LoomSettings, TreeNode, DraftNode, IOTuple  } from '../core/model/datatypes';
import { SidebarComponent } from '../core/sidebar/sidebar.component';
import { ViewportService } from './provider/viewport.service';
import { NotesService } from '../core/provider/notes.service';
import { Cell } from '../core/model/cell';
import { WorkspaceService } from '../core/provider/workspace.service';
import { StateService } from '../core/provider/state.service';
import { MaterialsService } from '../core/provider/materials.service';
import { SystemsService } from '../core/provider/systems.service';
import { HttpClient } from '@angular/common/http';
import { InitModal } from '../core/modal/init/init.modal';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../core/provider/auth.service';
import {getDatabase, ref as fbref, get as fbget, child} from '@angular/fire/database'
import {getAnalytics, logEvent} from '@angular/fire/analytics'
import { ImageService } from '../core/provider/image.service';
import { OperationService } from './provider/operation.service';
import { FileService} from '../core/provider/file.service'
import { initDraft, initDraftWithParams, loadDraftFromFile } from '../core/model/drafts';
import * as _ from 'lodash';
import { any } from '@tensorflow/tfjs';
import { SubdraftComponent } from './palette/subdraft/subdraft.component';
import utilInstance from '../core/model/util';


//disables some angular checking mechanisms
enableProdMode();






@Component({
  selector: 'app-mixer',
  templateUrl: './mixer.component.html',
  styleUrls: ['./mixer.component.scss']
})
export class MixerComponent implements OnInit {

  @ViewChild(PaletteComponent) palette;
  @ViewChild(SidebarComponent) view_tool;


  filename = "adacad_mixer";

 /**
   * The weave Timeline object.
   * @property {Timeline}
   */

   viewonly: boolean = false;

   manual_scroll: boolean = false;

  private unsubscribe$ = new Subject();

  collapsed:boolean = false;

  scrollingSubscription: any;

  scale: number = 5;

  /// ANGULAR FUNCTIONS
  /**
   * @constructor
   * ps - pattern service (variable name is initials). Subscribes to the patterns and used
   * to get and update stitches.
   * dialog - Anglar Material dialog module. Used to control the popup modals.
   */
  constructor(public dm: DesignmodesService, 
    private auth: AuthService,
    private ms: MaterialsService,
    private sys: SystemsService,
    private tree: TreeService,
    public scroll: ScrollDispatcher,
    private fs: FileService,
    public ws: WorkspaceService,
    public vp: ViewportService,
    private notes: NotesService,
    private ss: StateService,
    private dialog: MatDialog,
    private image: ImageService,
    private ops: OperationService,
    private http: HttpClient
    ) {



    //this.dialog.open(MixerInitComponent, {width: '600px'});

    this.scrollingSubscription = this.scroll
          .scrolled()
          .subscribe((data: any) => {
            this.onWindowScroll(data);
    });
    
    this.vp.setAbsolute(16380, 16380); //max size of canvas, evenly divisible by default cell size
   
  }


  ngOnInit(){
    const analytics = getAnalytics();
    logEvent(analytics, 'onload', {
      items: [{ uid: this.auth.uid }]
    });
  }

  ngAfterViewInit() {

    let searchParams = new URLSearchParams(window.location.search);

    if(searchParams.has('ex')){
      this.loadExampleAtURL(searchParams.get('ex'));  
    }else{
      this.loadLoggedInUser();
    }

  }


  private onWindowScroll(data: any) {
    if(!this.manual_scroll){
     this.palette.handleWindowScroll(data);
     this.view_tool.updateViewPort(data);
    }else{
      this.manual_scroll = false;
    }
  }

 setScroll(delta: any) {
    this.palette.handleScroll(delta);
    this.manual_scroll = true;
   //this.view_tool.updateViewPort(data);
  }


  /**
   * A function originating in the deisgn tool that signals a design mode change and communicates it to the palette
   * @param name the name of the current design mode
   */
  designModeChange(name: string){
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

    this.clearView();
    this.tree.clear();
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
    
    this.processFileData(result.data)
    .then( data => {
      this.palette.changeDesignmode('move')
      this.clearView();
      this.tree.clear();
      console.log("imported new file", result, result.data)
      })
      .catch(console.error);
    
  }


  printTreeStatus(name: string, treenode: Array<TreeNode>){
    console.log("PRINTING TREE STATUS FOR ", name);

    treenode.forEach(tn => {
      if(tn === undefined){
        console.log("Undefined Node", tn); 
        return;
      }

      if(tn.inputs === undefined){
        console.log("Undefined Inputs", tn); 
        return;  
      }

      if(tn.outputs === undefined){
        console.log("Undefined Outputs", tn); 
        return;  
      }
      
      switch(tn.node.type){
        case 'cxn':
          if(tn.inputs.length !== 1 || tn.outputs.length !== 1)
          console.log("Invalid Number of Inputs/Outputs on Connection", tn); 
          break;

        case 'draft':
            if(tn.inputs.length > 1)
            console.log("Invalid Number of Inputs/Outputs on Draft", tn); 
            break;
      }


    });
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
    

    const updated_tnp: Array<TreeNodeProxy> = tns.map(tn => {
     
      //we need these here because firebase does not store arrays of size 0
      if(tn.inputs === undefined) tn.inputs = [];
      if(tn.outputs === undefined) tn.outputs = [];


      const input_list = tn.inputs.map(input => {
        if(typeof input === 'number'){
          const input_in_map = id_map.find(el => el.prev_id === input);

          if(input_in_map !== undefined){
            return {tn: input_in_map.cur_id, ndx: 0};
          }else{
            console.error("could not find matching node");
          }

        }else{
          const input_in_map = id_map.find(el => el.prev_id === input.tn);
          if(input_in_map !== undefined){
            return {tn: input_in_map.cur_id, ndx: input.ndx};
          }else{
            console.error("could not find matching node");
          }
        } 

       
      });

      const output_list:Array<any> = tn.outputs.map(output => {
          //handle files of old type, before inputs were broken into two fields
          if(typeof output === 'number'){
            const output_map = id_map.find(el => el.prev_id === output);
            if(output_map !== undefined){
             return {tn: output_map.cur_id, ndx: 0};
            }else{
              console.error("could not find matching node"); 
            }
          }else{
            const output_map = id_map.find(el => el.prev_id === output.tn);
            if(output_map !== undefined){
             return {tn: output_map.cur_id, ndx: output.ndx};
            }else{
              console.error("could not find matching node"); 
            }
          } 
      });
      


      const new_tn: TreeNodeProxy = {
        node: id_map.find(el => el.prev_id === tn.node).cur_id,
        parent: (tn.parent === null || tn.parent === -1) ? -1 : id_map.find(el => el.prev_id === tn.parent).cur_id,
        inputs: input_list,
        outputs: output_list
      }
      
      //console.log("new tn is ", new_tn);
      return new_tn;
    })

    const functions = updated_tnp.map(tn => this.tree.loadTreeNodeData(id_map, tn.node, tn.parent, tn.inputs, tn.outputs));
    return Promise.all(functions);

  }


  /** 
   * Take a fileObj returned from the fileservice and process
   */
   async processFileData(data: FileObj) : Promise<string>{

    let entry_mapping = [];
    this.filename = data.filename;


    this.notes.notes.forEach(note => {
        this.palette.loadNote(note);
    });

    //start processing images first thing 
    const images_to_load = [];
    data.ops.forEach(op => {
      const internal_op = this.ops.getOp(op.name); 
      if(internal_op === undefined || internal_op == null|| internal_op.params === undefined) return;
      const param_types = internal_op.params.map(el => el.type);
      param_types.forEach((p, ndx) => {
        if(p === 'file') images_to_load.push(op.params[ndx]);
      });
    })


    this.image.loadFiles(images_to_load).then(el => {
      return this.tree.replaceOutdatedOps(data.ops);
    })
    .then(correctedOps => {    
      data.ops = correctedOps; 
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
     

      const seeds: Array<{entry, id, draft, loom, loom_settings}> = seednodes
      .map(sn =>  {


         let d:Draft =null;
        // let ls:LoomSettings = {
        //   this.ws.type
        // }
        // let l = new Loom(d, this.ws.type, this.ws.min_frames, this.ws.min_treadles);

        const draft_node = data.nodes.find(node => node.node_id === sn.prev_id);
        //let d: Draft = initDraft();
        let l: Loom = {
          treadling: [],
          tieup: [],
          threading: []
        }

        let ls: LoomSettings = {
          frames: this.ws.min_frames,
          treadles: this.ws.min_treadles,
          epi: this.ws.epi,
          units: this.ws.units,
          type: this.ws.type
        }
        if(draft_node !== undefined){

          const located_draft = data.draft_nodes.find(draft => draft.draft_id === draft_node.node_id);
          if(located_draft === undefined){
            console.log("Looking for ", draft_node.node_id,"in", data.draft_nodes.map(el => el.draft_id))
            console.error("could not find draft with id in draft list");
          }
          else{
            d = _.cloneDeep(located_draft.draft);
            ls = _.cloneDeep(located_draft.loom_settings);
            l = _.cloneDeep(located_draft.loom);
          } 

        }else{
          console.error("draft node could not be found")
        }

  

        d.id = (sn.cur_id); //do this so that all draft ids match the component / node ids

      return {
        entry: sn,
        id: sn.cur_id,
        draft: d,
        loom: l,
        loom_settings: ls
        }
      });

      

      // console.log("ALL TREADLING in Mixer");
      // seeds.forEach(node => {
      //   console.log(node.loom.treadling)
      // })
      const seed_fns = seeds.map(seed => this.tree.loadDraftData(seed.entry, seed.draft, seed.loom,seed.loom_settings));
  
      const op_fns = data.ops.map(op => {
        const entry = entry_mapping.find(el => el.prev_id == op.node_id);
        return this.tree.loadOpData(entry, op.name, op.params, op.inlets);
      });

      return Promise.all([seed_fns, op_fns]);

    })
    .then(el => {
        return this.tree.validateNodes();
    })
    .then(el => {
      //console.log("performing top level ops");
       return  this.tree.performTopLevelOps();
    })
    .then(el => {
      //delete any nodes that no longer need to exist
      this.tree.getDraftNodes()
      .filter(el => el.draft === null)
      .forEach(el => {
        if(this.tree.hasParent(el.id)){
          el.draft = initDraftWithParams({warps: 1, wefts: 1, pattern: [[new Cell(false)]]});
          el.draft.id = el.id;
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
        if(entry === undefined) return;

        switch (node.type){
          case 'draft':
            
            this.palette.loadSubDraft(node.id, this.tree.getDraft(node.id), data.nodes.find(el => el.node_id === entry.prev_id), data.draft_nodes.find(el => el.node_id === entry.prev_id), data.scale);
            break;
          case 'op':
            const op = this.tree.getOpNode(node.id);
            this.palette.loadOperation(op.id, op.name, op.params, op.inlets, data.nodes.find(el => el.node_id === entry.prev_id).bounds, data.scale);
            break;
        }
      })


    }
    ).then(el => {
      return this.tree.nodes.forEach(node => {
        if(!(node.component === null || node.component === undefined)) return;
        switch (node.type){
          case 'cxn':
            this.palette.loadConnection(node.id)
            break;
        }
      })
    })
    .then(el => {

      //NOW GO THOUGH ALL DRAFT NODES and ADD IN DATA THAT IS REQUIRED
      data.draft_nodes
      .forEach(np => {
        const new_id = entry_mapping.find(el => el.prev_id === np.node_id);
        const node = this.tree.getNode(new_id.cur_id);
        if(node === undefined) return;

       (<DraftNode> node).draft.ud_name = np.draft_name;
       (<DraftNode> node).loom_settings = np.loom_settings; 
      })

      // const dn = this.tree.getDraftNodes();
      // dn.forEach(node => {
      //   console.log("RES", node.draft, node.loom, node.loom_settings)
      // })
  

    })
    .catch(console.error);


    //print out all trees:


    return Promise.resolve("all done");


  }

 

  


  loadExampleAtURL(name: string){
    const analytics = getAnalytics();
    logEvent(analytics, 'onurl', {
      items: [{ uid: this.auth.uid, name: name }]
    });

    this.http.get('assets/examples/'+name+".ada", {observe: 'response'}).subscribe((res) => {
      console.log(res);
      if(res.status == 404) return;
      return this.fs.loader.ada(name, res.body)
     .then(loadresponse => {
       this.loadNewFile(loadresponse)
     });
    }); 
  }


  loadLoggedInUser(){

    this.auth.user.subscribe(user => {

      if(user === null){

        const dialogRef = this.dialog.open(InitModal, {
          data: {source: 'mixer'}
        });


        dialogRef.afterClosed().subscribe(loadResponse => {
          this.palette.changeDesignmode('move');
          if(loadResponse !== undefined){
            if(loadResponse.status == -1){
              this.clearAll();
            }
            else{
              this.loadNewFile(loadResponse);
            }
          } 
        
    
       });
      }else{

        //in the case someone logs in mid way through, don't replace their work. 
        if(this.tree.nodes.length > 0) return;
       

        const db = fbref(getDatabase());


                fbget(child(db, `users/${this.auth.uid}/ada`)).then((snapshot) => {
                  if (snapshot.exists()) {
                    this.fs.loader.ada("recovered draft", snapshot.val()).then(lr => {
                      this.loadNewFile(lr);
                    });
                  }
                }).catch((error) => {
                  console.error(error);
                });

      }
    });

  }


  loadSavedFile(){
  //   this.auth.user.subscribe(user => {
  //       if(user !== null){

  //         const db = fbref(getDatabase());


  //         fbget(child(db, `users/${this.auth.uid}/ada`)).then((snapshot) => {
  //           if (snapshot.exists()) {
  //             this.fls.loader.ada("recovered draft", snapshot.val()).then(lr => {
  //               this.dialogRef.close(lr)
  //             });
  //           }
  //         }).catch((error) => {
  //           console.error(error);
  //         });
    
  //     }
    
  // });

  }


  clearView() : void {
    this.palette.clearComponents();
    this.vp.clear();

  }

  clearAll() : void{
    console.log("CLEAR ALL from MIXER")
    this.palette.addTimelineState();
    this.fs.clearAll();
    this.clearView();

  }



  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  undo() {

    let so: SaveObj = this.ss.restorePreviousMixerHistoryState();
    if(so === null || so === undefined) return;
    this.fs.loader.ada(this.filename, so).then(
      lr => this.loadNewFile(lr)
    );

  
  }

  redo() {

    let so: SaveObj = this.ss.restoreNextMixerHistoryState();
    if(so === null || so === undefined) return;

    this.fs.loader.ada(this.filename, so)
    .then(lr =>  this.loadNewFile(lr));

   
  }

/**
   * Change to draw mode on keypress d
   * @returns {void}
   */
  @HostListener('window:keydown.d', ['$event'])
  private keyChangetoDrawMode(e) {
    // console.log("event", e);

    // //make sure the path doesn't change if we're typing
    // const from_ta = e.path.find(el => el.localName === 'textarea');

    // if(from_ta !== undefined){
    //   return;
    // } 
    

    // this.dm.selectDesignMode('draw', 'design_modes');
    // this.designModeChange('draw');
  }

  /**
   * Change to draw mode on keypress s
   * @returns {void}
   */
   @HostListener('window:keydown.s', ['$event'])
   private keyChangeToSelect(e) {
    //  this.dm.selectDesignMode('marquee','design_modes');
    //  this.designModeChange('marquee');
   }


     /**
   * Change to draw mode on keypress s
   * @returns {void}
   */
      @HostListener('window:keydown.m', ['$event'])
      private keyChangeToMove(e) {
        // this.dm.selectDesignMode('move','design_modes');
        // this.designModeChange('move');
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
        false,
        this.scale).then(out => {
          link.href = "data:application/json;charset=UTF-8," + encodeURIComponent(out.json);
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

    this.scale = event.value;
     this.palette.rescale(this.scale);


  }



 
  /**
   * global loom ahs just changed to be deafults, so we don't need to update specific looms based on the outcomes
   * @param e 
   */
  public globalLoomChange(e: any){
    
    console.log("GLOBAL LOOM CHANGE IN MIXER")
    const dn = this.tree.getDraftNodes();
    dn.forEach(node => {
      const draft = this.tree.getDraft(node.id)
      const loom = this.tree.getLoom(node.id)
      const loom_settings = this.tree.getLoomSettings(node.id);
      (<SubdraftComponent> node.component).drawDraft(draft)});
    
  }



  public notesChanged(e:any) {
    console.log(e);
    //this.draft.notes = e;
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
    this.palette.redrawOpenModals();
    this.palette.redrawAllSubdrafts();
 }
}