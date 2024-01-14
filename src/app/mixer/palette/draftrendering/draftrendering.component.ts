import { Component, Input, Output, SimpleChanges, EventEmitter, ViewChild } from '@angular/core';
import { FileService } from '../../../core/provider/file.service';
import { Draft, DraftNode } from '../../../core/model/datatypes';
import { flipDraft, getDraftAsImage, getDraftName, isSet, isUp, warps, wefts } from '../../../core/model/drafts';
import { MaterialsService } from '../../../core/provider/materials.service';
import { SystemsService } from '../../../core/provider/systems.service';
import { TreeService } from '../../../core/provider/tree.service';
import { WorkspaceService } from '../../../core/provider/workspace.service';

@Component({
  selector: 'app-draftrendering',
  templateUrl: './draftrendering.component.html',
  styleUrls: ['./draftrendering.component.scss']
})
export class DraftrenderingComponent {

  @Input() id;
  @Input() dirty;
  @Input() hasParent;
  @Output() connectionSelected = new EventEmitter();
  @Output() onDuplicateCalled = new EventEmitter();
  @Output() onDeleteCalled = new EventEmitter();
  @ViewChild('bitmapImage') bitmap: any;

  draft_canvas: HTMLCanvasElement;
  draft_cx: any;

  warp_data_canvas: HTMLCanvasElement;
  warp_data_cx: any;

  pixel_ratio: number = 1;

  draft_cell_size: number = 8;

  exceeds_size: boolean = false;

  ud_name: string = '';

  warps: number; 

  wefts: number;

  selecting_connection: boolean;

  draft_visible: boolean = true;

  use_colors: boolean = true;



  constructor(
    private ms: MaterialsService,
    private fs: FileService,
    public tree: TreeService,
    private ss: SystemsService,
    public ws: WorkspaceService){

  }

  ngAfterViewInit() {


    const draft = this.tree.getDraft(this.id);
    this.drawDraft(draft);  
    this.ud_name = draft.ud_name;
    this.warps = warps(draft.drawdown);
    this.wefts = wefts(draft.drawdown)
  

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dirty']) {
      const draft = this.tree.getDraft(this.id);
      this.ud_name = getDraftName(draft);
      this.warps = warps(draft.drawdown);
      this.wefts = wefts(draft.drawdown)
      this.drawDraft(draft);    
    }
}

  nameFocusOut(event){
  }

  connectionStarted(event){
    this.selecting_connection = true;
    this.connectionSelected.emit({event: event, id: this.id});
  }



  async drawCell(draft:Draft, cell_size:number, i:number, j:number, usecolor:boolean, forprint:boolean){

    cell_size *= this.pixel_ratio;
    let is_up = isUp(draft.drawdown, i,j);
    let is_set = isSet(draft.drawdown, i, j);
    let color = "#ffffff"
    if(is_set){

      if(is_up){
        color = usecolor ? this.ms.getColor(draft.colShuttleMapping[j]) : '#000000';
      }else{
        color = usecolor ? this.ms.getColor(draft.rowShuttleMapping[i]) : '#ffffff';
      }
      this.draft_cx.fillStyle = color;
      
    } else{
      if(forprint) this.draft_cx.fillStyle =  '#ffffff'
      else this.draft_cx.fillStyle =  '#ADD8E6';
    // this.cx.fillStyle =  '#ff0000';

    }

    this.draft_cx.strokeStyle = "#666666"
    this.draft_cx.lineWidth = 1;

    if(!forprint && cell_size > 1 && usecolor === false) this.draft_cx.strokeRect(j*cell_size, i*cell_size, cell_size, cell_size);
    this.draft_cx.fillRect(j*cell_size, i*cell_size, cell_size, cell_size);
  }

  drawWeftData(draft: Draft) : Promise<boolean>{
    let cell_size = this.calculateCellSize(draft);

    const weft_systems_canvas =  <HTMLCanvasElement> document.getElementById('weft-systems-'+this.id.toString());
    const weft_mats_canvas =  <HTMLCanvasElement> document.getElementById('weft-materials-'+this.id.toString());
    if(weft_systems_canvas === undefined) return;

    const weft_systems_cx = weft_systems_canvas.getContext("2d");
    const weft_mats_cx = weft_mats_canvas.getContext("2d");

    weft_systems_canvas.height = wefts(draft.drawdown) * cell_size * this.pixel_ratio;
    weft_systems_canvas.width = cell_size * this.pixel_ratio
    weft_systems_canvas.style.height = (wefts(draft.drawdown) * cell_size)+"px";
    weft_systems_canvas.style.width = cell_size+"px";
    weft_mats_canvas.height = wefts(draft.drawdown) * cell_size * this.pixel_ratio;
    weft_mats_canvas.width =  cell_size*this.pixel_ratio;
    weft_mats_canvas.style.height =(wefts(draft.drawdown) * cell_size)+"px";
    weft_mats_canvas.style.width =  cell_size+"px";
    let system = null;

      for (let j = 0; j < draft.rowShuttleMapping.length; j++) {

        switch(this.ws.selected_origin_option){
          case 1:
          case 2: 
          system = this.ss.getWeftSystemCode(draft.rowSystemMapping[draft.rowSystemMapping.length-1 - j]);

          break;
          case 0: 
          case 3: 
          system = this.ss.getWeftSystemCode(draft.rowSystemMapping[j]);

          break;
        }

        let color = this.ms.getColor(draft.rowShuttleMapping[j]);
        weft_mats_cx.fillStyle = color;
        weft_mats_cx.fillRect(1, j* cell_size*this.pixel_ratio+1,  cell_size*this.pixel_ratio-2,  cell_size*this.pixel_ratio-2);
        
        weft_systems_cx.font = cell_size*this.pixel_ratio+"px Arial";
        weft_systems_cx.fillStyle = "#666666";
        weft_systems_cx.fillText(system, 5, (j+1)*cell_size*this.pixel_ratio - 5)


      }
    
    

  }

  drawWarpData(draft: Draft) : Promise<boolean>{
    // set the width and height

    draft =  this.tree.getDraft(this.id);
    let cell_size = this.calculateCellSize(draft);


    const warp_systems_canvas =  <HTMLCanvasElement> document.getElementById('warp-systems-'+this.id.toString());
    const warp_mats_canvas =  <HTMLCanvasElement> document.getElementById('warp-materials-'+this.id.toString());

    if(this.warp_data_canvas === undefined) return;
    const warp_mats_cx = warp_mats_canvas.getContext("2d");
    const warp_systems_cx = warp_systems_canvas.getContext("2d");

    warp_mats_canvas.width = warps(draft.drawdown) * cell_size * this.pixel_ratio;
    warp_mats_canvas.height =  cell_size * this.pixel_ratio;
    warp_mats_canvas.style.width = (warps(draft.drawdown) * cell_size)+"px";
    warp_mats_canvas.style.height =  cell_size+"px";

    warp_systems_canvas.width = warps(draft.drawdown) * cell_size * this.pixel_ratio;
    warp_systems_canvas.height =  cell_size * this.pixel_ratio;
    warp_systems_canvas.style.width = (warps(draft.drawdown) * cell_size)+"px";
    warp_systems_canvas.style.height =  cell_size+"px";

    let system = null;

      for (let j = 0; j < draft.colShuttleMapping.length; j++) {
        let color = this.ms.getColor(draft.colShuttleMapping[j]);
        switch(this.ws.selected_origin_option){
          case 0:
          case 1: 
          system = this.ss.getWarpSystemCode(draft.colSystemMapping[draft.colSystemMapping.length-1 - j]);

          break;
          case 2: 
          case 3: 
          system = this.ss.getWarpSystemCode(draft.colSystemMapping[j]);

          break;
        }
      
        //cell_size *= this.pixel_ratio
        warp_mats_cx.fillStyle = color;
        warp_mats_cx.fillRect(j* cell_size*this.pixel_ratio+1, 1,  cell_size*this.pixel_ratio-2,  cell_size*this.pixel_ratio-2);
        
        //need to flip this on certain origins. 
        warp_systems_cx.font = cell_size*this.pixel_ratio+"px Arial";
        warp_systems_cx.fillStyle = "#666666";
        warp_systems_cx.fillText(system, j*cell_size*this.pixel_ratio+2, cell_size*this.pixel_ratio-5)

      
      }
    

  }


  /**
   * draw whetever is stored in the draft object to the screen
   * @returns 
   */
  async drawDraft(draft: Draft) : Promise<any> {

    if(this.hasParent && this.ws.hide_mixer_drafts) return;

    this.draft_canvas = <HTMLCanvasElement> document.getElementById(this.id.toString());
    this.draft_cx = this.draft_canvas.getContext("2d");

    this.warp_data_canvas = <HTMLCanvasElement> document.getElementById('warp-data-'+this.id.toString());
    this.warp_data_cx = this.draft_canvas.getContext("2d");

        // set the width and height
    let dpr = window.devicePixelRatio || 1;
    let bsr =  this.draft_cx.webkitBackingStorePixelRatio ||
    this.draft_cx.mozBackingStorePixelRatio ||
    this.draft_cx.msBackingStorePixelRatio ||
    this.draft_cx.oBackingStorePixelRatio ||
    this.draft_cx.backingStorePixelRatio || 1;
    this.pixel_ratio = dpr/bsr;




    let cell_size = this.calculateCellSize(draft);

    draft =  this.tree.getDraft(this.id);
    const use_colors =(<DraftNode>this.tree.getNode(this.id)).render_colors;


    if(this.draft_canvas === undefined) return;
    this.draft_cx = this.draft_canvas.getContext("2d");

   
    if(draft === null){
      this.draft_canvas.width = 0;
      this.draft_canvas.height = 0;
      this.tree.setDraftClean(this.id);
      return Promise.resolve("complete");
 //   }else if(cell_size === 0){
    }else{

     const fns = [this.drawWarpData(draft), this.drawWeftData(draft)];
      return Promise.all(fns).then(el => {


      this.draft_canvas.width = warps(draft.drawdown)*cell_size;
      this.draft_canvas.height = wefts(draft.drawdown)*cell_size;
      this.draft_canvas.style.width = (warps(draft.drawdown)*cell_size)+"px";
      this.draft_canvas.style.height = (wefts(draft.drawdown)*cell_size)+"px";
 
      let img = getDraftAsImage(draft, cell_size, use_colors, use_colors, this.ms.getShuttles());
      this.draft_cx.putImageData(img, 0, 0);
      this.tree.setDraftClean(this.id);
      });

    }
  }


  /**
   * the canvas object is limited in how many pixels it can render. Adjust the draft cell size based on the number of cells in the draft
   * @param draft 
   */
  calculateCellSize(draft: Draft): number{

    let max_bound = Math.max(wefts(draft.drawdown), warps(draft.drawdown));
    if(max_bound*this.draft_cell_size < 4096){
      return Math.floor(this.draft_cell_size);
    }else if(max_bound < 4096){
      return  Math.floor(4096/max_bound);
    }else{
      this.draft_cell_size = 1;
      return 1;
    }

  }



 
  
  updateName(){
    const draft = this.tree.getDraft(this.id);
    draft.ud_name = this.ud_name;

  }

  async saveAsPrint() {

    let b = this.bitmap.nativeElement;
    let context = b.getContext('2d');
    let draft = this.tree.getDraft(this.id);
    b.width = (warps(draft.drawdown)+3)*10;
    b.height =(wefts(draft.drawdown)+7)*10;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, b.width, b.height);

    switch(this.ws.selected_origin_option){
      case 0:
        draft = await flipDraft(draft, true, false);
      break;

      case 1:
        draft = await flipDraft(draft, true, true);
        break;

      case 2:
        draft = await flipDraft(draft, false, true);

      break;

    }


  let system = null;

    for (let j = 0; j < draft.colShuttleMapping.length; j++) {
      let color = this.ms.getColor(draft.colShuttleMapping[j]);
      switch(this.ws.selected_origin_option){
        case 0:
        case 1: 
        system = this.ss.getWarpSystemCode(draft.colSystemMapping[draft.colSystemMapping.length-1 - j]);

        break;
        case 2: 
        case 3: 
        system = this.ss.getWarpSystemCode(draft.colSystemMapping[j]);

        break;
      }
    
      context.fillStyle = color;
      context.strokeStyle = "#666666";
      context.fillRect(30+(j*10), 16,  8,  8);
      context.strokeRect(30+(j*10), 16,  8,  8);

      context.font = "10px Arial";
      context.fillStyle = "#666666";
      context.fillText(system, j*10+32, 10)

    
    }


      for (let j = 0; j < draft.rowShuttleMapping.length; j++) {

        switch(this.ws.selected_origin_option){
          case 1:
          case 2: 
          system = this.ss.getWeftSystemCode(draft.rowSystemMapping[draft.rowSystemMapping.length-1 - j]);

          break;
          case 0: 
          case 3: 
          system = this.ss.getWeftSystemCode(draft.rowSystemMapping[j]);

          break;
        }

        let color = this.ms.getColor(draft.rowShuttleMapping[j]);
        context.fillStyle = color;
        context.strokeStyle = "#666666";
        context.fillRect(16, j*10+31,  8,  8);
        context.strokeRect(16, j*10+31,  8,  8);
        
        context.font = "10px Arial";
        context.fillStyle = "#666666";
        context.fillText(system, 0, 28+(j+1)*10)


      }



    let img = getDraftAsImage(draft, 10, true, this.use_colors, this.ms.getShuttles());  
    context.putImageData(img, 30, 30);

    context.font = "12px Arial";
    context.fillStyle = "#000000";
    let textstring = getDraftName(draft)+" // "+warps(draft.drawdown)+" x "+wefts(draft.drawdown);
    context.fillText(textstring, 30, 50+wefts(draft.drawdown)*10)

    const a = document.createElement('a')
    return this.fs.saver.jpg(b)
    .then(href => {
      a.href =  href;
      a.download = getDraftName(draft) + ".jpg";
      a.click();  
    });
    
  }

    /**
   * Draws to hidden bitmap canvas a file in which each draft cell is represented as a single pixel. 
   * @returns 
   */
    async saveAsBmp() : Promise<any> {

      let b = this.bitmap.nativeElement;
      let context = b.getContext('2d');
      let draft = this.tree.getDraft(this.id);
      switch(this.ws.selected_origin_option){
        case 0:
          draft = await flipDraft(draft, true, false);
        break;
  
        case 1:
          draft = await flipDraft(draft, true, true);
          break;
  
        case 2:
          draft = await flipDraft(draft, false, true);
  
        break;
  
      }
  
      b.width = warps(draft.drawdown);
      b.height = wefts(draft.drawdown);
      let img = getDraftAsImage(draft, 1, false, false, this.ms.getShuttles());
      context.putImageData(img, 0, 0);
  
      const a = document.createElement('a')
      return this.fs.saver.bmp(b)
      .then(href => {
        a.href =  href;
        a.download = getDraftName(draft) + "_bitmap.jpg";
        a.click();
      });
      
  
  
        
    }

    async designActionChange(e){
  
      console.log("DESIGN ACTION ", e)

      switch(e){
        case 'duplicate':   
        this.onDuplicateCalled.emit({event: e, id: this.id});
        break;
  
        case 'delete': 
          this.onDeleteCalled.emit({event: e,id: this.id});
        break;
  

  
      }
    }


    zoomChange(event: any){
      this.draft_cell_size = event;
      this.drawDraft(this.tree.getDraft(this.id));
    }
  

    toggleDraftRendering(){
      const dn = <DraftNode> this.tree.getNode(this.id);
      dn.render_colors = !dn.render_colors;
      this.use_colors = dn.render_colors;
      this.drawDraft(this.tree.getDraft(this.id));
    }
  
  


}
