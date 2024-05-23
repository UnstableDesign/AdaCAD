import { Component, Input, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CanvasList, Draft, DraftNode, RenderingFlags } from '../core/model/datatypes';
import { createDraft, getDraftAsImage, getDraftName, initDraft, warps, wefts } from '../core/model/drafts';
import { FilesystemService } from '../core/provider/filesystem.service';
import { MaterialsService } from '../core/provider/materials.service';
import { TreeService } from '../core/provider/tree.service';
import { SimulationComponent } from './simulation/simulation.component';
import { AuthService } from '../core/provider/auth.service';
import { ZoomService } from '../core/provider/zoom.service';
import { RenderService } from '../core/provider/render.service';
import { DraftRenderingComponent } from '../core/ui/draft-rendering/draft-rendering.component';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent {

 @Input() id: number;

  @Output() onLoadBlankFile: any = new EventEmitter();
  @Output() onOpenEditor: any = new EventEmitter();
  @Output() onClearWorkspace: any = new EventEmitter();
  @Output() onOpenExamples: any = new EventEmitter();
  @Output() onOpenMaterials: any = new EventEmitter();
  @Output() openHelp: any = new EventEmitter();
  @Output() onViewerExpanded: any = new EventEmitter();
  @Output() onViewerCollapsed: any = new EventEmitter();
  @Output() onSave: any = new EventEmitter();

  @ViewChild(SimulationComponent) sim;
  @ViewChild('view_rendering') view_rendering: DraftRenderingComponent;

  draft_canvas: HTMLCanvasElement;
  draft_cx: any;
  pixel_ratio: number = 1;
  draft_name: string = '';
  vis_mode: string = 'color'; //sim, draft, structure, color
  view_expanded: boolean = false;
  filename: string = '';

  warps: number = 0;
  wefts: number = 0;
  scale: number = 0;


  constructor(
    public auth: AuthService,
    public files: FilesystemService, 
    private ms: MaterialsService,
    private render: RenderService,
    private tree: TreeService,
    public zs: ZoomService){

  }

ngOnInit(){
  this.filename = this.files.getCurrentFileName();
  this.scale = this.zs.getViewerZoom();
}


getVisVariables(){
  switch(this.vis_mode){
    case 'sim':
    case 'draft':
      return {use_colors: false, floats: false};
    case 'structure':
      return {use_colors: false, floats: true};
    case 'color':
      return {use_colors: true, floats: true};
  }
}



  loadBlankFile(){
    this.onLoadBlankFile.emit();
  }

  clearWorkspace(){
    this.onClearWorkspace.emit();
  }

  openHelpDialog(){
    this.openHelp.emit();
  }

  openExamples(){
    this.onOpenExamples.emit();

  }

  openMaterials(){
    this.onOpenMaterials.emit();

  }


  /**
   * redraws the current draft, usually following an update from the drawdown
   */
  redraw(id: number){
    this.id = id;
    let vars = this.getVisVariables();
    const draft = this.tree.getDraft(id);
    if(draft !== null){
    this.warps = warps(draft.drawdown);
    this.wefts = wefts(draft.drawdown);
    }else{
      this.warps = 0;
      this.wefts = 0;
    }
    if(this.vis_mode != 'sim') {
      this.drawDraft(id, vars. floats, vars.use_colors);        
      this.centerScrollbars();
  }
    else this.sim.loadNewDraft(this.id);
  }


  centerScrollbars(){
    // let div = document.getElementById('static_draft_view');
    // let rect = document.getElementById('viewer-scale-container').getBoundingClientRect();
    // div.scrollTop = div.scrollHeight/2;
    // div.scrollLeft = div.scrollWidth/2;
    // div.scrollTo({
    //   top: rect.height/2,
    //   left: rect.width/2
    // })
  }

  filenameChange(){
    const id = this.files.getCurrentFileId();
    this.files.renameFile(id, this.filename);
  }


  viewAsSimulation(){
    this.vis_mode = 'sim';
    this.sim.loadNewDraft(this.id);

  }

  viewAsDraft(){
    this.vis_mode = 'draft';
    let vars = this.getVisVariables();
    this.drawDraft(this.id, vars.floats, vars.use_colors);   
  }

  viewAsStructure(){
    this.vis_mode = 'structure';
    let vars = this.getVisVariables();

    this.drawDraft(this.id, vars.floats, vars.use_colors);   
  }

  viewAsColor(){
    this.vis_mode = 'color';
    let vars = this.getVisVariables();
    this.drawDraft(this.id, vars.floats, vars.use_colors);   
  }

  onExpand(){
    this.view_expanded = true;
    this.onViewerExpanded.emit();
    this.redraw(this.id);


  }

  onCollapse(){
    this.view_expanded = false;
    this.onViewerCollapsed.emit();
    this.redraw(this.id);

  }

  openEditor(){
    this.onOpenEditor.emit(this.id);
  }


  clearView(){
    this.draft_canvas = <HTMLCanvasElement> document.getElementById('viewer_canvas');
    if(this.draft_canvas == null) return;
    this.draft_cx = this.draft_canvas.getContext("2d");

    this.draft_name = 'no draft selected';
    this.draft_canvas.width = 0;
    this.draft_canvas.height = 0;
    this.draft_canvas.style.width = "0px";
    this.draft_canvas.style.height = "0px";
  }

  saveAs(format: string){
    this.onSave.emit(format);
  }

  //when expanded, someone can set the zoom from the main zoom bar
  //this is called, then, to rescale the view
  renderChange(){
    this.scale = this.zs.getViewerZoom();
    if(this.id == -1) return;
    this.view_rendering.redrawAll();
  }

  /**
   * draw whetever is stored in the draft object to the screen
   * @returns 
   */
  async drawDraft(id: number, floats: boolean, use_colors: boolean) : Promise<any> {

    if(id === -1){
      this.clearView();
      return Promise.resolve(false);
    }


    this.id = id;
    const draft:Draft = this.tree.getDraft(id);
    this.draft_name = getDraftName(draft);


    let flags =  {
      drawdown: true, 
      use_colors: (this.vis_mode == 'color'),
      use_floats: (this.vis_mode != 'draft'), 
      show_loom: false
    }

    return this.view_rendering.redraw(draft, null, null, flags).then(el => {
      return Promise.resolve(true);
    })

   
    
    }

  }




