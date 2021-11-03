import { Component, OnInit, Input } from '@angular/core';
import { Bounds, Point } from '../../../core/model/datatypes';
import { TreeService } from '../../provider/tree.service';
import { SubdraftComponent } from '../subdraft/subdraft.component';

@Component({
  selector: 'app-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss']
})
export class ConnectionComponent implements OnInit {


  @Input() id: number;
  @Input() scale: number;


  from: number; 
  to: number; 
  b_from: Point;
  b_to: Point;
  disable_drag:boolean = true;
  orientation: boolean = true;
  

  bounds: Bounds = {
    topleft: {x: 0, y:0},
    width: 0,
    height:0
  };

  canvas: HTMLCanvasElement;
  cx: any;


  constructor(private tree: TreeService) { 


  }

  ngOnInit() {
  }

  ngAfterViewInit(){


    this.canvas = <HTMLCanvasElement> document.getElementById("cxn-"+this.id.toString());
    this.cx = this.canvas.getContext("2d");

    this.b_to = this.tree.getComponent(this.to).bounds.topleft;
    this.updateFromPosition(this.tree.getComponent(this.from));
    // this.b_from = 
    //   {x: from.bounds.topleft.x, 
    //    y: from.bounds.topleft.y + from.bounds.height};
   
    // this.b_to = this.tree.getComponent(this.to).bounds.topleft;

  }

  disableDrag(){
    this.disable_drag = true;
  }

  enableDrag(){
    //there is never a case where this should be enabled so set to true
    this.disable_drag = true;
  }

  //the to position is always the top left corner of the element it is going into
  updateToPosition(to: any){
   
    if(to.id != this.to) console.error("attempting to move wrong TO connection", to.id, this.to);
    this.b_to = to.bounds.topleft;
    this.calculateBounds();
    this.drawConnection();
  }

  updateFromPosition(from: any){

    if(from.id != this.from) console.error("attempting to move wrong FROM connection", from.id, this.from);

    if((<SubdraftComponent>from).draft_visible){
      this.b_from = 
      {x: from.bounds.topleft.x, 
       y: from.bounds.topleft.y + from.bounds.height};
    }else{
      this.b_from = 
      {x: from.bounds.topleft.x, 
       y: from.bounds.topleft.y};
    }

    this.calculateBounds();
    this.drawConnection();
    
  }


  calculateBounds(){
    
    let p1: Point = this.b_from;
    let p2: Point = this.b_to;
    let bottomright: Point = {x:0, y:0};

    this.orientation = true;
    
    if(p2.x < p1.x) this.orientation = !this.orientation;
    if(p2.y < p1.y) this.orientation = !this.orientation;

    bottomright.x = Math.max(p1.x, p2.x);
    bottomright.y = Math.max(p1.y, p2.y);

    this.bounds.topleft = {x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y)};
    this.bounds.width = bottomright.x - this.bounds.topleft.x + 2; //add two so a line is drawn when horiz or vert
    this.bounds.height = bottomright.y - this.bounds.topleft.y + 2;
  }

  drawConnection(){

    //make the canvas big enough to encase the point, starting from the topleft of the view
    this.canvas.width = this.bounds.width;
    this.canvas.height = this.bounds.height;


    this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cx.beginPath();
    this.cx.strokeStyle = "#ff4081";
    this.cx.setLineDash([this.scale, 2]);
    this.cx.lineWidth = 2;
    // this.cx.strokeRect(0,0, this.bounds.width, this.bounds.height);
    if(this.orientation){
      this.cx.moveTo(0, 0);
      this.cx.lineTo(this.bounds.width, this.bounds.height);
    }else{
      this.cx.moveTo(0, this.bounds.height);
      this.cx.lineTo(this.bounds.width, 0);
    }
    this.cx.stroke();

  

  }

  drawForPrint(canvas, cx, scale: number) {

    cx.beginPath();
    cx.strokeStyle = "#ff4081";
    cx.setLineDash([scale, 2]);
    cx.lineWidth = 2;
    // this.cx.strokeRect(0,0, this.bounds.width, this.bounds.height);
    if(this.orientation){
      cx.moveTo(this.bounds.topleft.x, this.bounds.topleft.y);
      cx.lineTo(this.bounds.width + this.bounds.topleft.x, this.bounds.topleft.y + this.bounds.height);
    }else{
      cx.moveTo(this.bounds.topleft.x, this.bounds.height+ this.bounds.topleft.y);
      cx.lineTo(this.bounds.width + this.bounds.topleft.x, this.bounds.topleft.y);
    }
    cx.stroke();
  }

  /**
   * rescales this compoment. 
   * Call after the operation and subdraft connections have been updated. 
   * @param scale 
   */
  rescale(scale:number){

    const from_comp: any = this.tree.getComponent(this.from);
    const to_comp: any = this.tree.getComponent(this.to);
   
    this.b_from = {x: from_comp.bounds.topleft.x, y: from_comp.bounds.topleft.y + from_comp.bounds.height};
    this.b_to = {x: to_comp.bounds.topleft.x, y: to_comp.bounds.topleft.y};
     
    this.scale = scale;
    this.calculateBounds();
    this.drawConnection();

    // const container: HTMLElement = document.getElementById('cxn-'+this.id);
    // container.style.transformOrigin = 'top left';
    // container.style.transform = 'scale(' + this.scale/5 + ')';

  }


}
