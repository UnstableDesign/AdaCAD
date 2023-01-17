import { ScrollDispatcher } from '@angular/cdk/overlay';
import { HttpClient } from '@angular/common/http';
import { Component, enableProdMode, HostListener, OnInit, Optional, ViewChild } from '@angular/core';
import { getAnalytics, logEvent } from '@angular/fire/analytics';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { InitModal } from '../core/modal/init/init.modal';
import { Cell } from '../core/model/cell';
import { DesignMode, Draft, DraftNode, FileObj, LoadResponse, Loom, LoomSettings, NodeComponentProxy, SaveObj, TreeNode, TreeNodeProxy } from '../core/model/datatypes';
import { copyDraft, flipDraft, initDraftWithParams } from '../core/model/drafts';
import { copyLoom, copyLoomSettings, flipLoom } from '../core/model/looms';
import { AuthService } from '../core/provider/auth.service';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { FileService } from '../core/provider/file.service';
import { ImageService } from '../core/provider/image.service';
import { MaterialsService } from '../core/provider/materials.service';
import { NotesService } from '../core/provider/notes.service';
import { OperationService } from '../core/provider/operation.service';
import { StateService } from '../core/provider/state.service';
import { SystemsService } from '../core/provider/systems.service';
import { TreeService } from '../core/provider/tree.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { SidebarComponent } from '../core/sidebar/sidebar.component';
import { FilebrowserComponent } from '../core/filebrowser/filebrowser.component';
import { OpsComponent } from './modal/ops/ops.component';
import { PaletteComponent } from './palette/palette.component';
import { SubdraftComponent } from './palette/subdraft/subdraft.component';
import { ViewportService } from './provider/viewport.service';
import { ZoomService } from './provider/zoom.service';
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from '@angular/material/tooltip';
import { NgForm } from '@angular/forms';
import utilInstance from '../core/model/util';
import { FilesystemService } from '../core/provider/filesystem.service';
import { getDatabase, ref as fbref, set as fbset, onValue, query, orderByChild, ref, get as fbget } from '@angular/fire/database';
import { Auth, authState, createUserWithEmailAndPassword, GoogleAuthProvider, signInAnonymously, signInWithEmailAndPassword, signInWithPopup, signOut, User } from '@angular/fire/auth';

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
  @ViewChild(SidebarComponent) view_tool;

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



/**
   * Change to draw mode on keypress d
   * @returns {void}
   */
 @HostListener('window:keydown', ['$event'])
 private keyEventDetected(e) {

   if(e.key =="=" && e.metaKey){
    const old_zoom = this.zs.zoom;
    this.zs.zoomIn();
    this.renderChange(old_zoom);
    e.preventDefault();
   }

   if(e.key =="-" && e.metaKey){
    const old_zoom = this.zs.zoom;
    this.zs.zoomOut();
    this.renderChange(old_zoom);
    e.preventDefault();
   }

   if(e.key =="/" && e.metaKey){
    const op_modal = this.dialog.open(OpsComponent,
      {disableClose: true,
        maxWidth:350, 
        hasBackdrop: false,
      data: {searchOnly: true}});
  
  
        op_modal.componentInstance.onOperationAdded.subscribe(event => { this.operationAdded(event)});
  
  
        op_modal.afterClosed().subscribe(result => {
          //this.onLoomChange.emit();
         // dialogRef.componentInstance.onChange.removeSubscription();
      });
   }

  //  if(e.key =="o" && e.metaKey){
  //   console.log("Save")
  //  }


   if(e.key =="s" && e.metaKey){
    this.fs.saver.ada(
      'mixer', 
      true,
      this.zs.zoom)
      .then(so => {
        this.ss.addMixerHistoryState(so);
      });
      e.preventDefault();
   }

   if(e.key =="z" && e.metaKey){
    console.log("");
    this.undo();
   }

   if(e.key =="y" && e.metaKey){
    console.log("Redo");
    this.redo();
    e.preventDefault();
   }










  //  //make sure the path doesn't change if we're typing
  //  const from_ta = e.path.find(el => el.localName === 'textarea');

  //  if(from_ta !== undefined){
  //    return;
  //  } 
   

  //  this.dm.selectDesignMode('draw', 'design_modes');
  //  this.designModeChange('draw');
 }

 /**
   * The weave Timeline object.
   * @property {Timeline}
   */

   viewonly: boolean = false;

   manual_scroll: boolean = false;

  private unsubscribe$ = new Subject();

  collapsed:boolean = false;

  scrollingSubscription: any;

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
    @Optional() private fbauth: Auth,
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
    
    this.vp.setAbsolute(16380, 16380); //max size of canvas, evenly divisible by default cell size
   

    

    //subscribe to the login event and handle what happens in that case 

    if (auth) {
      // console.log("in constrcutor AUTH IS ", this.fbauth.currentUser)
      // this.initLoginLogoutSequence(this.fbauth.currentUser);

      authState(this.fbauth).subscribe(async user => {
        this.initLoginLogoutSequence(user);
      });

   }



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
    }

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
  


  isBlankWorkspace() : boolean {
    return this.tree.nodes.length == 0;
  }



  initLoginLogoutSequence(user:User) {
    console.log("IN LOGIN/LOGOUT ", user)
    if(user === null){
      //this is a logout event
      console.log("MIXER // USER LOGGED OUT")
      this.files.setCurrentFileInfo(this.files.generateFileId(), 'blank draft','');



    }else{
      console.log("MIXER // USER LOGGED IN")

      if(this.auth.isFirstSession() || (!this.auth.isFirstSession() && this.isBlankWorkspace())){

        this.auth.getMostRecentFileIdFromUser(user).then(fileid => {
          console.log("LOADING FILE ID", fileid)
          if(fileid !== null){
            const details = [this.files.getFile(fileid), this.files.getFileMeta(fileid)]
            Promise.all(details).then(data => {
              if(data[0] === undefined || data[1] === undefined){
                this.files.setCurrentFileInfo(fileid, 'file not found', '');                
                return Promise.reject("file not found");
              }else{
                let ada = data[0];
                let meta = data[1];
                this.files.updateFileMetaOnOpen(user.uid,fileid);
                this.files.setCurrentFileInfo(fileid, meta.name, meta.desc);
                return this.prepAndLoadFile(meta.name, fileid, meta.desc, ada);
              }
            }).catch(console.error);

          }else{
            
             this.auth.getMostRecentAdaFromUser(user).then(async ada => {

              if(ada !== null){
                  let fileid = await this.files.convertAdaToFile(user.uid, ada); 
                  const details = [this.files.getFile(fileid), this.files.getFileMeta(fileid)]
                  Promise.all(details).then(async data => {

                    if(data[0] === undefined || data[1] === undefined){
                      const fileid =  await this.files.createFile(user.uid);
                      this.files.setCurrentFileInfo(fileid, 'recovered file', '')
                      return  this.prepAndLoadFile('recovered file', fileid,'', ada);
                    }else{
                      let meta = data[1];
                      this.files.updateFileMetaOnOpen(user.uid,fileid);
                      this.files.setCurrentFileInfo(fileid, meta.name, meta.desc)
                      return this.prepAndLoadFile(meta.name, fileid, meta.desc, ada);
                    }
                  }).catch(console.error);
              }else{

                let newid = await this.files.createFile(user.uid);
                this.files.setCurrentFileInfo(newid, 'blank', '');
                this.files.updateFileMetaOnOpen(user.uid,fileid);

                console.log("set current space to ", newid)
                return;
              }
             });
          }
        }) 

      }else{
        //login is taking place mid session with data already created. 
        const fileid = this.files.generateFileId();
        this.fs.saver.ada(
          'mixer', 
          false,
          this.zs.zoom)
          .then(so => {
            this.files.writeFileData(user.uid, fileid, so)

          });
       }
      
    }
  }


  /**
   * this gets called when a new file is started from the topbar or a new file is reload via undo/redo
   * @param result 
   */
  loadNewFile(result: LoadResponse){
    console.log("LOADING NEW FILE", result)
    this.clearView();
    this.tree.clear();
    this.ss.clearTimeline();


    this.files.setCurrentFileId(result.id);
    this.files.current_file_name = result.name;
    this.files.current_file_desc = result.desc;
    

    this.processFileData(result.data).then(data => {
      this.palette.changeDesignmode('move');
    }

    ).catch(console.error);
    
  }

  loadBlankFile(){
    console.log("LOADING Empty FILE")
    this.clearView();
    this.tree.clear();
    this.ss.clearTimeline();

    this.files.setCurrentFileId(this.files.generateFileId());
    this.files.current_file_name = "new workspace";
    this.files.current_file_desc = "";


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
   async processFileData(data: FileObj) : Promise<string|void>{


    let entry_mapping = [];
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
            d = copyDraft(located_draft.draft);
            ls = copyLoomSettings(located_draft.loom_settings);
            l = copyLoom(located_draft.loom);
            if(located_draft.render_colors !== undefined) render_colors = located_draft.render_colors; 
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
        loom_settings: ls,
        render_colors: render_colors
        }
      });

      

      // console.log("ALL TREADLING in Mixer");
      // seeds.forEach(node => {
      //   console.log(node.loom.treadling)
      // })
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
    .then(data => {return Promise.resolve('alldone')})
    .catch(console.error);


    //print out all trees:




  }

 

  


  loadExampleAtURL(name: string){
    const analytics = getAnalytics();
    logEvent(analytics, 'onurl', {
      items: [{ uid: this.auth.uid, name: name }]
    });

    this.http.get('assets/examples/'+name+".ada", {observe: 'response'}).subscribe((res) => {
      console.log(res);
      if(res.status == 404) return;
      return this.fs.loader.ada(name, -1, '', res.body)
     .then(loadresponse => {
       this.loadNewFile(loadresponse)
     });
    }); 
  }


  // loadLoggedInUser(){

  //   this.auth.user.subscribe(user => {

  //     if(user === null){

  //       const dialogRef = this.dialog.open(InitModal, {
  //         data: {source: 'mixer'}
  //       });


  //       dialogRef.afterClosed().subscribe(loadResponse => {
  //         this.palette.changeDesignmode('move');
  //         if(loadResponse !== undefined){
  //           if(loadResponse.status == -1){
  //             this.clearAll();
  //           }
  //           else{
  //             this.loadNewFile(loadResponse);
  //           }
  //         } 
        
    
  //      });
  //     }else{

  //       //in the case someone logs in mid way through, don't replace their work. 
  //       if(this.tree.nodes.length > 0){
  //         this.files.generateFileId();
  //         return;
  //       } 

  //       this.files.getOnLoadDefaultFile().then(ada => {
  //         this.fs.loader.ada(this.files.current_file_name, this.files.current_file_id, this.files.current_file_desc, ada).then(lr => {
  //           this.loadNewFile(lr);
  //         });
  //       }).catch((error) => {
  //        console.error(error);
  //       });
  //     }
  //   });
      

  // }


  prepAndLoadFile(name: string, id: number, desc: string, ada: any) : Promise<any>{
      return this.fs.loader.ada(name, id,desc, ada).then(lr => {
        this.loadNewFile(lr);
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
    this.fs.loader.ada(this.files.current_file_name, this.files.current_file_id, this.files.current_file_desc, so).then(
      lr => this.loadNewFile(lr)
    );

  
  }

  redo() {

    let so: SaveObj = this.ss.restoreNextMixerHistoryState();
    if(so === null || so === undefined) return;

    this.fs.loader.ada(this.files.current_file_name, this.files.current_file_id,this.files.current_file_desc,  so)
    .then(lr =>  this.loadNewFile(lr));

   
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




 
  /**
   * global loom ahs just changed to be deafults, so we don't need to update specific looms based on the outcomes
   * @param e 
   */
  public globalLoomChange(e: any){
    
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
   * called when the user adds a new draft from the sidebar
   * @param obj 
   */
  public newDraftCreated(obj: any){
    console.log("NEW DRAFT ", obj)
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
    this.palette.redrawOpenModals();
    this.palette.redrawAllSubdrafts();
 }





/**
 * when the origin changes, all drafts on the canavs should be modified to the new position
 * origin changes can ONLY happen on globals
 * @param e 
 */
originChange(e:any){


  const flips = utilInstance.getFlips(this.ws.selected_origin_option, this.selected_origin);
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
          threading: res[i].threading.slice(),
          tieup: res[i].tieup.slice(),
          treadling: res[i].treadling.slice()
        }
      }
    }
  })
.then(res => {
  this.globalLoomChange({});
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



loomChange(e:any){

    this.ws.type = e.value.loomtype;
    if(this.ws.type === 'jacquard') this.dm.selectDesignMode('drawdown', 'drawdown_editing_style')
    else this.dm.selectDesignMode('loom', 'drawdown_editing_style') 
}

  unitChange(e:any){
    
      this.ws.units = e.value.units;


  }
}