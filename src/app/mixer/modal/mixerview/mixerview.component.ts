import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { Bounds, DesignMode, Point } from '../../../core/model/datatypes';
import { ViewportService } from '../../provider/viewport.service';
import { ZoomService } from '../../provider/zoom.service';

@Component({
  selector: 'app-mixerview',
  templateUrl: './mixerview.component.html',
  styleUrls: ['./mixerview.component.scss']
})
export class MixerViewComponent implements OnInit {
  
  @Output() onZoomChange: any = new EventEmitter();
  @Output() onViewPortMove: any = new EventEmitter();

  //the bounds of the modal window
  bounds: Bounds;

  //the bounds of the draggable "local" view
  local_view:Bounds;

  //ratio of the global div to the absolute space
  factor:number;

  // the number of pixels that represent one cell in the preview space
  cell_factor: number;

  //the width and height of the global view
  width: number;
  height: number;


  data = {zoom: 5, default_cell_size: 5};
  div: Element;


 constructor(
  public viewport: ViewportService, 
  public zs:ZoomService) { 

    this.viewport.vpchanged$.subscribe(data => {
      this.updateLocalDims();
    })



 
  this.local_view = {
    topleft: {x:0, y:0}, 
    width: 100, 
    height:100
  };

  // this.zoom = data.zoom;

  this.bounds = {
    topleft:{x: 0, y:0},
    width: 350,
    height: 100
  }

  this.width = 250;
  this.height = 250;

  //ratio of the global space to the total width of the global div
  this.factor = this.width / viewport.getAbsoluteWidth();

  //each cell is rendered cell factor number pixels in the global view
  //this does not change when zoomed
  this.cell_factor = this.width / ((viewport.getAbsoluteWidth() / this.data.default_cell_size));
 
}
 
  ngOnInit() {
   // console.log('viewport', this.local_view);
  }



  ngAfterViewInit() {

    this.div = document.getElementById('scrollable-container').offsetParent;
    this.updateLocalDims();
  }

  getCx(obj: any) : number {
    return obj.p.x * this.factor;
  }


  

  updateLocalDims(){

    this.local_view.topleft = {
      x: this.div.scrollLeft / this.zs.zoom * this.cell_factor, 
      y: this.div.scrollTop  / this.zs.zoom * this.cell_factor};
  }


  updateViewPort(data: any){
    this.updateLocalDims();
  }

  updateViewPortFromZoom(){
    this.updateLocalDims();
    
  }

  zoomIn(){
    const old_zoom = this.zs.zoom;
    this.zs.zoomIn();
    this.onZoomChange.emit({old_zoom: old_zoom});
    const adjusted: Point = {
      x: this.local_view.topleft.x / this.cell_factor * this.zs.zoom,
      y: this.local_view.topleft.y / this.cell_factor * this.zs.zoom
    }
      this.onViewPortMove.emit(adjusted);
  }
  


  zoomOut(){
    const old_zoom = this.zs.zoom;
    this.zs.zoomOut();
    this.onZoomChange.emit({old_zoom: old_zoom});
      const adjusted: Point = {
       x: this.local_view.topleft.x / this.cell_factor * this.zs.zoom,
       y: this.local_view.topleft.y / this.cell_factor * this.zs.zoom
     }
   
     this.onViewPortMove.emit(adjusted);
    
  
}
 

zoomChange(e:any, source: string){
  e.source = source;
  const old_zoom = this.zs.zoom;

  this.zs.setZoom(e.value);
 // this.updateLocalDims();
 //update the window so that the current point remains at top left
  this.onZoomChange.emit({old_zoom: old_zoom});

  const adjusted: Point = {
    x: this.local_view.topleft.x / this.cell_factor * this.zs.zoom,
    y: this.local_view.topleft.y / this.cell_factor * this.zs.zoom
  }

  this.onViewPortMove.emit(adjusted);

}


dragEnd($event: any) {
  
}

dragStart($event: any) {

}

getMatrix(el: HTMLElement) : Array<number> {
  const values = el.style.transform.split(/\w+\(|\);?/);
    if (!values[1] || !values[1].length) {
        return [];
    }
    
    const text_vals:Array<string> = values[1].split(/,\s?/g);
    const numbers: Array<number> = text_vals.map(el => parseInt(el))
    return numbers;
}

dragMove($event: any) {

    //this holds the onscreen position of the div
    const local: HTMLElement = document.getElementById('local_view');
    const transform: Array<number> = this.getMatrix(local);

  const pointerOffsetInGlobal = {
    x:  transform[0],
    y:  transform[1]
  }

  const adjusted: Point = {
    x: pointerOffsetInGlobal.x / this.cell_factor * this.zs.zoom,
    y: pointerOffsetInGlobal.y / this.cell_factor * this.zs.zoom
  }

  this.onViewPortMove.emit(adjusted);
}




}
