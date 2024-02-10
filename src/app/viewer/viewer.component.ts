import { Component, Input, ViewChild, SimpleChanges } from '@angular/core';
import { Draft, DraftNode } from '../core/model/datatypes';
import { getDraftAsImage, warps, wefts } from '../core/model/drafts';
import { FilesystemService } from '../core/provider/filesystem.service';
import { MaterialsService } from '../core/provider/materials.service';
import { TreeService } from '../core/provider/tree.service';
import { SimulationComponent } from './simulation/simulation.component';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent {
  @Input() id;
  @ViewChild(SimulationComponent) sim;


  draft_canvas: HTMLCanvasElement;
  draft_cx: any;
  pixel_ratio: number = 1;
  draft_cell_size: number = 8;


  constructor(
    public files: FilesystemService, 
    private ms: MaterialsService,
    private tree: TreeService){
    
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['id']) {
      this.drawDraft(changes['id'].currentValue);    
    }
    if (changes['dirty']) {
      this.drawDraft(changes['id'].currentValue);    
    }


}


  /**
   * the canvas object is limited in how many pixels it can render. Adjust the draft cell size based on the number of cells in the draft
   * @param draft 
   */
  calculateCellSize(draft: Draft): number{

    if(draft == null) return 8;

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


  /**
   * draw whetever is stored in the draft object to the screen
   * @returns 
   */
  async drawDraft(id: number) : Promise<any> {

    if(id == -1) return;


    console.log("ID IS ", id)
    const draft:Draft = this.tree.getDraft(id);
    console.log("Draft IS ", draft)

    this.draft_canvas = <HTMLCanvasElement> document.getElementById('viewer_canvas');
    if(this.draft_canvas == null) return;

    console.log("Cavas IS ", this.draft_canvas)

    this.draft_cx = this.draft_canvas.getContext("2d");

        // set the width and height
    let dpr = window.devicePixelRatio || 1;
    let bsr =  this.draft_cx.webkitBackingStorePixelRatio ||
    this.draft_cx.mozBackingStorePixelRatio ||
    this.draft_cx.msBackingStorePixelRatio ||
    this.draft_cx.oBackingStorePixelRatio ||
    this.draft_cx.backingStorePixelRatio || 1;
    this.pixel_ratio = dpr/bsr;

    let cell_size = this.calculateCellSize(draft);
    console.log("cell size IS ", cell_size)

    const use_colors =true;


    if(this.draft_canvas === undefined) return;
    this.draft_cx = this.draft_canvas.getContext("2d");

   
    if(draft === null){
      this.draft_canvas.width = 0;
      this.draft_canvas.height = 0;
    }else{

      this.draft_canvas.width = warps(draft.drawdown)*cell_size;
      this.draft_canvas.height = wefts(draft.drawdown)*cell_size;
      this.draft_canvas.style.width = (warps(draft.drawdown)*cell_size)+"px";
      this.draft_canvas.style.height = (wefts(draft.drawdown)*cell_size)+"px";
 
      let img = getDraftAsImage(draft, cell_size, use_colors, use_colors, this.ms.getShuttles());
      this.draft_cx.putImageData(img, 0, 0);

    }
  }


}
