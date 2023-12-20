import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Optional, ViewChild } from '@angular/core';
import { getAnalytics, logEvent } from '@angular/fire/analytics';
import { createCell } from './core/model/cell';
import { Draft, DraftNode, DraftNodeProxy, FileObj, LoadResponse, Loom, LoomSettings, NodeComponentProxy, SaveObj, TreeNode, TreeNodeProxy } from './core/model/datatypes';
import { copyDraft, initDraftWithParams } from './core/model/drafts';
import { copyLoom, copyLoomSettings } from './core/model/looms';
import utilInstance from './core/model/util';
import { AuthService } from './core/provider/auth.service';
import { FileService } from './core/provider/file.service';
import { FilesystemService } from './core/provider/filesystem.service';
import { ImageService } from './core/provider/image.service';
import { MaterialsService } from './core/provider/materials.service';
import { OperationService } from './core/provider/operation.service';
import { StateService } from './core/provider/state.service';
import { TreeService } from './core/provider/tree.service';
import { WorkspaceService } from './core/provider/workspace.service';
import { DraftDetailComponent } from './draftdetail/draftdetail.component';
import { MixerComponent } from './mixer/mixer.component';
import { MultiselectService } from './mixer/provider/multiselect.service';
import { ZoomService } from './mixer/provider/zoom.service';
import { SimulationComponent } from './simulation/simulation.component';
import { Auth, authState, User } from '@angular/fire/auth';
import { ViewportService } from './mixer/provider/viewport.service';
import { FormControl } from '@angular/forms';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit{
  title = 'app';

  @ViewChild(MixerComponent) mixer;
  @ViewChild(DraftDetailComponent) details;
  @ViewChild(SimulationComponent) sim;
  
  
  loading: boolean;
  selected_origin: number;
  active_file: number;
  tabs = ['Filename1', 'Filename 2', 'Filename 3'];
  ui = {
    main: 'mixer',
    fullscreen: false
  };
  views = [];


  constructor(
    private auth: AuthService,
    private ss: StateService,
    @Optional() private fbauth: Auth,
    private files: FilesystemService,
    private fs: FileService,
    private http: HttpClient,
    private image: ImageService,
    private ms: MaterialsService,
    private multiselect: MultiselectService,
    private ops: OperationService,
    private tree: TreeService,
    public vp: ViewportService,
    private ws: WorkspaceService,
    private zs: ZoomService
  ){

    this.active_file = -1;

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
 
    this.views = [
      {
        name: 'mixer',
        div: document.getElementById('mixer')
      },
      {
        name: 'detail',
        div: document.getElementById('detail')
      },
      {
        name: 'sim',
        div: document.getElementById('sim')
      }



    ]

  }

  addTab(selectAfterAdding: boolean) {
    this.tabs.push('New');

    // if (selectAfterAdding) {
    //   this.selected.setValue(this.tabs.length - 1);
    // }
  }


  clearAll() : void{

    this.mixer.clearView();
    this.tree.clear();
    this.ss.clearTimeline();
    this.mixer.clear();
    this.ms.reset();

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
    this.mixer.updatePaletteFromDetailView(obj);
    this.saveFile();
  }


  detailViewChange(){
    console.error("FUNCTION DIABLED")
   // this.details.weaveRef.rescale(this.render.getZoom());

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


  collapseFullScreen(){
    this.ui.fullscreen = false;
    this.focusUIView(this.ui.main, true)
  }

  focusUIView(view: string, forceCollapse: boolean){
    let main_width = '67%';
    let side_width = '33%';
    let main_height = '100%';
    let side_height = '50%';

    console.log("THIS VIEWS ", this.views)
    console.log("THIS UI ", this.ui)

    let main_div = this.views.find(el => el.name == view);
    let side_divs = this.views.filter(el => el.name != view)

    
    if(this.ui.main == view && !forceCollapse){
      this.ui.fullscreen = true;
      main_div.div.style.height = '100%';
      main_div.div.style.width = '100%';
      main_div.div.style.order = '1';

      side_divs.forEach(viewitem => {
        viewitem.div.style.display = "none";
      })
      
    }else{
      this.ui.main = view;
      main_div.div.style.height = main_height;
      main_div.div.style.width = main_width;
      main_div.div.style.order = '1';
      main_div.div.style.display = "flex";

      side_divs.forEach((viewitem, ndx) => {
        viewitem.div.style.height = side_height;
        viewitem.div.style.width = side_width;
        let order = ndx+2;
        viewitem.div.style.order = ''+order+'';
        viewitem.div.style.display = "flex";      
      })

    }



  }






    /**
   * this gets called when a new file is started from the topbar
   * @param result 
   */
    importNewFile(result: LoadResponse){
    

      this.processFileData(result.data)
      .then( data => {
        this.mixer.changeDesignmode('move')
        this.clearAll();
  
        console.log("imported new file", result, result.data)
        })
        .catch(console.error);
      
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

  insertPasteFile(result: LoadResponse){
    this.processFileData(result.data).then(data => {
      this.mixer.changeDesignmode('move');
      this.saveFile();

    }

    ).catch(console.error);
  }


  isBlankWorkspace() : boolean {
    return this.tree.nodes.length == 0;
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




  /**
   * this gets called when a new file is started from the topbar or a new file is reload via undo/redo
   */
  loadNewFile(result: LoadResponse){

    //DO NOT CALL CLEAR ALL HERE AS IT WILL OVERWRITE LOADED FILE DATA
    this.files.setCurrentFileInfo(result.id, result.name, result.desc);
    

    this.processFileData(result.data).then(data => {
     // this.palette.changeDesignmode('move');
      this.saveFile();
    }

    ).catch(e => {
      console.log("CAUGHT ERROR through from process file data")
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
 * something in the materials library changed, check to see if
 * there is a modal showing materials open and update it if there is
 */
  public materialChange() {
  
    this.mixer.materialChange();
    this.details.redrawSimulation();
    this.saveFile();
  }


  onCopySelections(){
    this.mixer.onCopySelections();
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


  /**
 * the drafts stored in adacad are ALWAYs oriented with 0,0 as the top left corner
 * any origin change is merely the rendering flipping the orientation. 
 * when the global settings change, the data itself does NOT need to change, only the rendering
 * @param e 
 */
originChange(e:any){


  this.selected_origin = e.value;
  this.ws.selected_origin_option = this.selected_origin;
  this.mixer.originChange(); //force a redraw so that the weft/warp system info is up to date
  this.saveFile();



}


prepAndLoadFile(name: string, id: number, desc: string, ada: any) : Promise<any>{
  this.clearAll();
    return this.fs.loader.ada(name, id,desc, ada).then(lr => {
      this.loadNewFile(lr);
    });
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
    
      console.log("SEED NODES ", seednodes)

    const seeds: Array<{entry, id, draft, loom, loom_settings, render_colors}> = seednodes
    .map(sn =>  {


        let d:Draft =null;
        let loom:Loom = null;
        let render_colors = true;

      const draft_node = data.nodes.find(node => node.node_id === sn.prev_id);

      console.log("FOUND DRAFT NODE ", draft_node, data.draft_nodes)
      // let l: Loom = {
      //   id: utilInstance.generateId(8),
      //   treadling: [],
      //   tieup: [],
      //   threading: []
      // }

      let ls: LoomSettings = {
        frames: this.ws.min_frames,
        treadles: this.ws.min_treadles,
        epi: this.ws.epi,
        units: this.ws.units,
        type: this.ws.type
      }

      if(draft_node !== undefined){

        const located_draft:DraftNodeProxy = data.draft_nodes.find(draft => draft.draft_id === draft_node.node_id);

        if(located_draft === undefined){
          console.log("Looking for ", draft_node.node_id,"in", data.draft_nodes.map(el => el.draft_id))
          console.error("could not find draft with id in draft list");
        }
        else{
          d = copyDraft(located_draft.draft)
          ls = copyLoomSettings(located_draft.loom_settings);
          loom = copyLoom(located_draft.loom);
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
          loom: loom,
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
          
          this.mixer.loadSubDraft(node.id, this.tree.getDraft(node.id), data.nodes.find(el => el.node_id === entry.prev_id), data.draft_nodes.find(el => el.node_id === entry.prev_id), data.scale);
          break;
        case 'op':
          const op = this.tree.getOpNode(node.id);
          this.mixer.loadOperation(op.id, op.name, op.params, op.inlets, data.nodes.find(el => el.node_id === entry.prev_id).topleft, data.scale);
          break;
        case 'cxn':
          this.mixer.loadConnection(node.id)
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
      (<DraftNode> node).loom = copyLoom(np.loom); 
      if(np.render_colors !== undefined) (<DraftNode> node).render_colors = np.render_colors; 
    })

    // const dn = this.tree.getDraftNodes();
    // dn.forEach(node => {
    //   console.log("RES", node.draft, node.loom, node.loom_settings)
    // })

    data.notes.forEach(note => {
      this.mixer.createNote(note);
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


redo() {

  let so: SaveObj = this.ss.restoreNextMixerHistoryState();
  if(so === null || so === undefined) return;
  this.clearAll();
  this.fs.loader.ada(this.files.current_file_name, this.files.current_file_id,this.files.current_file_desc,  so)
  .then(lr =>  this.loadNewFile(lr));

 
}

removeTab(index: number) {
  this.tabs.splice(index, 1);
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

showDraftDetails(id: number){
  console.log("SHOW DRAFT DETAILS")
  // this.dm.selectDesignMode('toggle','draw_modes')
  // this.detail_drawer.open().then(res => {
  //    this.details.loadDraft(id);
  // })


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

   /**
    * the origin must be updated after the file has been loaded. 
    * @param selection 
    */
  updateOrigin(selection: number){
    this.selected_origin = selection
    
  }

  updateMixerView(event: any){
    this.mixer.renderChange(event);
  }


}
