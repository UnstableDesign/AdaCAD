import { Component, Input, Output, SimpleChanges, EventEmitter, ViewChild } from '@angular/core';
import { FileService } from '../../../core/provider/file.service';
import { CanvasList, Draft, DraftNode, Loom, LoomSettings, RenderingFlags } from '../../../core/model/datatypes';
import { flipDraft, getDraftAsImage, getDraftName, initDraft, isSet, isUp, warps, wefts } from '../../../core/model/drafts';
import { MaterialsService } from '../../../core/provider/materials.service';
import { SystemsService } from '../../../core/provider/systems.service';
import { TreeService } from '../../../core/provider/tree.service';
import { WorkspaceService } from '../../../core/provider/workspace.service';
import utilInstance from '../../../core/model/util';
import { DesignmodesService } from '../../../core/provider/designmodes.service';
import { RenderService } from '../../../core/provider/render.service';
import { DraftRenderingComponent } from '../../../core/ui/draft-rendering/draft-rendering.component';

@Component({
  selector: 'app-draftcontainer',
  templateUrl: './draftcontainer.component.html',
  styleUrls: ['./draftcontainer.component.scss']
})
export class DraftContainerComponent {

  @Input() id;
  @Input() dirty;
  @Input() hasParent;
  @Input() selecting_connection;
  @Output() connectionSelected = new EventEmitter();
  @Output() onDuplicateCalled = new EventEmitter();
  @Output() onDeleteCalled = new EventEmitter();
  @Output() onSelectCalled = new EventEmitter();
  @Output() onOpenInEditor = new EventEmitter();
  @ViewChild('bitmapImage') bitmap: any;
  @ViewChild('draftRendering') draft_rendering: DraftRenderingComponent;



  draft_cell_size: number = 40;

  exceeds_size: boolean = false;

  ud_name: string = '';

  warps: number; 

  wefts: number;

  draft_visible: boolean = true;

  use_colors: boolean = false;

  outlet_connected: boolean = true;

  draft_name: string = "";



  constructor(
    private dm: DesignmodesService,
    private ms: MaterialsService,
    private fs: FileService,
    public tree: TreeService,
    public render: RenderService,
    private ss: SystemsService,
    public ws: WorkspaceService){

  }

  ngOnInit(){
    console.log('ON INIT ID IS ', this.id)
  }

  ngAfterViewInit() {


    const draft = this.tree.getDraft(this.id);
    this.drawDraft(draft);  
    this.ud_name = draft.ud_name;
    this.warps = warps(draft.drawdown);
    this.wefts = wefts(draft.drawdown);

    this.outlet_connected = (this.tree.getNonCxnOutputs(this.id).length > 0);
    this.draft_name = this.tree.getDraftName(this.id)

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dirty']) {
      if(this.dm.isSelectedDraftEditSource('drawdown')) return;

      let draft = this.tree.getDraft(this.id);
      
      if(draft == undefined) draft = initDraft();
      
      this.ud_name = getDraftName(draft);
      this.warps = warps(draft.drawdown);
      this.wefts = wefts(draft.drawdown);
      this.drawDraft(draft);    
    }
}

  nameFocusOut(event){
  }

  connectionStarted(event){
    this.connectionSelected.emit({event: event, id: this.id});
  }

  selectForView(){
    this.onSelectCalled.emit()
  }

  openInEditor(){
    this.onOpenInEditor.emit(this.id)
  }



  drawDraft(draft: Draft) : Promise<boolean>{
    if(this.hasParent && this.ws.hide_mixer_drafts) return Promise.resolve(false);
    if(this.draft_rendering == null || this.draft_rendering == undefined)return Promise.resolve(false);

    const loom = this.tree.getLoom(this.id);
    const loom_settings = this.tree.getLoomSettings(this.id);


    let flags = {
      drawdown: true
    }


    return this.draft_rendering.redraw(draft, loom, loom_settings, flags ).then(el => {
      this.tree.setDraftClean(this.id);
      return Promise.resolve(true);
    })

    

  }
 
  
  updateName(){
    const draft = this.tree.getDraft(this.id);
    draft.ud_name = this.ud_name;

  }

  async saveAsWif() {

    let draft = this.tree.getDraft(this.id);
    let loom = this.tree.getLoom(this.id);
    let loom_settings = this.tree.getLoomSettings(this.id);
    utilInstance.saveAsWif(this.fs, draft, loom, loom_settings)

  
  }

  async saveAsPrint() {
    let draft = this.tree.getDraft(this.id);

    utilInstance.saveAsPrint(
      this.bitmap.nativeElement,
      draft,
      this.use_colors,
      this.ws.selected_origin_option, 
      this.ms,
      this.ss,
      this.fs
    )
  }


    /**
   * Draws to hidden bitmap canvas a file in which each draft cell is represented as a single pixel. 
   * @returns 
   */
    async saveAsBmp() : Promise<any> {

      let b = this.bitmap.nativeElement;
      let draft = this.tree.getDraft(this.id);

      utilInstance.saveAsBmp(b, draft, this.ws.selected_origin_option, this.ms, this.fs)
        
    }

    async designActionChange(e){
  
      switch(e){
        case 'duplicate':   
        this.onDuplicateCalled.emit({event: e, id: this.id});
        break;
  
        case 'delete': 
          this.onDeleteCalled.emit({event: e,id: this.id});
        break;
  

  
      }
    }


    localZoomChange(event: any){

      const div = document.getElementById('subdraft-container-'+this.id);
    //  div.style.transform = 'scale('+event+')';
      div.style.scale = event;

    }
  

    toggleDraftRendering(){
      const dn = <DraftNode> this.tree.getNode(this.id);
      dn.render_colors = !dn.render_colors;
      this.use_colors = dn.render_colors;
      this.drawDraft(this.tree.getDraft(this.id));
    }
  
  


}