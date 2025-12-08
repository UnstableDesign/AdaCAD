import { ScrollDispatcher } from '@angular/cdk/overlay';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { User } from '@angular/fire/auth';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { AnalyzedImage, Img, Loom, LoomSettings, generateId, interpolate, isDraftDirty, sameOrNewerVersion } from 'adacad-drafting-lib';
import { Draft, copyDraft, createCell, getDraftName, initDraftWithParams, warps, wefts } from 'adacad-drafting-lib/draft';
import { convertLoom, copyLoom, copyLoomSettings, initLoom } from 'adacad-drafting-lib/loom';
import { Subscription, catchError } from 'rxjs';
import { EventsDirective } from './core/events.directive';
import { Bounds, DraftNode, DraftNodeProxy, DraftStateAction, FileMeta, FileMetaStateAction, FileMetaStateChange, LoadResponse, MaterialsStateAction, MediaInstance, MixerStateDeleteEvent, MixerStatePasteEvent, NodeComponentProxy, RenameAction, SaveObj, ShareObj, TreeNode, TreeNodeProxy } from './core/model/datatypes';
import { defaults, editor_modes } from './core/model/defaults';
import { mergeBounds } from './core/model/helper';
import { ErrorBroadcasterService } from './core/provider/error-broadcaster.service';
import { FileService } from './core/provider/file.service';
import { FirebaseService } from './core/provider/firebase.service';
import { MaterialsService } from './core/provider/materials.service';
import { MediaService } from './core/provider/media.service';
import { NotesService } from './core/provider/notes.service';
import { OperationService } from './core/provider/operation.service';
import { ScreenshotLayoutService } from './core/provider/screenshot-layout.service';
import { StateService } from './core/provider/state.service';
import { SystemsService } from './core/provider/systems.service';
import { TreeService } from './core/provider/tree.service';
import { VersionService } from './core/provider/version.service';
import { ViewadjustService } from './core/provider/viewadjust.service';
import { ViewerService } from './core/provider/viewer.service';
import { WorkspaceService } from './core/provider/workspace.service';
import { ZoomService } from './core/provider/zoom.service';
import { DownloadComponent } from './core/ui/download/download.component';
import { ExamplesComponent } from './core/ui/examples/examples.component';
import { FilebrowserComponent } from './core/ui/filebrowser/filebrowser.component';
import { HistoryComponent } from './core/ui/history/history.component';
import { LoadfileComponent } from './core/ui/loadfile/loadfile.component';
import { LoadingComponent } from './core/ui/loading/loading.component';
import { LoginComponent } from './core/ui/login/login.component';
import { ShareComponent } from './core/ui/share/share.component';
import { WorkspaceComponent } from './core/ui/workspace/workspace.component';
import { ViewadjustComponent } from './core/viewadjust/viewadjust.component';
import { EditorComponent } from './editor/editor.component';
import { LibraryComponent } from './library/library.component';
import { MixerComponent } from './mixer/mixer.component';
import { OperationComponent } from './mixer/palette/operation/operation.component';
import { SubdraftComponent } from './mixer/palette/subdraft/subdraft.component';
import { MultiselectService } from './mixer/provider/multiselect.service';
import { ViewportService } from './mixer/provider/viewport.service';
import { ViewerComponent } from './viewer/viewer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [EventsDirective, DownloadComponent, MatToolbar, MatButton, MatIconButton, MatMenuTrigger, MatMenu, MatMenuItem, MatButtonToggleGroup, FormsModule, MatButtonToggle, MatTooltip, MixerComponent, CdkScrollable, EditorComponent, MatSlider, MatSliderThumb, MatInput, ReactiveFormsModule, ViewadjustComponent, ViewerComponent, LibraryComponent]
})


export class AppComponent implements OnInit, OnDestroy {
  // auth = inject(AuthService);
  private dialog = inject(MatDialog);
  ss = inject(StateService);
  //private fbauth = inject(Auth, { optional: true });
  private fb = inject(FirebaseService);
  private fs = inject(FileService);
  private http = inject(HttpClient);
  private media = inject(MediaService);
  private ms = inject(MaterialsService);
  multiselect = inject(MultiselectService);
  private notes = inject(NotesService);
  private ops = inject(OperationService);
  scroll = inject(ScrollDispatcher);
  sys_serve = inject(SystemsService);
  private tree = inject(TreeService);
  vp = inject(ViewportService);
  ws = inject(WorkspaceService);
  vas = inject(ViewadjustService);
  vs = inject(ViewerService);
  vers = inject(VersionService);
  zs = inject(ZoomService);
  sls = inject(ScreenshotLayoutService);
  private zone = inject(NgZone);
  cdr = inject(ChangeDetectorRef);
  errorBroadcaster = inject(ErrorBroadcasterService);
  title = 'app';


  @ViewChild(LibraryComponent) library: LibraryComponent;
  @ViewChild(MixerComponent) mixer: MixerComponent;
  @ViewChild(EditorComponent) editor: EditorComponent;
  @ViewChild(ViewerComponent) viewer: ViewerComponent;
  @ViewChild(ViewadjustComponent) viewadjust: ViewadjustComponent;
  @ViewChild(LoadingComponent) loadingComponent: MatDialogRef<LoadingComponent>;


  //modals to manage
  filebrowser_modal: MatDialog | any;
  version_modal: MatDialog | any;
  upload_modal: MatDialog | any;
  example_modal: MatDialog | any;
  workspace_modal: MatDialog | any;
  material_modal: MatDialog | any;


  loading: boolean = false;

  selected_origin: number;

  ui = {
    main: 'mixer',
    fullscreen: false,
    id: -1
  };

  views = [];

  scrollingSubscription: any;

  originOptions: any;

  loomOptions: any;

  editorModes: any;

  selected_editor_mode: any;

  current_version: string;

  filename_form: UntypedFormControl;
  zoom_form: UntypedFormControl;

  private snackBar = inject(MatSnackBar);

  user_auth_state = false;
  user_auth_name = '';
  private userAuthSubscription: Subscription;


  connection_state = false;
  private connectionSubscription: Subscription;

  loaded_from_url = false;

  stateSubscriptions: Array<Subscription> = [];

  errorBroadcastSubscription: Subscription;


  constructor() {

    this.current_version = this.vers.currentVersion();
    this.editorModes = editor_modes;
    this.selected_editor_mode = defaults.editor;

    //subscribe to the connection event to see if we have access to the firebase database (and internet) 
    this.connectionSubscription = this.fb.connectionChangeEvent$.subscribe(data => {
      this.connection_state = data;
      this.initConnection(data);

      if (this.connection_state) {
        //when this fires, auth may have already had events, check for those first and then subscribe for future events

        if (this.fb.auth.currentUser) {
          this.user_auth_state = (this.fb.auth.currentUser !== null) ? true : false;
          this.user_auth_name = (this.fb.auth.currentUser !== null && this.user_auth_state) ? this.fb.auth.currentUser.displayName : '';
        }
        this.initLoginLogoutSequence(this.fb.auth.currentUser);

        //subscribe to the login event and handle what happens in that case 
        this.userAuthSubscription = this.fb.authChangeEvent$.subscribe(user => {
          this.user_auth_state = (user !== null) ? true : false;
          this.user_auth_name = (user !== null && this.user_auth_state) ? user.displayName : '';
          this.initLoginLogoutSequence(user);
        });
      } else {
        if (this.userAuthSubscription) this.userAuthSubscription.unsubscribe();
        this.user_auth_state = false;
        this.user_auth_name = '';
      }

    });


    //INTERCEPT DRAFT CHANGES IN APP so we can centralize where changes come from and delegate redrawing as required. 
    const draftStateChangeSubscription = this.ss.draftValueChangeUndo$.subscribe(action => {
      this.tree.restoreDraftNodeState((<DraftStateAction>action).id, (<DraftStateAction>action).before);

      //redraw and recompute the change in the mixer
      const outs = this.tree.getNonCxnOutputs((<DraftStateAction>action).id);
      outs.forEach(el => this.tree.performAndUpdateDownstream(el));

      //redraw the editor if it has this draft loaded
      if (this.editor.id === (<DraftStateAction>action).id) {
        this.editor.forceRedraw();
        this.editor.updateLoom();
        this.editor.updateWeavingInfo();
        this.editor.clearSelection();
      }


    })

    const draftStateNameChangeSubscription = this.ss.draftNameChangeUndo$.subscribe(action => {
      const draft = this.tree.getDraft((<RenameAction>action).id);
      draft.ud_name = (<RenameAction>action).before.name;
      this.updateDraftName((<RenameAction>action).id);

      if (this.vs.getViewerId() === (<DraftStateAction>action).id) {
        this.viewer.updateDraftNameFromMixerEvent((<RenameAction>action).before.name);
        this.viewer.updateDraftNotesFromMixerEvent((<RenameAction>action).before.notes);
      }

    })

    const materialsUpdatedUndoSubscription = this.ss.materialsUpdatedUndo$.subscribe(action => {
      this.ms.overloadShuttles((<MaterialsStateAction>action).before);
      this.editor.forceRedraw();
      this.vs.updateViewer();
      this.materialChange();
      this.library.loadMaterials();
      this.saveFile();

    })


    const mixerPasteUndoSubscription = this.ss.mixerPasteUndo$.subscribe(action => {
      this.undoPasteSelections(action.ids);
    });

    const mixerDeleteUndoSubscription = this.ss.mixerDeleteUndo$.subscribe(action => {
      this.onPasteSelectionsFromUndo(action.obj);
    });

    const fileMetaChangeUndoSubscription = this.ss.fileMetaChangeUndo$.subscribe(action => {
      this.filename_form.setValue((<FileMetaStateAction>action).before.name, { emitEvent: false });
      this.library.updateWorkspaceName((<FileMetaStateAction>action).before.name);
      this.library.updateWorkspaceDescriptionFromUndo((<FileMetaStateAction>action).before.desc);
      this.ws.setCurrentFile((<FileMetaStateAction>action).before);
    });


    //called from footer or library when the name is changed, this just streamlines the publishing of that event. 
    //download also listens on this signals to update teh download form name
    const fileNameChangeSubscription = this.ws.onFilenameUpdated$.subscribe((name) => {
      this.library.updateWorkspaceName(name);
      this.filename_form.setValue(name, { emitEvent: false });

    });


    this.errorBroadcastSubscription = this.errorBroadcaster.errorBroadcast$.subscribe((alert_text) => {
      this.openSnackBar(alert_text);
    })





    this.stateSubscriptions.push(draftStateChangeSubscription);
    this.stateSubscriptions.push(draftStateNameChangeSubscription);
    this.stateSubscriptions.push(materialsUpdatedUndoSubscription);
    this.stateSubscriptions.push(mixerPasteUndoSubscription);
    this.stateSubscriptions.push(mixerDeleteUndoSubscription);
    this.stateSubscriptions.push(fileMetaChangeUndoSubscription);
    this.stateSubscriptions.push(fileNameChangeSubscription);
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



  ngOnInit() {

    const name = this.ws.getCurrentFile().name;
    this.filename_form = new UntypedFormControl(name, [Validators.required]);
    this.filename_form.valueChanges.forEach(el => { })

    this.zoom_form = new UntypedFormControl(this.getActiveZoomIndex());
    this.zoom_form.valueChanges.subscribe(value => {
      if (value !== null && value !== undefined) {
        this.zoomChange(value);
      }
    });

  }

  ngOnDestroy() {
    if (this.userAuthSubscription) {
      this.userAuthSubscription.unsubscribe();
    }
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    if (this.scrollingSubscription) {
      this.scrollingSubscription.unsubscribe();
    }

    this.stateSubscriptions.forEach(element => element.unsubscribe());

    if (this.errorBroadcastSubscription) {
      this.errorBroadcastSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.recenterViews();
    this.updateTextSizing();

    // Utility functions exposed on window for the screenshot generator script

    // Load ADA file JSON directly
    (window as any).loadAdaFileJson = async (adaSaveObjJson: SaveObj) => {
      this.clearAll();

      const loadResponse = await this.fs.loader.ada(adaSaveObjJson, { name: 'untitled', id: 0, desc: '', from_share: '', share_owner: '' }, 'upload');
      return this.loadNewFile(loadResponse, 'openFile');
    };

    // Zoom to fit with some margins, which are better for the screenshots
    (window as any).zoomToFit = () => this.zoomToFit(true, 50);
  }


  /**
   *called on Application Init. Checks the params and loads any content 
   * passed in the URL. If this laods, it will push the timeline state. 
   */
  checkForURLLoads(): boolean {

    let searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('ex')) {
      if (this.connection_state) {
        this.loadExampleAtURL(searchParams.get('ex'))
        history.pushState({ page: 1 }, "AdaCAD.org ", "")
      } else {
        this.openSnackBar('You Must be Connected to the Internet to Load this Example')
      }
      return true;

    } else if (searchParams.has('share')) {
      //THIS CANNOT RUN IF THE ACCESS TO THE DATABASE IS NOT YET CONFIGURED? 

      if (this.connection_state) {
        this.loadFromShare(+searchParams.get('share'))
          .then(res => {
            this.openSnackBar('Loading Shared File #' + searchParams.get('share'))
            return true;
          })
          .catch(err => {
            this.openSnackBar('ERROR: we cannot find a shared file with id: ' + searchParams.get('share'))
            this.loadBlankFile()
            return false;
          })
        history.pushState({ page: 1 }, "AdaCAD.org ", "")
      } else {
        this.openSnackBar('You Must be Connected to the Internet to Load this Shared File')

      }
    }

  }


  initConnection(connection: boolean) {
    console.log("INIT CONNECTION", connection);

  }

  /**
 * this is called anytime a user event is fired, which will be immediate on load so it may conflict with start workspace
 * @param user 
 */
  initLoginLogoutSequence(user: User) {
    console.log("IN LOGIN/LOGOUT ", user);
    const workspace_has_content = this.ss.hasTimeline();



    if (user && workspace_has_content) {
      // WRITE THE FILE INFORMAITON LOCALLY to this USERs DB
      this.saveFile();

    } else if (user && !workspace_has_content) {
      // CHECK THE URL for LOADS 
      const hadLoad = this.checkForURLLoads();
      if (!hadLoad) {
        this.openAdaFiles("welcome");
      }


    } else if (!user && workspace_has_content) {
      // DO NOTHING - this person must have just logged out

    } else {
      // CHECK THE URL for LOADS 
      const hadLoad = this.checkForURLLoads();
      if (!hadLoad) {
        this.loadStarterFile();
      }
      //LOAD WELCOME CONTENT
    }


  }







  clearAll(): void {

    this.vs.clearPin();
    this.vs.clearViewer();
    this.mixer.clearView();
    this.media.clearMedia();
    this.editor.clearAll();
    this.viewer.clearView();
    this.tree.clear();
    this.ss.clearTimeline();
    this.ms.reset();

  }




  /**
   * called from the editor when a new draft has been created. 
   * A new draft is created by either opening the draft editor with no draft selected
   * or opening the draft editor with a draft that has a parent (and therefore, a copy is created)
   * @param obj 
   */
  createNewDraftOnMixer(draft: Draft, loom: Loom | null, loom_settings: LoomSettings): Promise<number> {

    return this.mixer.createNewDraft(draft, loom, loom_settings);

  }





  detailViewChange() {
    // this.details.weaveRef.rescale(this.render.getZoom());

  }


  /**
   * 
   */
  deleteCurrentFile() {
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

  /** called from the editor when someone asks to adjust materials */
  onEditMaterials() {
    this.editor.onClose();
    this.selected_editor_mode = 'library';
    this.library.onFocus(-1);
    this.library.scrollToMaterials();
  }


  toggleEditorMode() {

    switch (this.selected_editor_mode) {
      case 'draft':

        this.mixer.onClose();

        //nothing is selected
        if (this.vs.getViewerId() == -1) {
          console.log("NO VIEWER SELECTED, GENERATING BLANK DRAFT");
          let obj = {
            warps: defaults.warps,
            wefts: defaults.wefts,
            type: defaults.loom_settings.type,
            epi: defaults.loom_settings.epi,
            ppi: defaults.loom_settings.ppi,
            units: defaults.loom_settings.units,
            frames: defaults.loom_settings.frames,
            treadles: defaults.loom_settings.treadles
          }
          this.generateBlankDraftAndPlaceInMixer(obj)
            .then(id => {
              this.editor.onFocus(id);
              this.vs.setViewer(id);
              this.saveFile();
            })

        } else {

          this.editor.onFocus(this.vs.getViewerId());
        }

        break;
      case 'mixer':
        this.editor.onClose();
        this.mixer.onFocus(this.editor.id);
        break;
      case 'library':
        this.library.onFocus(-1);
        this.mixer.onClose();
        this.editor.onClose();
        break;
      default:
        console.error("INVALID EDITOR MODE: ", this.selected_editor_mode);
        break;
    }

    // Update the zoom FormControl to reflect the current zoom level for the new mode
    this.updateZoomFormControl();

  }

  /**
 * this is emitted from the editor when someone has edited a draft that was generated by an operation. It makes a new subdraft object by copying the original draft and then places it on the mixer. 
 * @param obj 
 */
  cloneDraft(obj: any) {
    let draft = copyDraft(obj.draft);
    draft.gen_name = 'copy of ' + getDraftName(draft);
    let loom = (obj.loom == null) ? null : copyLoom(obj.loom)
    let loom_settings = copyLoomSettings(obj.loom_settings);
    this.createNewDraftOnMixer(draft, loom, loom_settings).then(id => {
      this.vs.setViewer(id);
      this.editor.onFocus(id);
      this.saveFile();

    }).catch(err => {
      console.error(err);
    });
  }

  /**
   * called by an emit on focus for editor, passes an object with:
   *  warps, wefts, type, epi, units, frames, treadles
   *  
   * generates a draft, loom, and loom settings before sending back to the app component to initate it 
   * within both draft detail and the mixer view. Returns a promise to streamline execution
   * 
   * @returns the new draft id
   */
  generateBlankDraftAndPlaceInMixer(obj: any): Promise<number> {
    console.log("GENERATING DRAFT FOR MIXER  ", obj);

    //if it has a parent and it does not yet have a view ref. 
    //this.tree.setSubdraftParent(id, -1)
    const draft = initDraftWithParams({ warps: obj.warps, wefts: obj.wefts });
    const loom = initLoom(obj.warps, obj.wefts, obj.frames, obj.treadles);
    //use the local loom settings
    const loom_settings: LoomSettings = {
      type: obj.type,
      epi: obj.epi,
      ppi: obj.ppi,
      units: <"cm" | "in">obj.units,
      frames: obj.frames,
      treadles: obj.treadles,
    }

    return this.createNewDraftOnMixer(draft, loom, loom_settings).then(id => {
      this.vs.setViewer(id);
      this.editor.onFocus(id);
      this.saveFile();
      return id;
    }).catch(err => {
      console.error(err);
      return Promise.reject(err);
    });


  }

  createDraft(obj: any) {
    this.generateBlankDraftAndPlaceInMixer(obj).then(
      id => {
        this.editor.onFocus(id);
        this.vs.setViewer(id);
        this.saveFile();
      }
    )
  }


  updateViewAdjustBar() {
    this.viewadjust.updatePosition();
  }


  recenterViews() {

    //  this.editor.centerView();
    this.mixer.centerView();
    // this.sim.centerView();
  }


  share() {
    const fileid = this.ws.getCurrentFile().id;
    const dialogRef = this.dialog.open(ShareComponent, {
      width: '600px',
      data: { fileid }
    });
  }








  /**
 * this gets called when a new file is started from the topbar
 * @param result 
 */
  importNewFile(result: LoadResponse) {


    this.processFileData(result.data, result.meta.name)
      .then(data => {
        this.mixer.changeDesignMode('move')
        this.clearAll();
        console.log("imported new file", result, result.data)
      })
      .catch(console.error);

  }


  loadMostRecent(): Promise<any> {

    console.log("LOADING MOST RECENT FILE");

    return this.fb.getMostRecentFileIdFromUser()
      .then(fileid => {

        console.log("GOT FILE ID ", fileid);
        if (fileid !== null) {

          let fns = [this.fb.getFile(fileid), this.fb.getFileMeta(fileid)];
          return Promise.all(fns)
            .then(res => {
              console.log("GOT FILE ", res);
              const ada = <SaveObj>res[0];
              const meta = <FileMeta>res[1];
              console.log("GOT FILE META ", meta);
              if (ada === undefined) {
                return Promise.reject("no ada file found at specified file id")
              } else if (meta === undefined) {
                const meta = {
                  id: generateId(8),
                  name: 'filename not found',
                  desc: '',
                  from_share: '',
                  share_owner: ''
                }
                this.ws.setCurrentFile(meta);
                return this.prepAndLoadFile(ada, meta, 'db');
              } else {
                this.ws.setCurrentFile(meta);
                return this.prepAndLoadFile(ada, meta, 'db');
              }
            })
            .catch(err => {
              return Promise.reject("error on getFile " + err)

            })
        }
      }).catch(err => {
        console.error(err);
        return Promise.reject("no last file found")
      })
  }




  insertPasteFile(result: LoadResponse, originated_with_user: boolean) {
    this.processFileData(result.data, 'paste').then(idmap => {

      //after we have processed the data, we need to now relink any images that were duplicated in the process. 
      let image_id_map = [];
      result.data.indexed_image_data.forEach(image => {
        let media_item: MediaInstance = this.media.duplicateIndexedColorImageInstance(image.id);
        image_id_map.push({ from: image.id, to: media_item.id })
      })


      result.data.ops.forEach(op => {

        let op_base = this.ops.getOp(op.name);
        op_base.params.forEach((param, ndx) => {

          if (param.type == 'file') {

            let from: Img = <Img>op.params[ndx];
            let entry = image_id_map.find(el => el.from == +from.id);

            if (entry !== undefined) {
              let img_instance: MediaInstance = this.media.getMedia(entry.to);
              //this is just setting it locally, it needs to set the actual operation
              let op_node = this.tree.getOpNode(op.node_id);
              op_node.params[ndx] = { id: entry.to.toString(), data: <AnalyzedImage>img_instance.img };

            }
          }
        })
      })

      if (originated_with_user) {
        const change: MixerStatePasteEvent = {
          originator: 'MIXER',
          type: 'PASTE',
          ids: idmap.map(el => el.cur_id)
        }
        this.ss.addStateChange(change);
      }
      this.saveFile();
    }
    ).catch(console.error);
  }


  async deleteSelections() {

    this.multiselect.copySelections().then(obj => {
      const change: MixerStateDeleteEvent = {
        originator: 'MIXER',
        type: 'DELETE',
        obj: obj
      }
      this.ss.addStateChange(change);

      this.multiselect.selected.forEach(el => {
        if (this.tree.getType(el.id) == 'op') {
          this.mixer.palette.removeOperation(el.id);
        } else if (this.tree.getType(el.id) == 'draft') {
          this.mixer.palette.removeSubdraft(el.id);
        }
      })
      this.saveFile();
      this.multiselect.clearSelections();

    })



  }

  undoPasteSelections(id_list: Array<number>) {


    id_list.forEach(id => {
      if (this.tree.getType(id) == 'op') {
        this.mixer.palette.removeOperation(id);
      } else if (this.tree.getType(id) == 'draft') {
        this.mixer.palette.removeSubdraft(id);
      }
    })
    this.saveFile();


  }


  /**
   * runs code that (a) changes all loom types to jacquard and (b) sets all drafts to hidden
   */
  optimizeWorkspace() {

    //set the defaults
    this.ws.hide_mixer_drafts = true;
    this.ws.type = 'jacquard';

    const drafts = this.tree.getDraftNodes();
    drafts.forEach(draft => {
      draft.visible = false;

    })

    this.forceRedraw();

  }


  forceRedraw() {

  }


  /**
   * this function checks if the user has already started designing so that logging in does not override. 
   * it does this by checking if there is one or viewer drafts in the tree
   * @returns 
   */
  isBlankWorkspace(): boolean {

    if (this.tree.nodes.length == 0) return true;
    else if (this.tree.nodes.length == 1) {
      let node = this.tree.nodes[0];
      if (node.type == 'draft') {
        let d = this.tree.getDraft(node.id);
        let loom = this.tree.getLoom(node.id);
        return !isDraftDirty(d, loom);
      } else {
        return false;
      }
    } else {
      return false;
    }

  }

  async duplicateFileInDB(fileid: number) {
    const ada = await this.fb.getFile(fileid);
    const meta = await this.fb.getFileMeta(fileid);
    meta.name = meta.name + '-copy'
    this.fb.duplicate(ada, meta).then(fileid => {
      this.prepAndLoadFile(ada, meta, 'db').then(res => {
        this.saveFile();
      });
    })
  }


  /**
   * when someone loads a URL of a shared example, 
   * the system is going to use the fileID in the url to lookup the file in the files database. 
   * it is then going to duplicate that file into the users file list. 
   * while doing so, it needs to copy over elements of the shared file that retain it's legacy and owner.
   * so if it is shared again, that information is retained. 
   * @param shareid 
   */
  loadFromShare(shareid: number): Promise<any> {
    let meta: FileMeta = {
      id: -1,
      name: '',
      desc: '',
      from_share: shareid.toString(),
      share_owner: ''
    };

    //GET THE SHARED FILE
    return this.fb.getShare(shareid)
      .then(share_obj => {
        console.log("SHARE OBJ ", share_obj)
        if (share_obj == null) {
          return Promise.reject("NO SHARED FILE EXISTS")
        }
        meta.id = generateId(8);
        meta.name = (<ShareObj>share_obj).filename;
        meta.desc = (<ShareObj>share_obj).desc;
        meta.share_owner = (<ShareObj>share_obj).owner_creditline;

        return this.fb.getFile(shareid)
      }).then(ada => {
        console.log("GOT FILE ", shareid, ada)
        return this.prepAndLoadFile(ada, meta, 'db')
      }).then(file_objs => {
        this.ws.setCurrentFile(meta);
      }).catch(err => {
        console.error(err);
        return Promise.reject(err);
      })
  }



  //must be online
  loadFromDB(fileid: number): Promise<any> {
    console.log("Load from DB", fileid)
    let fns = [this.fb.getFile(fileid), this.fb.getFileMeta(fileid)];
    return Promise.all(fns)
      .then(res => {
        const ada = <SaveObj>res[0];
        const meta = <FileMeta>res[1];
        return this.prepAndLoadFile(ada, meta, 'db')
      })
      .catch(err => {
        return Promise.reject(err);
      })



  }

  /**
   * clear the screen and start a new workspace
   */
  loadBlankFile(): Promise<any> {
    this.clearAll();
    const meta = {
      id: generateId(8),
      name: 'blank workspace',
      desc: '',
      from_share: '',
      share_owner: ''
    }


    this.ws.setCurrentFile(meta)
    if (this.filename_form) this.filename_form.setValue(meta.name)
    return Promise.resolve(true);

  }



  /**
   * loading the starter file will not clear the prior workspace as it assumes that the space is empty on first load
   */
  loadStarterFile(): Promise<any> {
    let meta = {
      id: generateId(8),
      name: 'welcome',
      desc: '',
      from_share: '',
      share_owner: ''
    }
    this.ws.setCurrentFile(meta)

    let obj = {
      warps: defaults.warps,
      wefts: defaults.wefts,
      type: defaults.loom_settings.type,
      epi: defaults.loom_settings.epi,
      units: defaults.loom_settings.units,
      frames: defaults.loom_settings.frames,
      treadles: defaults.loom_settings.treadles
    }

    const name = this.ws.getCurrentFile().name;
    if (this.filename_form) this.filename_form.setValue(name)

    return this.generateBlankDraftAndPlaceInMixer(obj).then(id => {
      this.vs.setViewer(id);
    });

  }

  handleError() {
    console.log("ERROR!")
  }


  //Unlike other functions that can return a promise that is rejected with the parent funciton handling the error, the http.get makes it hard to return upon completion, instead, we just handle the failure case internally
  loadExampleAtURL(name: string) {

    this.http.get('assets/examples/' + name + ".ada", { observe: 'response' })
      .pipe(
        catchError(error => {
          console.error('Error occurred:', error);
          //return throwError(() => new Error('Custom error: ' + error.message));
          return Promise.reject("file not found")

        })
      )
      .subscribe({
        next: data => {
          console.log('Data received:', data);
          this.openSnackBar('opening example ' + name)
          this.clearAll();
          const meta = {
            id: -1,
            name: name,
            desc: '',
            from_share: '',
            share_owner: 'AdaCAD Examples'
          }
          return this.fs.loader.ada(<SaveObj>data.body, meta, 'upload')
            .then(loadresponse => {
              return this.loadNewFile(loadresponse, 'loadURL')
            })
        },
        error: err => {
          this.openSnackBar('ERROR: no example found with name: ' + name)
          this.loadBlankFile();
        }
      });


  }

  openSnackBar(message: string) {
    let snackBarRef = this.snackBar.open(message, 'close', {
      duration: 5000
    });


  }




  /**
   * this gets called when a new file is started from the topbar or a new file is reload via undo/redo
   */
  loadNewFile(result: LoadResponse, source: string): Promise<any> {
    console.log("SOURCE ", source)
    this.ws.setCurrentFile(result.meta)
    this.filename_form.setValue(result.meta.name)

    return this.processFileData(result.data, result.meta.name)
      .then(data => {
        this.updateTextSizing();


        if (source !== 'statechange') {
          if (this.tree.nodes.length > 0) {
            this.selected_editor_mode = 'mixer';
          } else {
            this.selected_editor_mode = 'draft';
          }
        } else {
          this.selected_editor_mode = 'mixer'
        }
      });


  }

  /**
  * this uses the uploaded node data to create new nodes, in addition to any nodes that may already exist
  * @param nodes the nodes from the upload
  * @returns an array of uploaded ids mapped to unique ids in this instance
  */
  async loadNodes(nodes: Array<NodeComponentProxy>): Promise<any> {

    const functions = nodes.map(n => this.tree.loadNode(<'draft' | 'op' | 'cxn'>n.type, n.node_id));
    return Promise.all(functions);

  }

  /**
   * uploads the relationships between the nodes as specified in a load file
   * @param id_map the map from uploaded ids to current ids generated by loadNodes
   * @param tns the uploaded treenode data
   * @returns an array of treenodes and the map associated at each tree node
   */
  async loadTreeNodes(id_map: Array<{ prev_id: number, cur_id: number }>, tns: Array<TreeNodeProxy>): Promise<Array<{ tn: TreeNode, entry: { prev_id: number, cur_id: number } }>> {


    const updated_tnp: Array<TreeNodeProxy> = tns.map(tn => {

      //we need these here because firebase does not store arrays of size 0
      if (tn.inputs === undefined) tn.inputs = [];
      if (tn.outputs === undefined) tn.outputs = [];


      const input_list = tn.inputs.map(input => {
        if (typeof input === 'number') {
          const input_in_map = id_map.find(el => el.prev_id === input);

          if (input_in_map !== undefined) {
            return { tn: input_in_map.cur_id, ndx: 0 };
          } else {
            console.error("could not find matching node");
          }

        } else {
          const input_in_map = id_map.find(el => el.prev_id === input.tn);
          if (input_in_map !== undefined) {
            return { tn: input_in_map.cur_id, ndx: input.ndx };
          } else {
            console.error("could not find matching node");
          }
        }


      });

      const output_list: Array<any> = tn.outputs.map(output => {
        //handle files of old type, before inputs were broken into two fields
        if (typeof output === 'number') {
          const output_map = id_map.find(el => el.prev_id === output);
          if (output_map !== undefined) {
            return { tn: output_map.cur_id, ndx: 0 };
          } else {
            console.error("could not find matching node");
          }
        } else {

          const output_map = id_map.find(el => el.prev_id === output.tn);

          if (output_map !== undefined) {
            return { tn: output_map.cur_id, ndx: output.ndx };
          } else {
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

  logout() {
    this.fb.logout();
  }


  /**
 * something in the materials library changed, check to see if
 * there is a modal showing materials open and update it if there is
 */
  public materialChange() {

    this.mixer.materialChange();
    this.editor.forceRedraw();
    this.saveFile();
  }


  onCopySelections() {
    this.mixer.onCopySelections();
  }


  onPasteSelections() {

    //check to make sure something has been copied
    if (this.multiselect.copy == undefined) return;

    return this.fs.loader.paste(this.multiselect.copy).then(lr => {
      this.insertPasteFile(lr, true);


    });

  }

  onPasteSelectionsFromUndo(obj: SaveObj) {

    return this.fs.loader.paste(obj).then(lr => {
      this.insertPasteFile(lr, false);


    });

  }

  openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '600px',
    });
  }

  openAboutDialog() {
    window.open('https://docs.adacad.org', '_blank');
  }

  openVersionDialog() {
    window.open('https://github.com/UnstableDesign/AdaCAD/releases', '_blank');


  }

  openHelp() {
    window.open('https://docs.adacad.org/', '_blank');
  }

  openDiscord() {
    window.open('https://discord.gg/Be7ukQcvrC', '_blank');
  }


  openBug() {
    window.open('https://github.com/UnstableDesign/AdaCAD/issues/new', '_blank');
  }





  /**
   * called when a user selects a file to open from the AdaFile Browser
   * @param selectOnly 
   * @returns 
   */
  openAdaFiles(type: string) {
    if (this.filebrowser_modal != undefined && this.filebrowser_modal.componentInstance != null) return;


    //make sure something is loaded in case we just close this
    if (type == 'welcome') this.loadBlankFile()

    this.filebrowser_modal = this.dialog.open(FilebrowserComponent, {
      width: '600px',
      data: {
        type: type
      }
    });


    this.filebrowser_modal.componentInstance.onLoadFromDB.subscribe(event => {
      this.openSnackBar('loading file from database')
      this.loadFromDB(event)
        .catch(err => {
          console.error(err);
          this.openSnackBar('ERROR: we could not find this file in the database')
        });
    });

    this.filebrowser_modal.componentInstance.onCreateFile.subscribe(event => {
      this.loadBlankFile()
    });

    this.filebrowser_modal.componentInstance.onDuplicateFile.subscribe(event => {
      this.duplicateFileInDB(event);
    });

    this.filebrowser_modal.componentInstance.onLoadMostRecent.subscribe(event => {
      this.openSnackBar('Loading Most Recent File')
      this.loadMostRecent()
        .catch(err => {
          this.openSnackBar('The most recent file could not be found:' + err)
          console.error(err);
          //this.loadBlankFile()
        })
    });






  }


  // openMaterials() {
  //   if (this.material_modal != undefined && this.material_modal.componentInstance != null) return;

  //   this.material_modal = this.dialog.open(MaterialModal, { data: {} });
  //   this.material_modal.componentInstance.onMaterialChange.subscribe(event => {
  //     this.vs.updateViewer();
  //     if (this.selected_editor_mode == 'mixer') this.mixer.redrawAllSubdrafts();
  //     else this.editor.redraw();
  //     this.saveFile();

  //   });
  // }

  openLoadingAnimation(filename: string) {
    this.loadingComponent = this.dialog.open(LoadingComponent, { data: { name: filename } });

  }

  closeLoadingAnimation() {
    this.loadingComponent.close();

  }


  openExamples() {
    if (this.example_modal != undefined && this.example_modal.componentInstance != null) return;

    this.example_modal = this.dialog.open(ExamplesComponent, { data: {} });
    this.example_modal.componentInstance.onLoadExample.subscribe(event => {
      this.loadExampleAtURL(event)
    });

    this.example_modal.componentInstance.onLoadSharedFile.subscribe(event => {
      this.loadFromShare(event);
    });
    this.example_modal.componentInstance.onOpenFileManager.subscribe(event => {
      this.openAdaFiles('load');
    });


  }


  openWorkspaceSettings() {
    if (this.workspace_modal != undefined && this.workspace_modal.componentInstance != null) return;

    this.workspace_modal = this.dialog.open(WorkspaceComponent, { data: {} });

    this.workspace_modal.componentInstance.onOversizeRenderingChange.subscribe(event => {
      this.forceRedraw();
    })

    this.workspace_modal.componentInstance.onMaxAreaChange.subscribe(event => {
      this.tree.performTopLevelOps().then(out => {
        this.forceRedraw();
      })
    })

    this.workspace_modal.componentInstance.onOptimizeWorkspace.subscribe(event => {
      this.optimizeWorkspace();
    });
    this.workspace_modal.componentInstance.onAdvanceOpsChange.subscribe(event => {
      this.setAdvancedOperations();
    });

    this.workspace_modal.componentInstance.onLoomTypeOverride.subscribe(event => {
      this.overrideLoomTypes();
    });

    this.workspace_modal.componentInstance.onDensityUnitOverride.subscribe(event => {
      this.overrideDensityUnits();
    });

    this.workspace_modal.componentInstance.onDraftVisibilityChange.subscribe(event => {
      this.overrideDraftVisibility();
    });

    this.workspace_modal.componentInstance.onOperationSettingsChange.subscribe(event => {
      this.mixer.refreshOperations();
    });

  }

  //need to handle this and load the file somehow
  openNewFileDialog() {
    if (this.upload_modal != undefined && this.upload_modal != null) return;


    this.upload_modal = this.dialog.open(LoadfileComponent, {
      data: {
        multiple: false,
        accepts: '.ada',
        type: 'ada',
        title: 'Select an AdaCAD (.ada) file to Import'
      }
    });

    this.upload_modal.afterClosed().subscribe(loadResponse => {
      if (loadResponse !== undefined && loadResponse != true)
        this.loadNewFile(loadResponse, 'openFile');
      this.upload_modal = undefined;

    });
  }



  /**
 * the drafts stored in adacad are ALWAYs oriented with 0,0 as the top left corner
 * any origin change is merely the rendering flipping the orientation. 
 * when the global settings change, the data itself does NOT need to change, only the rendering
 * @param e 
 */
  originChange(e: any) {
    this.selected_origin = e.value;
    this.ws.selected_origin_option = this.selected_origin;
    this.mixer.originChange(this.selected_origin); //force a redraw so that the weft/warp system info is up to date
    this.editor.forceRedraw();
    this.saveFile();
  }


  //This will go through all the looms that have been assigned and convert them to the new type specified in the workspace settings. 
  overrideLoomTypes() {

    const dns: Array<DraftNode> = this.tree.getDraftNodes()
      .filter(el => el.loom_settings !== null && el.loom_settings !== undefined);
    const fns: Array<any> = [];
    const settings: Array<LoomSettings> = [];
    dns.forEach(dn => {
      const updated_settings = copyLoomSettings(dn.loom_settings);
      updated_settings.type = this.ws.type;
      settings.push(updated_settings);
      fns.push(convertLoom(dn.draft.drawdown, dn.loom, dn.loom_settings, updated_settings))
    });

    Promise.all(fns).then(outs => {

      for (let i = 0; i < outs.length; i++) {
        this.tree.setLoom(dns[i].id, outs[i]);
        this.tree.setLoomSettings(dns[i].id, settings[i]);

      }

      //call this to update the editor (if, by chance, the loom is showing)
      this.editor.loomSettingsUpdated();
    }).catch(err => {
      //given that we've stripped any undefined loom settings, this should nevercall, but just in case. 
      console.error(err);
    })



  }


  //This will go through all the looms that have been assigned and convert them to the new type specified in the workspace settings. 
  overrideDensityUnits() {

    const dns: Array<DraftNode> = this.tree.getDraftNodes()
      .filter(el => el.loom_settings !== null && el.loom_settings !== undefined);
    dns.forEach(dn => {
      dn.loom_settings.units = this.ws.units;
    });

    //call this to update the editor (if, by chance, the loom is showing)
    this.editor.loomSettingsUpdated();


  }



  overrideDraftVisibility() {

    const dns: Array<DraftNode> = this.tree.getDraftNodes()
      .filter(dn => this.tree.hasParent(dn.id) === true)
    dns.forEach(dn => {
      dn.visible = !this.ws.hide_mixer_drafts;
    });

    const ops: Array<OperationComponent> = this.tree.getOperations()
    ops.forEach(op => {
      op.draftContainers.forEach(container => {
        container.draft_visible = !this.ws.hide_mixer_drafts;
        container.updateDraftVisibility();
      })
    })



    this.saveFile();
  }



  prepAndLoadFile(ada: SaveObj, meta: FileMeta, src: string): Promise<any> {
    this.clearAll();
    return this.fs.loader.ada(ada, meta, src).then(lr => {
      return this.loadNewFile(lr, 'prepAndLoad');
    }).catch(console.error);
  }

  /** 
   * Take a fileObj returned from the fileservice and process
   */
  async processFileData(data: SaveObj, name: string): Promise<Array<{ prev_id: number, cur_id: number }>> {

    console.log("PROCESSING FILE DATA", data);
    let entry_mapping: Array<{ prev_id: number, cur_id: number }> = [];
    console.log("[LOAD] START: Processing file data", name);
    this.openLoadingAnimation(name)



    // console.log("PROCESSING ", data)

    //1. filter any operations with a parameter of type file, and load the associated file. 
    const images_to_load = [];

    if (data.type !== 'partial') {
      //only load in new files if this is a true load event, if it is pasting from exisitng files, it doesn't need to re-analyze the images. 
      if (sameOrNewerVersion(data.version, '4.1.7')) {
        //LOAD THE NEW FILE OBJECT
        data.indexed_image_data.forEach(el => {
          const repeated_image = images_to_load.find(repeat_el => repeat_el.ref === el.ref);
          if (repeated_image === undefined) images_to_load.push({ id: el.id, ref: el.ref, data: { colors: el.colors, color_mapping: el.color_mapping } });
        })

      } else {
        data.ops.forEach(op => {
          const internal_op = this.ops.getOp(op.name);
          if (internal_op === undefined || internal_op == null || internal_op.params === undefined) return;
          const param_types = internal_op.params.map(el => el.type);
          param_types.forEach((p, ndx) => {
            //older version stored the media object reference in the parameter
            if (p == 'file') {
              const repeated_image = images_to_load.find(repeat_el => repeat_el.ref === op.params[ndx]);
              if (repeated_image === undefined) {
                let new_id = generateId(8);
                images_to_load.push({ id: new_id, ref: op.params[ndx], data: null });
                op.params[ndx] = new_id; //convert the value stored in memory to the instance id. 

              } else {
                op.params[ndx] = repeated_image.id;
              }
            }
          });
        })

      }
    }

    return this.media.loadMediaFromFileLoad(images_to_load).then(el => {
      console.log("[LOAD] STEP 1: Media loaded");
      //2. check the op names, if any op names are old, relink the newer version of that operation. If not match is found, replaces with Rect. 
      // console.log("REPLACE OUTDATED OPS")
      return this.tree.replaceOutdatedOps(data.ops);
    })
      .then(correctedOps => {
        console.log("[LOAD] STEP 2: Operations corrected");
        data.ops = correctedOps;
        //console.log(" LOAD NODES")
        return this.loadNodes(data.nodes)
      })
      .then(id_map => {
        console.log("[LOAD] STEP 3: Nodes loaded, ID map created", id_map.length, "nodes");
        entry_mapping = id_map;
        // console.log(" LOADED TREE Nodes ", this.tree.nodes, id_map)
        return this.loadTreeNodes(id_map, data.tree);
      })
      .then(treenodes => {
        console.log("[LOAD] STEP 4: Tree nodes loaded", treenodes.length, "tree nodes");
        const seednodes: Array<{ prev_id: number, cur_id: number }> = treenodes
          .filter(tn => this.tree.isSeedDraft(tn.tn.node.id))
          .map(tn => tn.entry);

        //attach teh drafts back to the seed nodes to which they belong
        const seeds: Array<{ entry, id, draft, loom, loom_settings, render_colors, scale, draft_visible }> = seednodes
          .filter(sn => data.nodes.find(node => node.node_id === sn.prev_id) !== undefined)
          .map(sn => {

            //this should always be true since we filterd out undefined nodes
            const draft_node = data.nodes.find(node => node.node_id === sn.prev_id);

            let ls: LoomSettings = {
              frames: this.ws.min_frames ?? defaults.loom_settings.frames,
              treadles: this.ws.min_treadles ?? defaults.loom_settings.treadles,
              epi: this.ws.epi ?? defaults.loom_settings.epi,
              ppi: this.ws.ppi ?? defaults.loom_settings.ppi,
              units: this.ws.units ?? defaults.loom_settings.units,
              type: this.ws.type ?? defaults.loom_settings.type
            }


            console.log("Looking for draft node", draft_node.node_id, "in", data.draft_nodes)
            const located_draft: DraftNodeProxy = data.draft_nodes.find(draft => draft.draft_id === draft_node.node_id);

            //if this happens it means that there is a node that is marked as a seed draft (probably an error) that does not have any 
            //associated draft data. 
            if (located_draft === undefined) {
              console.log("Looking for ", draft_node.node_id, "in", data.draft_nodes.map(el => el.draft_id))
              console.error("could not find draft with id in draft list");
              const d = initDraftWithParams({ warps: 1, wefts: 1, drawdown: [[createCell(false)]] });
              d.id = sn.cur_id;
              return {
                entry: sn,
                id: sn.cur_id,
                draft: d,
                loom: null,
                loom_settings: ls,
                render_colors: false,
                scale: 1,
                draft_visible: true
              }
            }
            else {
              const d = (located_draft.draft) ? copyDraft(located_draft.draft) : initDraftWithParams({ warps: 1, wefts: 1, drawdown: [[createCell(false)]] });
              d.id = (sn.cur_id);

              const loom = (located_draft.loom) ? copyLoom(located_draft.loom) : initLoom(warps(d.drawdown), wefts(d.drawdown), ls.frames, ls.treadles);

              return {
                entry: sn,
                id: sn.cur_id,
                draft: d,
                loom: loom,
                loom_settings: (located_draft.loom_settings) ? copyLoomSettings(located_draft.loom_settings) : ls,
                render_colors: located_draft.render_colors ?? false,
                scale: located_draft.scale ?? 1,
                draft_visible: located_draft.draft_visible ?? true
              }
            }
          });

        const seed_fns = seeds.map(seed => this.tree.loadDraftData(seed.entry, seed.draft, seed.loom, seed.loom_settings, seed.render_colors, seed.scale, seed.draft_visible));
        console.log("[LOAD] STEP 5: Creating", seed_fns.length, "seed drafts and", data.ops.length, "operations");

        const op_fns = data.ops.map(op => {
          const entry = entry_mapping.find(el => el.prev_id == op.node_id);
          return this.tree.loadOpData(entry, op.name, op.params, op.inlets);
        });

        return Promise.all([seed_fns, op_fns]);

      })
      .then(el => {
        console.log("[LOAD] STEP 6: Validating nodes");
        return this.tree.validateNodes();
      })
      .then(el => {
        console.log("[LOAD] STEP 7: Performing top level operations - THIS MAY TAKE TIME FOR LARGE FILES");
        const startTime = performance.now();
        return this.tree.performTopLevelOps().then(result => {
          const duration = performance.now() - startTime;
          console.log(`[LOAD] STEP 7 COMPLETE: Top level ops performed in ${duration.toFixed(2)}ms`);
          return result;
        });
      })
      .then(el => {
        console.log("[LOAD] STEP 8: Cleaning up null drafts");
        //delete any nodes that no longer need to exist

        this.tree.getDraftNodes()
          .filter(el => el.draft === null)
          .forEach(el => {
            if (this.tree.hasParent(el.id)) {
              el.draft = initDraftWithParams({ warps: 1, wefts: 1, drawdown: [[createCell(false)]] });
              el.draft.id = el.id;
            } else {
              this.tree.removeNode(el.id);
            }
          })
      })
      .then(el => {
        console.log("[LOAD] STEP 9: Loading UI components");

        return this.tree.nodes.forEach(node => {

          if (!(node.component === null || node.component === undefined)) return;

          const entry = entry_mapping.find(el => el.cur_id === node.id);
          if (entry === undefined) return;
          switch (node.type) {
            case 'draft':
              if (!this.tree.hasParent(node.id)) {
                this.mixer.loadSubDraft(node.id, this.tree.getDraft(node.id), data.nodes.find(el => el.node_id === entry.prev_id), data.draft_nodes.find(el => el.node_id === entry.prev_id));
              }
              break;
            case 'op':
              const op = this.tree.getOpNode(node.id);
              this.mixer.loadOperation(op.id, op.name, op.params, op.inlets, data.nodes.find(el => el.node_id === entry.prev_id).topleft);
              break;
            case 'cxn':

              //only load UI for connections that go from draft to operation
              let froms = this.tree.getInputs(node.id);
              if (froms.length > 0 && this.tree.getNode(froms[0]).type === 'draft') this.mixer.loadConnection(node.id)
              break;
          }
        })


      })
      .then(el => {
        console.log("[LOAD] STEP 10: Setting draft node properties");

        //NOW GO THOUGH ALL DRAFT NODES and ADD IN DATA THAT IS REQUIRED
        data.draft_nodes
          .forEach(np => {
            const new_id = entry_mapping.find(el => el.prev_id === np.node_id);

            if (new_id !== undefined) {
              const node = this.tree.getNode(new_id.cur_id);
              if (node !== undefined) {
                (<DraftNode>node).draft.gen_name = np.gen_name ?? 'drafty';
                (<DraftNode>node).draft.ud_name = np.ud_name ?? '';
                (<DraftNode>node).loom_settings = (np.loom_settings) ? copyLoomSettings(np.loom_settings) : defaults.loom_settings;
                (<DraftNode>node).loom = (np.loom) ? copyLoom(np.loom) : null;
                (<DraftNode>node).render_colors = np.render_colors ?? true;
                (<DraftNode>node).visible = np.draft_visible ?? true;
                (<DraftNode>node).scale = np.scale ?? 1
              } else {
                console.error("a node with the updated id was not found in the tree" + new_id);
              }
            } else {
              console.error("a new id for node not found" + np.node_id);
            }
          })

        //this is breaking on large files, disable because I also don't think it's needed anymore
        console.log("[LOAD] STEP 11: Updating operation children -- verify if we need this");
        this.tree.getOpNodes().forEach(op => {
          (<OperationComponent>op.component).updateChildren(this.tree.getNonCxnOutputs(op.id));
        })


        data.notes.forEach(note => {
          this.mixer.createNote(note);
        });


      })
      .then(res => {
        console.log("[LOAD] STEP 12: Starting final render - THIS MAY HANG ON LARGE FILES");
        const renderStartTime = performance.now();

        this.updateOrigin(this.ws.selected_origin_option);

        console.log("[LOAD] STEP 12a: Refreshing operations");
        //make sure the sidebar settings for operations are set
        this.mixer.refreshOperations();

        console.log("[LOAD] STEP 12b: Rendering mixer change");
        //set scale 
        this.mixer.renderChange();

        console.log("[LOAD] STEP 12c: Rendering editor change");
        this.editor.renderChange();

        const renderDuration = performance.now() - renderStartTime;
        console.log(`[LOAD] COMPLETE: All rendering finished in ${renderDuration.toFixed(2)}ms`);
        this.closeLoadingAnimation();

        return Promise.resolve(entry_mapping)
      })
      .catch(err => {
        console.error("[LOAD] ERROR:", err);
        this.openSnackBar('ERROR: there was a problem loading this file:' + err)

        //TO DO ADD ERROR STATEMENT
        this.closeLoadingAnimation();
        this.clearAll();



        //if it was an operation size error, remove the offending operation and try again. 
        if (err.includes('size check failed')) {
          const offending_op = this.tree.getOpNode(err.split(' ')[1]);

        }

        return Promise.reject(err)
      });






  }

  postOperationErrorMessage($event: any) {
    this.openSnackBar($event.error);
  }



  printTreeStatus(name: string, treenode: Array<TreeNode>) {

    treenode.forEach(tn => {
      if (tn === undefined) {
        console.log("Undefined Node", tn);
        return;
      }

      if (tn.inputs === undefined) {
        console.log("Undefined Inputs", tn);
        return;
      }

      if (tn.outputs === undefined) {
        console.log("Undefined Outputs", tn);
        return;
      }

      switch (tn.node.type) {
        case 'cxn':
          if (tn.inputs.length !== 1 || tn.outputs.length !== 1)
            console.log("Invalid Number of Inputs/Outputs on Connection", tn);
          break;

        case 'draft':
          if (tn.inputs.length > 1)
            console.log("Invalid Number of Inputs/Outputs on Draft", tn);
          break;
      }


    });
  }



  saveFile() {
    //if this user is logged in, write it to the
    this.fs.saver.ada()
      .then(so => {
        const nullppi = this.tree.getDraftNodes().filter(el => el.loom_settings.ppi === undefined);
        console.log("SAVING FILE ", nullppi);
        return this.fb.updateFile(so.file, this.ws.getCurrentFile());
      })
      .catch(err => console.error(err));
  }


  setAdvancedOperations() {
    this.mixer.refreshOperations();
  }


  openInEditor(id: number) {
    this.vs.clearPin();
    this.vs.setViewer(id);
    this.selected_editor_mode = 'draft';
    this.toggleEditorMode();
  }

  openInMixer(id: number) {
    this.vs.clearPin();
    this.vs.setViewer(id);
    this.selected_editor_mode = 'mixer';
    this.toggleEditorMode();
    this.mixer.setZoomAndCenter(id);
  }

  drawModeChange(mode: string) {
    this.mixer.changeDesignMode(mode);
  }



  undo() {

    const history = this.dialog.open(HistoryComponent, {
      width: '800px',
    });


    // this.fs.saver.ada()
    //   .then(current_state => {

    //     let so: SaveObj = this.ss.restorePreviousMixerHistoryState();
    //     console.log(this.ss.compareState(so, current_state.file))
    //     if (so === null || so === undefined) return;

    //   });


    // this.mixer.clearView();
    // this.editor.clearAll();
    // this.viewer.clearView();
    // this.tree.clear();


    // this.fs.loader.ada(
    //   so,
    //   this.ws.current_file,
    //   'undo'
    // ).then(lr => {
    //   this.loadNewFile(lr, 'statechange');
    // }




  }

  selectOriginOption(value: number) {
    this.ws.selected_origin_option = value;
    this.mixer.originChange(value);

  }

  selectLoom(value: string) {
    this.ws.type = value;
    //redraw?
  }

  selectUnit(value: "in" | 'cm') {
    this.ws.units = value;
    //redraw?
  }

  selectEpi(value: number) {
    this.ws.epi = value;
    //redraw?
  }



  updateDraftName(id: any) {

    if (id == -1) return;

    if (this.tree.hasParent(id)) {
      let parent = this.tree.getSubdraftParent(id);
      let comp = this.tree.getComponent(parent);
      (<OperationComponent>comp).draftContainers.forEach(el => el.updateName());
    } else {
      let comp = this.tree.getComponent(id);
      (<SubdraftComponent>comp).draftcontainer.updateName();
    }

    //update the anme in the viewer as well
    if (this.vs.getViewerId() === id) {
      this.viewer.updateDraftNameFromMixerEvent(this.tree.getDraftName(id));
    }
  }

  renameWorkspace(name: string) {

    console.log("RENAMING WORKSPACE TO ", name);

    this.filename_form.markAsPristine();

    //needs to be a deep copy 
    const beforeMeta: FileMeta = {
      id: this.ws.getCurrentFile().id,
      name: this.ws.getCurrentFile().name,
      desc: this.ws.getCurrentFile().desc,
      from_share: this.ws.getCurrentFile().from_share,
      share_owner: this.ws.getCurrentFile().share_owner,
      time: this.ws.getCurrentFile().time,
    };
    this.ws.getCurrentFile();
    this.ws.setCurrentFileName(name);
    const afterMeta = this.ws.getCurrentFile();
    this.ss.addStateChange(<FileMetaStateChange>{
      originator: 'FILEMETA',
      type: 'META_CHANGE',
      id: this.ws.getCurrentFile().id,
      before: beforeMeta,
      after: afterMeta
    });

    this.library.updateWorkspaceName(name)

  }

  renameWorkspaceFromLibrary(name: string) {
    this.filename_form.setValue(name, { emitEvent: false });
    this.filename_form.markAsPristine();

  }



  /**
   * the origin must be updated after the file has been loaded. 
   * @param selection 
   */
  updateOrigin(selection: number) {
    this.selected_origin = selection

  }

  updateMixerView(event: any) {
    this.mixer.renderChange();
  }

  /**
   * used to set the default value on the slider
   */
  getActiveZoomIndex(): number {
    if (this.selected_editor_mode == 'mixer') {
      return this.zs.zoom_table_ndx_mixer;
    } else {
      return this.zs.zoom_table_ndx_editor;
    }
  }

  /**
   * an emergency operation to move the palette in some direction because something rendered out of selectable area
   */
  bumpDataflow() {
    this.mixer.bumpDataflow();

  }


  zoomToFit(useCentering = false, padding = 0) {

    console.log(this.tree.tree);

    const view_window: HTMLElement = document.getElementById('scrollable-container');
    if (view_window === null || view_window === undefined) return;


    if (this.selected_editor_mode == 'mixer') {

      let selections = this.multiselect.getSelections();

      let node_list = (selections.length == 0) ? this.tree.getNodeIdList() : selections;
      let note_list = (selections.length == 0) ? this.notes.getNoteIdList() : [];

      const b_nodes = this.tree.getNodeBoundingBox(node_list);
      const n_nodes = this.notes.getNoteBoundingBox(note_list);
      const bounds = mergeBounds([b_nodes, n_nodes]);

      if (bounds == null) return;

      // apply padding around bounds to prevent clipping
      bounds.height += padding * 2;
      bounds.width += padding * 2;
      bounds.topleft.x -= padding;
      bounds.topleft.y -= padding;

      let prior = this.zs.getMixerZoom();
      const viewWindowRect = view_window.getBoundingClientRect();
      this.zs.zoomToFitMixer(bounds, viewWindowRect);
      this.mixer.renderChange();

      const newZoomRatio = this.zs.getMixerZoom();

      const boundsInPixels: Bounds = {
        width: bounds.width * newZoomRatio,
        height: bounds.height * newZoomRatio,
        topleft: {
          x: bounds.topleft.x * newZoomRatio,
          y: bounds.topleft.y * newZoomRatio
        }
      }

      const scrollDestination = { ...boundsInPixels.topleft };

      if (useCentering) {
        const surroundingWhitespace = {
          width: viewWindowRect.width - boundsInPixels.width,
          height: viewWindowRect.height - boundsInPixels.height,
        };

        scrollDestination.x -= surroundingWhitespace.width / 2;
        scrollDestination.y -= surroundingWhitespace.height / 2;
      }

      view_window.scroll({
        top: scrollDestination.y,
        left: scrollDestination.x,
        behavior: "instant",
      });

    } else {
      // this.zs.zoomToFitEditor()
      this.editor.renderChange();
    }
  }

  updateTextSizing() {

    if (this.selected_editor_mode == 'mixer') {
      //mixer ranges from about .01 - 2.
      let range = this.zs.num_steps;
      let pcent = 1 - (this.zs.zoom_table_ndx_mixer / range); //get the percent and then invert it


      const heading = interpolate(pcent, { min: .1, max: 6 })
      const form_field_entry_size = interpolate(pcent, { min: .05, max: 4 })
      const floating_label_size = interpolate(pcent, { min: .1, max: 3 })
      const floating_label_padding = interpolate(pcent, { min: .6, max: 5 })
      const container_height = form_field_entry_size * 3;
      const inlet_outlet_height = form_field_entry_size * 2;

      document.documentElement.style.setProperty('--scalable-text-heading-size', heading + 'rem');
      document.documentElement.style.setProperty('--form-field-entry-size', form_field_entry_size + 'rem');
      document.documentElement.style.setProperty('--floating-label-size', floating_label_size + 'rem');
      document.documentElement.style.setProperty('--floating-label-padding', floating_label_padding + 'rem');
      document.documentElement.style.setProperty('--input-container-height', container_height + 'rem');
      document.documentElement.style.setProperty('--inlet-outlet-height', inlet_outlet_height + 'rem');
    } else {

      //The editor needs to scale text and css sizings so that they match teh current scale of the UI




    }

  }


  zoomOut() {


    this.updateTextSizing();

    if (this.selected_editor_mode == 'mixer') {
      const prior = this.zs.getMixerZoom();
      this.zs.zoomOutMixer();
      this.mixer.renderChange();




    } else {
      this.zs.zoomOutEditor()
      this.editor.renderChange();
    }

    // Update the FormControl value to reflect the new zoom level
    this.zoom_form.setValue(this.getActiveZoomIndex(), { emitEvent: false });
  }

  zoomIn() {

    this.updateTextSizing();

    if (this.selected_editor_mode == 'mixer') {
      this.zs.zoomInMixer();
      this.mixer.renderChange();
    } else {
      this.zs.zoomInEditor()
      this.editor.renderChange();
    }

    // Update the FormControl value to reflect the new zoom level
    this.zoom_form.setValue(this.getActiveZoomIndex(), { emitEvent: false });

  }

  /**
   * pans the mixer by the given offset
   */
  panMixer(diff: { x: number, y: number }) {
    if (this.selected_editor_mode == 'mixer' && this.mixer && this.mixer.palette) {
      this.mixer.palette.handlePan(diff);
    }
  }

  onExplode() {
    this.updateTextSizing();

    this.mixer.explode();

  }

  zoomChange(ndx: number) {
    console.log("ZOOM CHANGE ", ndx);

    this.updateTextSizing();

    if (this.selected_editor_mode == 'mixer') {
      this.zs.setZoomIndexOnMixer(ndx);
      this.mixer.renderChange();
    } else {
      this.zs.setZoomIndexOnEditor(ndx)
      this.editor.renderChange();
    }
  }

  /**
   * Updates the zoom FormControl value when zoom changes from other sources
   * (like switching editor modes or programmatic zoom changes)
   */
  updateZoomFormControl(): void {
    if (this.zoom_form) {
      this.zoom_form.setValue(this.getActiveZoomIndex(), { emitEvent: false });
    }
  }


}
