import { Component, OnInit, Input } from '@angular/core';
import { i } from 'mathjs';
import { Bounds, Point } from '../../../core/model/datatypes';
import { TreeService } from '../../provider/tree.service';
import { OperationComponent } from '../operation/operation.component';
import { SubdraftComponent } from '../subdraft/subdraft.component';

@Component({
  selector: 'app-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss']
})
export class ConnectionComponent implements OnInit {


  @Input() id: number;
  @Input() scale: number;
  @Input() default_cell_size: number;


  from: number; 
  to: number; 
  to_ndx: number; 
  
  b_from: Point;
  b_to: Point;


  disable_drag:boolean = true;
  orientation_x: boolean = true;
  orientation_y: boolean = true;

  bounds: Bounds = {
    topleft: {x: 0, y:0},
    width: 0,
    height:0
  };

  svg: HTMLElement;

  no_draw: boolean;

  constructor(public tree: TreeService) { 

  }

  ngOnInit() {
    const treenode = this.tree.getTreeNode(this.id);
    const from_io = treenode.inputs[0];
    const to_io = treenode.outputs[0];

    this.from = from_io.tn.node.id;
    this.to = to_io.tn.node.id;

    this.no_draw = this.tree.getType(this.from) === 'op' && this.tree.hasSingleChild(this.from);

  }

  ngAfterViewInit(){

    this.svg = document.getElementById('svg-'+this.id.toString());
    const to_comp = this.tree.getComponent(this.to);
    
     if(to_comp !== null){
      this.b_to = {
        x:  to_comp.bounds.topleft.x + 15*this.scale/this.default_cell_size,
        y: to_comp.bounds.topleft.y
      };      this.updateFromPosition(this.tree.getComponent(this.from));
      this.updateToPosition(<SubdraftComponent | OperationComponent> to_comp);
     }
  }



  disableDrag(){
    this.disable_drag = true;
  }

  enableDrag(){
    //there is never a case where this should be enabled so set to true
    this.disable_drag = true;
  }

  /**
   * if every connection goes from one node to another, the to node is always the topleft corner
   * unless the to node is a dynamic operation, in which case we must move to an inlet. 
   * @param to the id of the component this connection goes to
   */
  updateToPosition(to: OperationComponent | SubdraftComponent){

    if(to.id != this.to) console.error("attempting to move wrong TO connection", to.id, this.to);
   
    this.b_to = {
      x:  to.bounds.topleft.x + 3*this.scale/this.default_cell_size +  15* this.scale/this.default_cell_size,
      y: to.bounds.topleft.y
    };

    if(this.tree.getType(to.id) === 'op'){
      // get the inlet value 
      const ndx = this.tree.getInletOfCxn(to.id, this.id);
      if(ndx !== -1){
        const element = document.getElementById('inlet'+to.id+"-"+ndx);
        if(element !== undefined && element !== null){
          const left_offset = element.offsetLeft;
          this.b_to = {x: to.bounds.topleft.x + left_offset*this.scale/this.default_cell_size + 15* this.scale/this.default_cell_size, y: to.bounds.topleft.y}
        }
      }
    }

    this.calculateBounds();
    this.drawConnection();
  }


  /**
   * if every connection goes from one node to another, the from node depends on the kind of object
   * @param from the id of the component this connection goes to
   */
  updateFromPosition(from: any){

    if(from.id != this.from) console.error("attempting to move wrong FROM connection", from.id, this.from);

    if((<SubdraftComponent>from).draft_visible){
      const top_offset = document.getElementById(from.id+"-out").offsetTop;

      this.b_from = 
      {x: from.bounds.topleft.x+ 3*this.scale, 
       y: from.bounds.topleft.y + (top_offset+30)*this.scale/this.default_cell_size};
    }else{
      this.b_from = 
      {x: from.bounds.topleft.x + 3*this.scale, 
       y: from.bounds.topleft.y + 30};
    }

    this.calculateBounds();
    this.drawConnection();
    
  }


  calculateBounds(){
    
    let p1: Point = this.b_from;
    let p2: Point = this.b_to;
    let bottomright: Point = {x:0, y:0};

    if(p1 === undefined || p2 === undefined) return;


    this.orientation_x = true;
    this.orientation_y = true;
    
    if(p2.x < p1.x) this.orientation_x = !this.orientation_x;
    if(p2.y < p1.y) this.orientation_y = !this.orientation_y;

    bottomright.x = Math.max(p1.x, p2.x);
    bottomright.y = Math.max(p1.y, p2.y);

    this.bounds.topleft = {x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y)};
    this.bounds.width = bottomright.x - this.bounds.topleft.x + 2; //add two so a line is drawn when horiz or vert
    this.bounds.height = bottomright.y - this.bounds.topleft.y + 2;
  }



  
  drawConnection(){
    
    if(this.no_draw) return;

    if(this.orientation_x && this.orientation_y){
      this.svg.innerHTML = ' <path d="M 0 0 C 0 50, '+this.bounds.width+' '+(this.bounds.height-50)+', '+this.bounds.width+' '+this.bounds.height+'" fill="transparent" stroke="#ff4081"  stroke-dasharray="4 2"  stroke-width="2"/> ' ;
    }else if(!this.orientation_x && !this.orientation_y){
      this.svg.innerHTML = ' <path d="M 0 0 c 0 -50, '+this.bounds.width+' '+(this.bounds.height+50)+', '+this.bounds.width+' '+this.bounds.height+'" fill="transparent" stroke="#ff4081"  stroke-dasharray="4 2"  stroke-width="2"/> ' ;
    }else if(!this.orientation_x && this.orientation_y){
      this.svg.innerHTML = ' <path d="M '+this.bounds.width+' 0 C '+(this.bounds.width)+' 50, 0 '+(this.bounds.height-50)+', 0 '+this.bounds.height+'" fill="transparent" stroke="#ff4081"  stroke-dasharray="4 2"  stroke-width="2"/> ' ;
    }else{
      this.svg.innerHTML = ' <path d="M 0 '+this.bounds.height+' C 0 '+(this.bounds.height+50)+', '+this.bounds.width+' -50, '+this.bounds.width+' 0" fill="transparent" stroke="#ff4081"  stroke-dasharray="4 2"  stroke-width="2"/> ' ;

    }
  

  }

  drawForPrint(canvas, cx, scale: number) {

    // cx.beginPath();
    // cx.strokeStyle = "#ff4081";
    // cx.setLineDash([scale, 2]);
    // cx.lineWidth = 2;
    // // this.cx.strokeRect(0,0, this.bounds.width, this.bounds.height);
    // if(this.orientation){
    //   cx.moveTo(this.bounds.topleft.x, this.bounds.topleft.y);
    //   cx.lineTo(this.bounds.width + this.bounds.topleft.x, this.bounds.topleft.y + this.bounds.height);
    // }else{
    //   cx.moveTo(this.bounds.topleft.x, this.bounds.height+ this.bounds.topleft.y);
    //   cx.lineTo(this.bounds.width + this.bounds.topleft.x, this.bounds.topleft.y);
    // }
    // cx.stroke();
  }

  /**
   * rescales this compoment. 
   * Call after the operation and subdraft connections have been updated. 
   * @param scale 
   */
  rescale(scale:number){

    const from_comp: any = this.tree.getComponent(this.from);
    const to_comp: any = this.tree.getComponent(this.to);

    this.updateFromPosition(from_comp);
    this.updateToPosition(to_comp);
   
    // this.b_from = {x: from_comp.bounds.topleft.x, y: from_comp.bounds.topleft.y + from_comp.bounds.height};
    // this.b_to = {x: to_comp.bounds.topleft.x, y: to_comp.bounds.topleft.y};
     
    this.scale = scale;
    this.calculateBounds();
    this.drawConnection();

    // const container: HTMLElement = document.getElementById('cxn-'+this.id);
    // container.style.transformOrigin = 'top left';
    // container.style.transform = 'scale(' + this.scale/5 + ')';

  }


}
