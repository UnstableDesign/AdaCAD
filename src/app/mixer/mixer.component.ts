import { ScrollDispatcher } from '@angular/cdk/overlay';
import { HttpClient } from '@angular/common/http';
import { Component, enableProdMode, OnInit, Optional, ViewChild } from '@angular/core';
import { getAnalytics, logEvent } from '@angular/fire/analytics';
import { Auth, authState, User } from '@angular/fire/auth';
import { NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer, MatSidenav } from '@angular/material/sidenav';
import { MatTooltipDefaultOptions, MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { BlankdraftModal } from '../core/modal/blankdraft/blankdraft.modal';
import { createCell } from '../core/model/cell';
import { DesignMode, Draft, DraftNode, FileObj, IOTuple, LoadResponse, Loom, LoomSettings, NodeComponentProxy, OpInput, SaveObj, TreeNode, TreeNodeProxy } from '../core/model/datatypes';
import { defaults } from '../core/model/defaults';
import { copyDraft, flipDraft, initDraftWithParams, warps, wefts } from '../core/model/drafts';
import { copyLoom, copyLoomSettings, flipLoom } from '../core/model/looms';
import utilInstance from '../core/model/util';
import { AuthService } from '../core/provider/auth.service';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { FileService } from '../core/provider/file.service';
import { FilesystemService } from '../core/provider/filesystem.service';
import { ImageService } from '../core/provider/image.service';
import { MaterialsService } from '../core/provider/materials.service';
import { NotesService } from '../core/provider/notes.service';
import { OperationService } from '../core/provider/operation.service';
import { StateService } from '../core/provider/state.service';
import { SystemsService } from '../core/provider/systems.service';
import { TreeService } from '../core/provider/tree.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { DraftDetailComponent } from '../draftdetail/draftdetail.component';
import { RenderService } from '../draftdetail/provider/render.service';
import { PaletteComponent } from './palette/palette.component';
import { SubdraftComponent } from './palette/subdraft/subdraft.component';
import { MultiselectService } from './provider/multiselect.service';
import { ViewportService } from './provider/viewport.service';
import { ZoomService } from './provider/zoom.service';
import {MatSidenavModule} from '@angular/material/sidenav';

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
  providers: [{provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults}]

})
export class MixerComponent implements OnInit {


  @ViewChild(PaletteComponent) palette;
  @ViewChild(DraftDetailComponent) details;
  @ViewChild('detail_drawer') detail_drawer;

  epi: number = 10;
  units:string = 'cm';
  frames:number =  8;
  treadles:number = 10;
  loomtype:string = "jacquard";
  loomtypes:Array<DesignMode>  = [];
  density_units:Array<DesignMode> = [];
  warp_locked:boolean = false;
  origin_options: any = null;
  selected_origin: number = 0;
  show_viewer: boolean = false;
  show_details: boolean = false;
  loading: boolean = false;







 /**
   * The weave Timeline object.
   * @property {Timeline}
   */

  viewonly: boolean = false;

  manual_scroll: boolean = false;

  private unsubscribe$ = new Subject();

  collapsed:boolean = true;

  scrollingSubscription: any;

  selected_nodes_copy: any = null;



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
    private http: HttpClient,
    private zs: ZoomService,
    private files: FilesystemService,
    private render: RenderService,
    private multiselect: MultiselectService,
    @Optional() private fbauth: Auth
    ) {


      this.selected_origin = this.ws.selected_origin_option;

      this.origin_options = this.ws.getOriginOptions();
      this.epi = ws.epi;
      this.units = ws.units;
      this.frames = ws.min_frames;
      this.treadles = ws.min_treadles;
      this.loomtype = ws.type;
      this.loomtypes = dm.getOptionSet('loom_types');
     this.density_units = dm.getOptionSet('density_units');
    //this.dialog.open(MixerInitComponent, {width: '600px'});

    this.scrollingSubscription = this.scroll
          .scrolled()
          .subscribe((data: any) => {
            this.onWindowScroll(data);
    });
    
    this.vp.setAbsolute(defaults.mixer_canvas_width, defaults.mixer_canvas_height); //max size of canvas, evenly divisible by default cell size
   



    //subscribe to the login event and handle what happens in that case 

    if (auth) {
      const success = authState(this.fbauth).subscribe(async user => {
         this.initLoginLogoutSequence(user) 
          
      })

   }



  }


  ngOnInit(){
    const analytics = getAnalytics();
    logEvent(analytics, 'onload', {
      items: [{ uid: this.auth.uid }]
    });
  }

  ngAfterViewInit() {
 
  }


  private onWindowScroll(data: any) {
    if(!this.manual_scroll){
     this.palette.handleWindowScroll(data);
    // this.view_tool.updateViewPort(data);
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
   * this is called when the detail view is closed. It passes an object that has three values: 
   * id: the draft id
   * clone_id: the id for the cloned draft
   * is_dirty: a boolean to note if the draft was changed at all while in detail view. 
   * @param obj 
   */
  closeDetailViewer(obj: any){

    this.details.windowClosed();
    this.detail_drawer.close();

    //the object was never copied
    if(obj.clone_id == -1){
      let comp = <SubdraftComponent>this.tree.getComponent(obj.id);
      comp.redrawExistingDraft();

      this.palette.updateDownstream(obj.id).then(el => {
        this.palette.addTimelineState();
      });
    //reperform all of the ops 
    }else{
      //this object was copied and we need to keep the copy
      if(obj.dirty){
        const parent = this.tree.getComponent(obj.clone_id);
        let el = document.getElementById('scale-'+parent.id);
        let width = 0;
        if(el !== null && el !== undefined) width = el.offsetWidth;
        this.palette.createSubDraftFromEditedDetail(obj.id).then(sd => {
          const new_topleft = {
            x: parent.topleft.x+((width+40)*this.zs.zoom/defaults.mixer_cell_size), 
            y: parent.topleft.y};
    
            sd.setPosition(new_topleft);
        });

       
      }else{
        this.tree.removeSubdraftNode(obj.id);
      }
    }



  
    //refresh all of the subdrafts
    // let tlds:Array<number> = this.tree.getTopLevelDrafts();
    // tlds.forEach(tld => {
    //   let comp: SubdraftComponent = <SubdraftComponent>this.tree.getComponent(tld);
    //   comp.redrawExistingDraft();
    // })


    // this.palette.updateDownstream(obj).then(el => {
    //   this.palette.addTimelineState();
    // });
    // //reperform all of the ops 


  }

  detailViewChange(){
    this.details.weaveRef.rescale(this.render.getZoom());

  }


  addOp(event: any){
    this.palette.addOperation(event)
  }



  isBlankWorkspace() : boolean {
    return this.tree.nodes.length == 0;
  }


  zoomIn(){
    const old_zoom = this.zs.zoom;
    this.zs.zoomIn();
    this.renderChange(old_zoom);

  }


  zoomOut(){
    const old_zoom = this.zs.zoom;
    this.zs.zoomOut();
    this.renderChange(old_zoom);
    
}

createNewDraft(){

  const dialogRef = this.dialog.open(BlankdraftModal, {
  });

  dialogRef.afterClosed().subscribe(obj => {
    if(obj !== undefined && obj !== null) this.newDraftCreated(obj);
 });
}
 

zoomChange(e:any, source: string){
  
  const old_zoom = this.zs.zoom;
  this.zs.setZoom(e.value)
  this.palette.rescale(old_zoom);

}



  /**
   * this is called anytime a user event is fired
   * @param user 
   */
  initLoginLogoutSequence(user:User) {
    console.log("IN LOGIN/LOGOUT ", user)


    let searchParams = new URLSearchParams(window.location.search);
    if(searchParams.has('ex')){
      this.loadExampleAtURL(searchParams.get('ex'));  
      return;
    }


    if(user === null){
      //this is a logout event
      this.files.setCurrentFileInfo(this.files.generateFileId(), 'blank draft','');
      this.files.clearTree();



    }else{

      if(this.auth.isFirstSession() || (!this.auth.isFirstSession() && this.isBlankWorkspace())){
    
        this.auth.getMostRecentFileIdFromUser(user).then(async fileid => {

          if(fileid !== null){

            const ada = await this.files.getFile(fileid).catch(e => {
              console.error("error on get file ", e)
            });
            const meta = await this.files.getFileMeta(fileid).catch(console.error);           
             
              if(ada === undefined){
                this.loadBlankFile();

              }else if(meta === undefined){
                this.files.setCurrentFileInfo(fileid, 'file name not found', '');
                this.prepAndLoadFile('file name not found', fileid, '', ada);
              
              }else{

                this.files.setCurrentFileInfo(fileid, meta.name, meta.desc);
                this.prepAndLoadFile(meta.name, fileid, meta.desc, ada);
              }

          }else{
              console.log("LOOKING FOR ADA FILE")
             this.auth.getMostRecentAdaFromUser(user).then(async adafile => {
                console.log("ADA FILE IS ", adafile)
                if(adafile !== null){
                    let fileid = await this.files.convertAdaToFile(user.uid, adafile); 
                    console.log("convert ada to file id ", fileid)
            
                    let ada = await this.files.getFile(fileid);
                    let meta = await this.files.getFileMeta(fileid);           
                    
                    if(ada === undefined){
                      this.loadBlankFile();
                    }else if(meta === undefined){
                      this.files.setCurrentFileInfo(fileid, 'file name not found', '');
                      this.prepAndLoadFile('file name not found', fileid, '', ada);
      
                    }else{
                      this.files.setCurrentFileInfo(fileid, meta.name, meta.desc);
                      this.prepAndLoadFile(meta.name, fileid, meta.desc, ada);
                    }

                }else{
                  console.log("load blank")
                  this.loadBlankFile();
                  return;
                }
             });
          }
        }) 

      }else{
        
        //this.loadBlankFile();
        this.saveFile();
        this.files.writeNewFileMetaData(user.uid, this.files.current_file_id, this.files.current_file_name, this.files.current_file_desc)

    
      }
      
    }
  }

    /**
   * this is called when paste is called and has loaded in the data from the copy event. 
   * @param result 
   */
    insertPasteFile(result: LoadResponse){
      this.processFileData(result.data).then(data => {
        this.palette.changeDesignmode('move');
        this.saveFile();

      }
  
      ).catch(console.error);
      
    }

  /**
   * this gets called when a new file is started from the topbar or a new file is reload via undo/redo
   * @param result 
   */
  loadNewFile(result: LoadResponse){

    //DO NOT CALL CLEAR ALL HERE AS IT WILL OVERWRITE LOADED FILE DATA
    console.log("LOADING ", result)

    this.files.setCurrentFileInfo(result.id, result.name, result.desc);
    

    this.processFileData(result.data).then(data => {
      this.palette.changeDesignmode('move');
      this.saveFile();
    }

    ).catch(e => {
      console.log("CAUGHT ERROR through from process file data")
    });
    
  }

  async loadFromDB(fileid: number){
    this.clearAll();


    const ada = await this.files.getFile(fileid);
    const meta = await this.files.getFileMeta(fileid);           
    this.files.setCurrentFileInfo(fileid, meta.name, meta.desc);
    this.prepAndLoadFile(meta.name, fileid, meta.desc, ada);
    this.saveFile();
    
  }

  loadBlankFile(){
    this.clearAll();
    this.files.setCurrentFileInfo(this.files.generateFileId(), 'load blank', '');
    this.saveFile();
    
  }

  deleteCurrentFile(){
    this.clearAll();
    if(this.files.file_tree.length > 0){
      this.loadFromDB(this.files.file_tree[0].id)
    }else{
      this.files.setCurrentFileInfo(this.files.generateFileId(), 'new blank file', '');
    }
    this.saveFile();
  }

  saveFile(){
        //if this user is logged in, write it to the
        this.fs.saver.ada(
          'mixer', 
          true,
          this.zs.zoom)
          .then(so => {
            this.ss.addMixerHistoryState(so);
          });
  }



  /**
   * this gets called when a new file is started from the topbar
   * @param result 
   */
   importNewFile(result: LoadResponse){
    

    this.processFileData(result.data)
    .then( data => {
      this.palette.changeDesignmode('move')
      this.clearAll();

      console.log("imported new file", result, result.data)
      })
      .catch(console.error);
    
  }


  printTreeStatus(name: string, treenode: Array<TreeNode>){

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
   async processFileData(data: FileObj) : Promise<string|void>{
    this.loading = true;

    let entry_mapping = [];


    this.updateOrigin(this.ws.selected_origin_option)

    //start processing images first thing 
    const images_to_load = [];
   
    data.ops.forEach(op => {
      const internal_op = this.ops.getOp(op.name); 
      if(internal_op === undefined || internal_op == null|| internal_op.params === undefined) return;
      const param_types = internal_op.params.map(el => el.type);
      param_types.forEach((p, ndx) => {
        if(p === 'file'){
          images_to_load.push(op.params[ndx]);
        } 
      });
    })



    return this.image.loadFiles(images_to_load).then(el => {
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
     

      const seeds: Array<{entry, id, draft, loom, loom_settings, render_colors}> = seednodes
      .map(sn =>  {


         let d:Draft =null;
         let render_colors = true;
 
        const draft_node = data.nodes.find(node => node.node_id === sn.prev_id);
        //let d: Draft = initDraft();
        let l: Loom = {
          id: utilInstance.generateId(8),
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
            d = copyDraft(located_draft.draft);
            ls = copyLoomSettings(located_draft.loom_settings);
            l = copyLoom(located_draft.loom);
            if(located_draft.render_colors !== undefined) render_colors = located_draft.render_colors; 
          } 

        }else{
          console.error("draft node could not be found")
        }

  
        if(d !== null && d !== undefined){
          d.id = (sn.cur_id); //do this so that all draft ids match the component / node ids
        }else{
          d = initDraftWithParams({warps: 1, wefts: 1, drawdown: [[false]]});
          d.id = (sn.cur_id);
        }

          return {
            entry: sn,
            id: sn.cur_id,
            draft: d,
            loom: l,
            loom_settings: ls,
            render_colors: render_colors
            }
        
      });

      
      const seed_fns = seeds.map(seed => this.tree.loadDraftData(seed.entry, seed.draft, seed.loom,seed.loom_settings, seed.render_colors));
  
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
          el.draft = initDraftWithParams({warps: 1, wefts: 1, pattern: [[createCell(false)]]});
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
            this.palette.loadOperation(op.id, op.name, op.params, op.inlets, data.nodes.find(el => el.node_id === entry.prev_id).topleft, data.scale);
            break;
          case 'cxn':
            this.palette.loadConnection(node.id)
            break;
        }
      })


    })
    // ).then(el => {
    //   return this.tree.nodes.forEach(node => {
    //     if(!(node.component === null || node.component === undefined)) return;
    //     switch (node.type){
    //       case 'cxn':
    //         this.palette.loadConnection(node.id)
    //         break;
    //     }
    //   })
    // })
    .then(el => {

      //NOW GO THOUGH ALL DRAFT NODES and ADD IN DATA THAT IS REQUIRED
      data.draft_nodes
      .forEach(np => {
        const new_id = entry_mapping.find(el => el.prev_id === np.node_id);
        const node = this.tree.getNode(new_id.cur_id);
        if(node === undefined) return;

       (<DraftNode> node).draft.ud_name = np.draft_name;
       (<DraftNode> node).loom_settings = np.loom_settings; 
       if(np.render_colors !== undefined) (<DraftNode> node).render_colors = np.render_colors; 
      })

      // const dn = this.tree.getDraftNodes();
      // dn.forEach(node => {
      //   console.log("RES", node.draft, node.loom, node.loom_settings)
      // })

      data.notes.forEach(note => {
        this.palette.createNote(note);
    });
  

    })
    .then(res => {
      // this.palette.rescale(data.scale);
      this.loading = false;
      return Promise.resolve('alldone')
    })
    .catch(e => {
      this.loading = false;
      console.log("ERROR THOWN in process", e)
    });


    //print out all trees:




  }

 

  /**
   * Called from import bitmaps to drafts features. The drafts have already been imported and sent to this function, 
   * which now needs to draw them to the workspace
   * @param drafts 
   */
  loadDrafts(drafts: any){
    const loom:Loom = {
      id: utilInstance.generateId(8),
      threading:[],
      tieup:[],
      treadling: []
    };

    const loom_settings:LoomSettings = {
      type:this.ws.type,
      epi: this.ws.epi,
      units: this.ws.units,
      frames: this.ws.min_frames,
      treadles: this.ws.min_treadles
      
    }

    let topleft = this.vp.getTopLeft();

    let max_h = 0;
    let cur_h = topleft.y + 20; //start offset from top
    let cur_w = topleft.x + 50;
    let zoom_factor = defaults.mixer_cell_size / this.zs.zoom;
    let x_margin = 20 / zoom_factor;
    let y_margin = 40 / zoom_factor;

    let view_width = this.vp.getWidth() * zoom_factor;

    drafts.forEach(draft => {
      
      
      const id = this.tree.createNode("draft", null, null);
      this.tree.loadDraftData({prev_id: null, cur_id: id,}, draft, loom, loom_settings, true);
      this.palette.loadSubDraft(id, draft, null, null, this.zs.zoom);

      //position the drafts so that they don't all overlap. 
       max_h = (wefts(draft.drawdown)*defaults.mixer_cell_size > max_h) ? wefts(draft.drawdown)*defaults.mixer_cell_size : max_h;
      
       let approx_w = warps(draft.drawdown);

       //300 because each draft is defined as having min-width of 300pm
       let w = (approx_w*defaults.mixer_cell_size > 300) ? approx_w *defaults.mixer_cell_size : 300 / zoom_factor;

       let dn = this.tree.getNode(id);
       dn.component.topleft = {x: cur_w, y: cur_h};
       
       cur_w += (w + x_margin);
       if(cur_w > view_width){
        cur_w = topleft.x + 50;
        cur_h += (max_h+y_margin);
        max_h = 0;
       }


    });

    this.palette.addTimelineState();

    
  }


  loadExampleAtURL(name: string){
    const analytics = getAnalytics();
    logEvent(analytics, 'onurl', {
      items: [{ uid: this.auth.uid, name: name }]
    });

    this.http.get('assets/examples/'+name+".ada", {observe: 'response'}).subscribe((res) => {
      console.log(res);
      if(res.status == 404) return;

      this.clearAll();
      return this.fs.loader.ada(name, -1, '', res.body)
     .then(loadresponse => {
       this.loadNewFile(loadresponse)
     });
    }); 
  }


  prepAndLoadFile(name: string, id: number, desc: string, ada: any) : Promise<any>{
    this.clearAll();
      return this.fs.loader.ada(name, id,desc, ada).then(lr => {
        this.loadNewFile(lr);
      });
  }



  clearView() : void {

    if(this.palette !== undefined) this.palette.clearComponents();
    this.vp.clear();

  }

  clearAll() : void{

    this.clearView();
    this.tree.clear();
    this.ss.clearTimeline();
    this.notes.clear();
    this.ms.reset();

  }



  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  undo() {

    let so: SaveObj = this.ss.restorePreviousMixerHistoryState();
    if(so === null || so === undefined) return;
    this.clearAll();
    this.fs.loader.ada(this.files.current_file_name, this.files.current_file_id, this.files.current_file_desc, so).then(lr => {
      this.loadNewFile(lr)
    }
    
    );

  
  }

  redo() {

    let so: SaveObj = this.ss.restoreNextMixerHistoryState();
    if(so === null || so === undefined) return;
    this.clearAll();
    this.fs.loader.ada(this.files.current_file_name, this.files.current_file_id,this.files.current_file_desc,  so)
    .then(lr =>  this.loadNewFile(lr));

   
  }

  onCopySelections(){
    const selections = this.multiselect.copySelections();
    this.selected_nodes_copy = selections;
  }

  onPasteSelections(){

    //check to make sure something has been copied
    if(this.multiselect.copy == undefined) return;

    this.multiselect.copy.then(ada => {

      return this.fs.loader.paste(ada).then(lr => {
        this.insertPasteFile(lr);
      });
    })

   
   

    this.multiselect.clearSelections();
    
  }

  togglePanMode(){
    if(this.dm.isSelected('pan', "design_modes")){
      this.dm.selectDesignMode('move', 'design_modes');
    }else{
      this.dm.selectDesignMode('pan', 'design_modes');
    }
    this.palette.designModeChanged();
    //this.show_viewer = true;

  }

  toggleSelectMode(){
    if(this.dm.isSelected('marquee', "design_modes")){
      this.dm.selectDesignMode('move','design_modes');

    }else{
      this.dm.selectDesignMode('marquee','design_modes');

    }

    this.palette.designModeChanged();
  }

  


    operationAdded(name:string){
      this.palette.addOperation(name);
    }


  /**
   * this is called when a user pushes save from the topbar
   * @param event 
   */
  public async onSave(e: any) : Promise<any>{

    const link = document.createElement('a')


    switch(e.type){
      case 'jpg': 

      return this.fs.saver.jpg(this.palette.getPrintableCanvas(e))
      .then(href => {
        link.href= href;
        link.download = this.files.current_file_name + ".jpg";
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
        this.zs.zoom).then(out => {
          link.href = "data:application/json;charset=UTF-8," + encodeURIComponent(out.json);
          link.download =  this.files.current_file_name + ".ada";
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
   */
  public renderChange(old_zoom: number) {
    this.palette.rescale(old_zoom);
  }


  /**
   * Updates the canvas based on the weave view.
   */
   public zoomChangeExternal(event: any) {
    this.palette.rescale(event.old_zoom);
  }




  public notesChanged(e:any) {
    console.log(e);
    //this.draft.notes = e;
  }

 


  public toggleCollapsed(){
    this.collapsed = !this.collapsed;
  }

  public createNote(){
    this.palette.createNote(null);
  }
  /**
   * called when the user adds a new draft from the sidebar
   * @param obj 
   */
  public newDraftCreated(obj: any){
    const id = this.tree.createNode("draft", null, null);
    this.tree.loadDraftData({prev_id: null, cur_id: id,}, obj.draft, obj.loom, obj.loom_settings, true);
    this.palette.loadSubDraft(id, obj.draft, null, null, this.zs.zoom);
    //id: number, d: Draft, nodep: NodeComponentProxy, draftp: DraftNodeProxy,  saved_scale: number
  }


  /**
   * something in the materials library changed, check to see if
   * there is a modal showing materials open and update it if there is
   */
   public materialChange() {
    
    this.palette.redrawAllSubdrafts();

    if(this.show_details){
      this.details.redrawSimulation();
    }

    this.saveFile();
 }


 /**
  * the origin must be updated after the file has been loaded. 
  * @param selection 
  */
 updateOrigin(selection: number){
  this.selected_origin = selection
  
 }



/**
 * when the origin changes, all drafts on the canavs should be modified to the new position
 * origin changes can ONLY happen on globals
 * flips must be calculated from the prior state
 * @param e 
 */
originChange(e:any){


  const flips = utilInstance.getFlips(this.selected_origin, e.value);
  this.selected_origin = e.value;
  this.ws.selected_origin_option = this.selected_origin;
  
  const dn: Array<DraftNode> = this.tree.getDraftNodes();
  const data = dn.map(node => {
    return {
    draft: node.draft, 
    loom: node.loom, 
    horiz: flips.horiz,
    vert: flips.vert}
  });

  // dn.forEach(node => {
  //  if(node.loom !== null) console.log(node.loom.treadling)
  // })

  const draft_fns = data.map(el => flipDraft(el.draft, el.horiz, el.vert));

  return Promise.all(draft_fns)
  .then(res => {
    for(let i = 0; i < dn.length; i++){
      dn[i].draft = <Draft>{
        id: res[i].id,
        gen_name: res[i].gen_name,
        ud_name: res[i].ud_name,
        drawdown: res[i].drawdown,
        rowShuttleMapping: res[i].rowShuttleMapping,
        rowSystemMapping: res[i].rowSystemMapping,
        colShuttleMapping: res[i].colShuttleMapping,
        colSystemMapping: res[i].colSystemMapping
      };
    }
    const loom_fns = data.map(el => flipLoom(el.loom, el.horiz, el.vert))
    return Promise.all(loom_fns)
  .then(res => {
    for(let i = 0; i < dn.length; i++){
      if(res[i] !== null){
        dn[i].loom = {
          id: res[i].id,
          threading: res[i].threading.slice(),
          tieup: res[i].tieup.slice(),
          treadling: res[i].treadling.slice()
        }
      }
    }
  }).then(out => {
    this.saveFile();
  })



})

  


}




epiChange(f: NgForm) {


  if(!f.value.epi){
    f.value.epi = 1;
    this.epi = f.value.epi;
  } 
  
  //this.loom.overloadEpi(f.value.epi);
  this.ws.epi = f.value.epi;



}



/**
 * when a user selects a new loom type, the software will pull all subdrafts and update their loom information 
 * @param e 
 * @returns 
 */
loomChange(e:any){

   this.ws.type = e.value.loomtype;
  if(this.ws.type === 'jacquard') this.dm.selectDesignMode('drawdown', 'drawdown_editing_style')
  else this.dm.selectDesignMode('loom', 'drawdown_editing_style') 
  
  const dn: Array<DraftNode> = this.tree.getDraftNodes();
  dn.forEach(node => {
    node.loom_settings.type = e.value.loomtype; 
  })


}

  unitChange(e:any){
    
      this.ws.units = e.value.units;


  }

  showDraftDetails(id: number){
    this.dm.selectDesignMode('toggle','draw_modes')
    this.detail_drawer.open().then(res => {
       this.details.loadDraft(id);
    })


  }



}