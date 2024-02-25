import { HttpClient } from '@angular/common/http';
import { ApplicationRef, Component, HostListener, NgZone, OnInit, Optional, ViewChild } from '@angular/core';
import { getAnalytics, logEvent } from '@angular/fire/analytics';
import { createCell } from './core/model/cell';
import { Draft, DraftNode, DraftNodeProxy, FileObj, LoadedFile, LoadResponse, Loom, LoomSettings, NodeComponentProxy, SaveObj, TreeNode, TreeNodeProxy } from './core/model/datatypes';
import { copyDraft, initDraftWithParams } from './core/model/drafts';
import { copyLoom, copyLoomSettings } from './core/model/looms';
import { AuthService } from './core/provider/auth.service';
import { FileService } from './core/provider/file.service';
import { FilesystemService } from './core/provider/filesystem.service';
import { ImageService } from './core/provider/image.service';
import { MaterialsService } from './core/provider/materials.service';
import { OperationService } from './core/provider/operation.service';
import { StateService } from './core/provider/state.service';
import { TreeService } from './core/provider/tree.service';
import { WorkspaceService } from './core/provider/workspace.service';
import { EditorComponent } from './editor/editor.component';
import { MixerComponent } from './mixer/mixer.component';
import { MultiselectService } from './mixer/provider/multiselect.service';
import { ZoomService } from './core/provider/zoom.service';
import { Auth, authState, User } from '@angular/fire/auth';
import { ViewportService } from './mixer/provider/viewport.service';
import { FormControl } from '@angular/forms';
import { LoginComponent } from './core/modal/login/login.component';
import { MatDialog } from '@angular/material/dialog';
import { FilebrowserComponent } from './core/filebrowser/filebrowser.component';
import { LoadfileComponent } from './core/modal/loadfile/loadfile.component';
import { ExamplesComponent } from './core/modal/examples/examples.component';
import { DesignmodesService } from './core/provider/designmodes.service';
import { OperationComponent } from './mixer/palette/operation/operation.component';
import { ScrollDispatcher } from '@angular/cdk/overlay';
import { defaults, density_units, editor_modes, loom_types, origin_option_list } from './core/model/defaults';
import { MaterialModal } from './core/modal/material/material.modal';
import { ViewerComponent } from './viewer/viewer.component';
import utilInstance from './core/model/util';
import { NotesService } from './core/provider/notes.service';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit{
  title = 'app';

  @ViewChild(MixerComponent) mixer;
  @ViewChild(EditorComponent) editor;
  @ViewChild(ViewerComponent) viewer;



  //modals to manage
  filebrowser_modal: MatDialog |any;
  upload_modal: MatDialog |any;
  example_modal: MatDialog |any;
  material_modal: MatDialog |any;
  
  loading: boolean;

  selected_origin: number;
  
  ui = {
    main: 'mixer',
    fullscreen: false
  };

  views = [];

  scrollingSubscription: any;

  originOptions: any;

  loomOptions: any;
  
  unitOptions: any;

  editorModes: any;

  selected_editor_mode: any;

  selected_draft_id: number =1;

  redraw_viewer: boolean = false;

  constructor(
    public auth: AuthService,
    private dialog: MatDialog,
    private dm: DesignmodesService,
    private ss: StateService,
    @Optional() private fbauth: Auth,
    public files: FilesystemService,
    private fs: FileService,
    private http: HttpClient,
    private image: ImageService,
    private ms: MaterialsService,
    private multiselect: MultiselectService,
    private ns: NotesService,
    private ops: OperationService,
    public scroll: ScrollDispatcher,
    private tree: TreeService,
    private view_tool:ViewportService,
    public vp: ViewportService,
    public ws: WorkspaceService,
    public zs: ZoomService,
    private zone: NgZone
  ){

    
    this.originOptions = origin_option_list;
    this.loomOptions = loom_types;
    this.unitOptions = density_units;
    this.editorModes = editor_modes;
    this.selected_editor_mode = defaults.editor;

        //subscribe to the login event and handle what happens in that case 

        if (auth) {
          const success = authState(this.fbauth).subscribe(async user => {
             this.initLoginLogoutSequence(user) 
              
          })
    
       }

       this.scrollingSubscription = this.scroll
       .scrolled()
       .subscribe((data: any) => {
         this.onWindowScroll(data);
 });

  }

  private onWindowScroll(data: any) {
   // if(!this.manual_scroll){
     this.mixer.palette.handleWindowScroll(data);
    //}else{
     // this.manual_scroll = false;
   // }
  }



  ngOnInit(){

    const analytics = getAnalytics();
    logEvent(analytics, 'onload', {
      items: [{ uid: this.auth.uid }]
    });



  }



  ngAfterViewInit() {
 
    this.recenterViews();
  }



  clearAll() : void{

    this.mixer.clearView();
    this.editor.clearAll();
    this.tree.clear();
    this.ss.clearTimeline();
    this.ms.reset();

    console.log("THIS TREE ", this.tree)

  }

  /**
   * called from the editor when a new draft has been created. 
   * A new draft is created by either opening the draft editor with no draft selected
   * or opening the draft editor with a draft that has a parent (and therefore, a copy is created)
   * @param obj 
   */
  createNewDraftOnMixer(obj: any){

    const draft: Draft = obj.draft;
    const loom: Loom = obj.loom;
    const loom_settings: LoomSettings = obj.loom_settings;
    let id = this.mixer.newDraftCreated(draft, loom, loom_settings);

    console.log("CREATED DRAFT AT ", id)

    this.tree.setDraftOnly(id, draft);
    this.tree.setLoom(id, loom);
    this.tree.setLoomSettings(id, loom_settings);
    this.editor.loadDraft(id);
    this.selected_draft_id = id;

  }

   /**
   * adds a state to the timeline. This should be called 
   * each time a user performs an action that they should be able to undo/redo
   */
    addTimelineState(){
  
     this.fs.saver.ada()
        .then(so => {
          this.ss.addMixerHistoryState(so);
        });
    }
  

  /**
   * this is called when the detail view is closed. It passes an object that has three values: 
   * id: the draft id
   * clone_id: the id for the cloned draft
   * is_dirty: a boolean to note if the draft was changed at all while in detail view. 
   * @param obj 
   */
  // closeDetailViewer(obj: any){

  //   console.log("CLOSE DETAIL VIEW")
  //   this.details.windowClosed();
  //   this.mixer.updatePaletteFromDetailView(obj);
  //   this.saveFile();
  // }


  detailViewChange(){
   // this.details.weaveRef.rescale(this.render.getZoom());

  }


  /**
   * 
   */
  deleteCurrentFile(){
    // this.clearAll();
    // if(this.files.file_tree.length > 0){
    //   this.loadFromDB(this.files.file_tree[0].id)
    // }else{
    //   this.files.setCurrentFileInfo(this.files.generateFileId(), 'new blank file', '');
    //   this.open_files.push({
    //     id: this.files.current_file_id,
    //     name: this.files.current_file_name
    //   });
    // }
    // this.saveFile();
  }


  collapseFullScreen(){
    this.ui.fullscreen = false;
    this.focusUIView(this.ui.main, true)
  }

  toggleEditorMode(){

    switch(this.selected_editor_mode){
      case 'draft':
        this.mixer.onClose();
        this.editor.onFocus();
        //this.editor.centerView();

        break;
      case 'mixer':
        this.editor.onClose();
        this.mixer.onFocus();

      //  this.mixer.recenterViews();
        break;
    }


  }

  focusUIView(view: string, forceCollapse: boolean){
    // let main_width = '90%';
    // let main_height = '100%';

    // let main_div = this.views.find(el => el.name == view);

    
    // if(this.ui.main == view && !forceCollapse){
    //   this.ui.fullscreen = true;
    //   main_div.div.style.height = '100%';
    //   main_div.div.style.width = '100%';
    //   main_div.div.style.order = '1';
      
    // }else{
    //   this.ui.main = view;
    //   main_div.div.style.height = main_height;
    //   main_div.div.style.width = main_width;
    //   main_div.div.style.order = '1';
    //   main_div.div.style.display = "flex";


    // }

    // this.recenterViews();

  }

  recenterViews(){
    
    this.editor.centerView();
    this.mixer.centerView();
    // this.sim.centerView();
  }

  /**
   * this is called when a user pushes save from the topbar
   * @param event 
   */
  public async downloadWorkspace(type: any) : Promise<any>{

    const link = document.createElement('a')


    switch(type){
      // case 'jpg': 

      // //this.printMixer();

      // break;

      // case 'wif': 
      //    this.mixer.downloadVisibleDraftsAsWif();
      //    return Promise.resolve(null);
      // break;

      case 'ada': 
      this.fs.saver.ada().then(out => {
          link.href = "data:application/json;charset=UTF-8," + encodeURIComponent(out.json);
          link.download =  this.files.getCurrentFileName() + ".ada";
          link.click();
        })
      break;

      case 'bmp':
        this.mixer.downloadVisibleDraftsAsBmp();
        return Promise.resolve(null);
      break;
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
   * this is called anytime a user event is fired, 
   * TODO, if the person was LOGGED IN and now LOGGED OUT
   * @param user 
   */
  initLoginLogoutSequence(user:User) {
    console.log("IN LOGIN/LOGOUT ", user)
    /** TODO: check also if the person is online */



    let searchParams = new URLSearchParams(window.location.search);
    if(searchParams.has('ex')){
      this.loadExampleAtURL(searchParams.get('ex'));  
      return;
    }


    if(user === null){
      this.loadStarterFile();
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
        this.files.writeNewFileMetaData(user.uid, this.files.getCurrentFileId(), this.files.getCurrentFileName(), this.files.getCurrentFileDesc())

    
      }
      
    }
  }

  closeFile(fileid: number){
    let item = this.files.getLoadedFile(fileid);
    if(item == null) return;
    this.files.unloadFile(fileid)
  }



  insertPasteFile(result: LoadResponse){
    this.processFileData(result.data).then(data => {
      this.mixer.changeDesignmode('move');
      this.saveFile();

    }

    ).catch(console.error);
  }


  /**
   * this function checks if the user has already started designing so that logging in does not override. 
   * it does this by checking if there is one or viewer drafts in the tree
   * @returns 
   */
  isBlankWorkspace() : boolean {

    if(this.tree.nodes.length == 0) return true;
    else if(this.tree.nodes.length == 1){
      let node = this.tree.nodes[0];
      if(node.type == 'draft'){
        let d = this.tree.getDraft(node.id);
        let loom = this.tree.getLoom(node.id);
        return utilInstance.isBlankDraft(d, loom);
      }else{
        return false;
      }
    }else{
      return false;
    }

  }

  async switchFile(id: any){
    
    let loaded: LoadedFile = this.files.getLoadedFile(id);

    if(loaded == null) return;
    let so: SaveObj = loaded.ada;

    if(so === null || so === undefined) return;
    
    this.clearAll();
    this.fs.loader.ada(loaded.name, loaded.id,loaded.desc, so).then(lr => {
      this.loadNewFile(lr);
    });

  
  }

  //must be online
  async loadFromDB(fileid: number){
    const ada = await this.files.getFile(fileid);
    const meta = await this.files.getFileMeta(fileid); 
    this.prepAndLoadFile(meta.name, fileid, meta.desc, ada);
    this.saveFile();
    
  }

  loadBlankFile(){
    this.clearAll();
    this.files.pushToLoadedFilesAndFocus(this.files.generateFileId(), 'new file', '')
    .then(res => {

      this.saveFile();
    });
  }

 

  /**
   * loading the starter file will not clear the prior workspace as it assumes that the space is empty on first load
   */
  loadStarterFile(){

    this.files.pushToLoadedFilesAndFocus(this.files.generateFileId(), 'welcome', '').then(res => {
      this.saveFile();
    });

    
    
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

    //this file is already open in a different tab window 
    if(this.files.getLoadedFile(result.id) !== null){
      this.files.setCurrentFileId(result.id);
      this.processFileData(result.data)
      .then(data => {

        if(this.tree.nodes.length > 1){
          this.selected_editor_mode = 'mixer';
        }else{
          this.editor.generateNewBlankDraft();
        }

        this.saveFile();
      })
    }else{
      this.files.pushToLoadedFilesAndFocus(result.id, result.name, result.desc)
      .then(res => {
        return this.processFileData(result.data)
      }).then(data => {
        if(this.tree.nodes.length > 1){
          this.selected_editor_mode = 'mixer';
        }else{
          this.editor.generateNewBlankDraft();
        }

          this.saveFile();
      }).catch(e => {
        console.log(e, "CAUGHT ERROR through from process file data")
      });
    }



    
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

  logout(){
    this.auth.logout();
  }


  /**
 * something in the materials library changed, check to see if
 * there is a modal showing materials open and update it if there is
 */
  public materialChange() {
  
    this.mixer.materialChange();
    this.editor.redrawSimulation();
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

  openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '600px',
    });
  }

  openAboutDialog() {

    window.open('https://docs.adacad.org', '_blank');

  }

  /**
   * called when a user selects a file to open from the AdaFile Browser
   * @param selectOnly 
   * @returns 
   */
  openAdaFiles(selectOnly:boolean) {
      if(this.filebrowser_modal != undefined && this.filebrowser_modal.componentInstance != null) return;

    this.filebrowser_modal = this.dialog.open(FilebrowserComponent, {data: {
      selectOnly: selectOnly
     }});

    this.filebrowser_modal.componentInstance.onLoadFromDB.subscribe(event => {
      this.loadFromDB(event);
    });

    this.filebrowser_modal.componentInstance.onCreateFile.subscribe(event => {
      this.loadBlankFile();
    });





  }


  openMaterials() {
    if(this.material_modal != undefined && this.material_modal.componentInstance != null) return;

  this.material_modal = this.dialog.open(MaterialModal, {data: {}});
  this.material_modal.componentInstance.onMaterialChange.subscribe(event => {
    console.log("MATERIAL CHANGED");
    //redraw all

  });
  }


  openExamples() {
    if(this.example_modal != undefined && this.example_modal.componentInstance != null) return;

  this.example_modal = this.dialog.open(ExamplesComponent, {data: {}});
  this.example_modal.componentInstance.onLoadExample.subscribe(event => {
    this.loadExampleAtURL(event);
  });


}

   //need to handle this and load the file somehow
   openNewFileDialog() {
    if(this.upload_modal != undefined && this.upload_modal != null) return;


    this.upload_modal = this.dialog.open(LoadfileComponent, {
      data: {
        multiple: false,
        accepts: '.ada',
        type: 'ada',
        title: 'Select an AdaCAD (.ada) file to Import'
      }
    });

    this.upload_modal.afterClosed().subscribe(loadResponse => {
      console.log("LoadReSP", loadResponse)
      if(loadResponse !== undefined && loadResponse != true) 
      this.loadNewFile(loadResponse);

   });
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
    
    const seeds: Array<{entry, id, draft, loom, loom_settings, render_colors}> = seednodes
    .map(sn =>  {


        let d:Draft =null;
        let loom:Loom = null;
        let render_colors = true;

      const draft_node = data.nodes.find(node => node.node_id === sn.prev_id);

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
          if(!this.tree.hasParent(node.id))
          this.mixer.loadSubDraft(node.id, this.tree.getDraft(node.id), data.nodes.find(el => el.node_id === entry.prev_id), data.draft_nodes.find(el => el.node_id === entry.prev_id), data.scale);
          break;
        case 'op':
          const op = this.tree.getOpNode(node.id);
          this.mixer.loadOperation(op.id, op.name, op.params, op.inlets, data.nodes.find(el => el.node_id === entry.prev_id).topleft, data.scale);
          break;
        case 'cxn':

          //only load UI for connections that go from draft to operation
          let froms = this.tree.getInputs(node.id);
          if(froms.length > 0 && this.tree.getNode(froms[0]).type === 'draft')  this.mixer.loadConnection(node.id)
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
      (<DraftNode> node).loom = copyLoom(np.loom); 
      if(np.render_colors !== undefined) (<DraftNode> node).render_colors = np.render_colors; 
    })

   this.tree.getOpNodes().forEach(op => {
    (<OperationComponent> op.component).updateChildren(this.tree.getNonCxnOutputs(op.id));
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
  this.fs.loader.ada(this.files.getCurrentFileName(), this.files.getCurrentFileId(),this.files.getCurrentFileDesc(),  so)
  .then(lr =>  this.loadNewFile(lr));

 
}


saveFile(){
  //if this user is logged in, write it to the
  this.fs.saver.ada()
    .then(so => {
      this.ss.addMixerHistoryState(so);
    });
}

setDraftsViewable(val: boolean){
  this.ws.hide_mixer_drafts = val;
  this.mixer.redrawAllSubdrafts();
}

showDraftDetails(id: number){
  this.editor.loadDraft(id);

 // this.sim.loadNewDraft(draft, loom_settings)
  this.selected_draft_id = id;
  this.dm.selectPencil('toggle');
}



  undo() {

    let so: SaveObj = this.ss.restorePreviousMixerHistoryState();
    if(so === null || so === undefined) return;
    this.clearAll();
    this.fs.loader.ada(this.files.getCurrentFileName(), this.files.getCurrentFileId(), this.files.getCurrentFileDesc(), so).then(lr => {
      this.loadNewFile(lr)
    }
    
    );

  
  }

  selectOriginOption(value: number){
    this.ws.selected_origin_option = value;
    this.mixer.originChange(value);

  }

  selectLoom(value: string){
    this.ws.type = value;
    //redraw?
  }

  selectUnit(value: "in" | 'cm'){
    this.ws.units = value;
    //redraw?
  }

  selectEpi(value: number){
    this.ws.epi = value;
    //redraw?
  }

  /**
   * this emerges from the detail or simulation when something needs to trigger the mixer to update
   */
  updateMixer(){
  }

    /**
   * this emerges from the detail or simulation when something needs to trigger the mixer to update
   */
  onRefreshViewer(){

    this.viewer.redraw(this.selected_draft_id);

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

  /**
   * used to set the default value on the slider
   */
  getActiveZoomIndex() : number{
    if(this.selected_editor_mode == 'mixer'){
      return this.zs.zoom_table_ndx_mixer;
    } else {
      return this.zs.zoom_table_ndx_editor;
    }
  }

  zoomOut(){
    if(this.selected_editor_mode == 'mixer'){
      this.zs.zoomOutMixer();
      this.mixer.renderChange();
    } else {
      this.zs.zoomOutEditor()
      this.editor.renderChange();
    }
  }

  zoomIn(){
    if(this.selected_editor_mode == 'mixer'){
      this.zs.zoomInMixer();
      this.mixer.renderChange();
    } else {
      this.zs.zoomInEditor()
      this.editor.renderChange();
    }

  }

  zoomChange(ndx: number){
    if(this.selected_editor_mode == 'mixer'){
      this.zs.setZoomIndexOnMixer(ndx);
      this.mixer.renderChange();
    } else {
    this.zs.setZoomIndexOnEditor(ndx)
    this.editor.renderChange();
    }
  }


}
