import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Bounds, DraftNode, OpNode, Point } from '../../../core/model/datatypes';
import { TreeService } from '../../../core/provider/tree.service';
import { ZoomService } from '../../provider/zoom.service';
import { OperationComponent } from '../operation/operation.component';
import { SubdraftComponent } from '../subdraft/subdraft.component';
import { OperationService } from '../../../core/provider/operation.service';
import { defaults } from '../../../core/model/defaults';

@Component({
  selector: 'app-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss']
})
export class ConnectionComponent implements OnInit {


  @Input() id: number;
  @Input() scale: number;
  @Input() default_cell_size: number;
  @Output() onConnectionRemoved = new EventEmitter <any>();



  b_from: Point;
  b_to: Point;


  disable_drag:boolean = true;
  orientation_x: boolean = true;
  orientation_y: boolean = true;

  topleft: Point = {x: 0, y:0};
  width: number =  0;
  height: number = 0;

  svg: HTMLElement;
  connector: HTMLElement;

  no_draw: boolean;

  path_text: string = '';

  show_path_text: boolean = false;
  show_disconnect: boolean = true;

  constructor(
    public tree: TreeService,
    private ops: OperationService, 
    public zs: ZoomService) { 

  }

  ngOnInit() {
    const treenode = this.tree.getTreeNode(this.id);
    const from_io = treenode.inputs[0];
    const to_io = treenode.outputs[0];

    const from = from_io.tn.node.id;
    const to = to_io.tn.node.id;

    this.no_draw = this.tree.getType(from) === 'op' && this.tree.hasSingleChild(from);
    this.show_disconnect = !(this.tree.getType(from) === 'op' && !(this.tree.hasSingleChild(from)));
    // this.path_text = this.id+'';
    // this.show_path_text = true;

    this.updatePathText()


  }

  ngAfterViewInit(){

    this.svg = document.getElementById('svg-'+this.id.toString());
    this.connector = document.getElementById('connector-'+this.id.toString());

    const to = this.tree.getConnectionOutput(this.id);
    const from = this.tree.getConnectionInput(this.id);


     this.updateFromPosition(from, this.zs.zoom);
     this.updateToPosition(to, this.zs.zoom);

     this.drawConnection(this.zs.zoom)


  }

  disconnect(){
    this.onConnectionRemoved.emit({id: this.id});
  }


  updatePathText(){
    const treenode = this.tree.getTreeNode(this.id);
  //  const from_io = treenode.inputs[0];
    const to_io = treenode.outputs[0];
  //  const from = from_io.tn.node.id;
    const to = to_io.tn.node.id;
    if( this.tree.getNode(to).type =="op" ){
  //    const from_node = <DraftNode> this.tree.getNode(from);
      const op_node = <OpNode> this.tree.getNode(to);
      const op_info =  this.ops.getOp(op_node.name);
      const inlet = this.tree.getInletOfCxn(op_node.id, this.id);
      if(op_info.inlets[inlet] !== undefined && op_info.inlets[inlet].uses !== 'draft'){
        this.path_text = "inlet uses only "+op_info.inlets[inlet].uses;
      } 
      else this.path_text =  "";

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
  updateToPosition(to: number, scale: number){
   
    console.log("UPDATE TO ")

    const to_comp = <SubdraftComponent | OperationComponent> this.tree.getComponent(to);

    this.b_to = {
      x:  to_comp.topleft.x + 3*this.scale/this.default_cell_size +  15* this.scale/this.default_cell_size,
      y: to_comp.topleft.y
    };


    if(this.tree.getType(to_comp.id) === 'op'){
      // get the inlet value 
      const ndx = this.tree.getInletOfCxn(to_comp.id, this.id);
      if(ndx !== -1){

        
        
        const ndx_in_list = this.tree.getInputsAtNdx(to_comp.id, ndx).findIndex(el => el.tn.node.id === this.id);


        const element: HTMLElement = document.getElementById('inlet'+to_comp.id+"-"+ndx+"-"+ndx_in_list);

        //to get a current position, you need the inlets parent to have a defined position. 
        if( element !== undefined && element !== null && element.offsetParent !== null){
          const left_offset = element.offsetLeft;
            this.b_to = {x: to_comp.topleft.x + left_offset*this.scale/this.default_cell_size + 15* this.scale/this.default_cell_size, y: to_comp.topleft.y}
        }else{
            const left_offset = (ndx + ndx_in_list)*defaults.inlet_button_width;
            this.b_to = {x: to_comp.topleft.x + left_offset*this.scale/this.default_cell_size + 15* this.scale/this.default_cell_size, y: to_comp.topleft.y}

        }
        
      }
    }

    this.calculateBounds();
    this.drawConnection(scale);
  }


  /**
   * connections can come from a subdraft or an operation component 
   * @param from the id of the component this connection goes to
   */
  updateFromPosition(from: number, scale: number){

    console.log("update from")

    const from_el = document.getElementById(from+"-out").getBoundingClientRect();
    const container = document.getElementById("scrollable-container").getBoundingClientRect();

    this.b_from = 
    {x: from_el.x - container.x, 
     y: from_el.y- container.y};

    this.calculateBounds();
    this.drawConnection(scale);
    
   }


  // fromDraftUpdate(draft_comp: SubdraftComponent){


  //   if(draft_comp.draft_visible){
  //     const scale = document.getElementById("scale-"+draft_comp.id);
  //     if(scale === null){
  //       // console.log("draft not found on update")
  //       // this.b_from = 
  //       // {x: draft_comp.topleft.x+5, 
  //       //  y: draft_comp.topleft.y + draft_comp.bounds.height*(this.zs.zoom/this.default_cell_size)};
  //     }else{
  //       this.b_from = 
  //       {x: draft_comp.topleft.x+5, 
  //        y: (draft_comp.topleft.y) + scale.offsetHeight*(this.zs.zoom/this.default_cell_size)};
  //     }
      
     
  //   }else{
  //     this.b_from = 
  //     {x: draft_comp.topleft.x + 3*this.zs.zoom, 
  //      y: draft_comp.topleft.y + 30};
  //   }
  // }


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

    this.topleft = {x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y)};
    this.width = bottomright.x - this.topleft.x + 2; //add two so a line is drawn when horiz or vert
    this.height = bottomright.y - this.topleft.y + 2;
  }



  
  drawConnection(scale: number){


    const stublength = 15;
    const connector_opening = 10;
    const connector_font_size = Math.max((10 - scale) / 10, .75);
    const text_path_font_size =   Math.max((10 - scale) / 10, .75);
    const button_margin_left = -20;
    const button_margin_top = -16;
    
    if(this.no_draw) return;
    if(this.svg === null || this.svg == undefined) return;

    const stroke_width = 4 * this.zs.zoom / this.zs.getZoomMax();


    if(this.orientation_x && this.orientation_y){
      
      this.svg.innerHTML = ' <path id="path-'+this.id+'" d="M 0 0 C 0 50, '+this.width+' '+(this.height-70)+', '+this.width+' '+(this.height-(stublength+connector_opening))+'" fill="transparent" stroke="#ff4081"  stroke-dasharray="4 2"  stroke-width="'+stroke_width+'"/>' ;

      if(this.show_path_text){
        this.svg.innerHTML += '<text><textPath startOffset="10%" fill="#ff4081" href="#path-'+this.id+'">'+this.path_text+'</textPath></text> ';

      }
     

      this.svg.innerHTML += '  <line x1="'+this.width+'" y1="'+(this.height-(stublength))+'" x2='+this.width+' y2="'+this.height+'"  stroke="#ff4081"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'" />';

      this.connector.style.top = (this.height-(stublength+connector_opening)+button_margin_top)+'px';
      this.connector.style.left = (this.width+button_margin_left)+'px';
      this.connector.style.fontSize = connector_font_size+"em";
      this.svg.style.fontSize = text_path_font_size+"em";
      
  

    }else if(!this.orientation_x && !this.orientation_y){
      this.svg.innerHTML = ' <path id="path-'+this.id+'" d="M 0 '+-(stublength+connector_opening)+' c 0 -50, '+this.width+' '+(this.height+100)+', '+this.width+' '+(this.height+(stublength+connector_opening))+'" fill="transparent" stroke="#ff4081"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'"/> ' ;

      if(this.show_path_text){
        this.svg.innerHTML += ' <text><textPath startOffset="60%" fill="#ff4081" href="#path-'+this.id+'">'+this.path_text+'</textPath></text>';
      }

      this.svg.innerHTML += '  <line x1="0" y1="'+-(stublength )+'" x2="0" y2="0"  stroke="#ff4081"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'" />';

      this.connector.style.top = -(stublength+connector_opening)+(button_margin_top)+'px';
      this.connector.style.left = (button_margin_left)+'px';
      this.connector.style.fontSize = connector_font_size+"em";
      this.svg.style.fontSize = text_path_font_size+"em";
  


    }else if(!this.orientation_x && this.orientation_y){

      // this.svg.innerHTML = ' <path id="path-'+this.id+'" d="M '+this.bounds.width+' 0 C '+(this.bounds.width)+' 50, 0 '+(this.bounds.height-70)+', 0 '+(this.bounds.height-(stublength+connector_opening))+'" fill="transparent" stroke="#ff4081"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'"/> <text><textPath startOffset="50%" fill="#000000" href="#path-'+this.id+'">'+this.path_text+'</textPath></text> ' ;


      this.svg.innerHTML = ' <path id="path-'+this.id+'" d=" M  0 '+(this.height-(stublength+connector_opening))+' C 0 '+(this.height-(stublength+connector_opening)-50)+', '+this.width+' 50, '+this.width+' 0" fill="transparent" stroke="#ff4081"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'"/> ' ;

      if(this.show_path_text){
        this.svg.innerHTML += '<text><textPath startOffset="60%" fill="#ff4081" href="#path-'+this.id+'">'+this.path_text+'</textPath></text>';
      }

      this.svg.innerHTML += '  <line x1="0" y1="'+(this.height-(stublength))+'" x2="0" y2="'+this.height+'"  stroke="#ff4081"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'" />';


      this.connector.style.top = (this.height-(stublength+connector_opening)+button_margin_top)+'px';
      this.connector.style.left =  (button_margin_left)+'px';
      this.connector.style.fontSize = connector_font_size+"em";
      this.svg.style.fontSize = text_path_font_size+"em";
  
  


    }else{

      this.svg.innerHTML = ' <path id="path-'+this.id+'" d="M 0 '+this.height+' C 0 '+(this.height+50)+', '+this.width+' -50, '+this.width+''+-(stublength+connector_opening)+'" fill="transparent" stroke="#ff4081"  stroke-dasharray="4 2"  stroke-width="'+stroke_width+'"/>' ;

      if(this.show_path_text){
        this.svg.innerHTML = '<text><textPath startOffset="10%" fill="#000000" href="#path-'+this.id+'">'+this.path_text+'</textPath></text> ';
      }

      this.svg.innerHTML += '  <line x1="'+this.width+'" y1="'+(-(stublength))+'" x2="'+this.width+'" y2="0"  stroke="#ff4081"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'" />';


      this.connector.style.top = -(stublength+connector_opening)+(button_margin_top)+'px';
      this.connector.style.left = (this.width+button_margin_left)+'px';
      this.connector.style.fontSize = connector_font_size+"em";
      this.svg.style.fontSize = text_path_font_size+"em";
  

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

    const to = this.tree.getConnectionOutput(this.id);
    const from = this.tree.getConnectionInput(this.id);

    this.updateFromPosition(from, scale);
    this.updateToPosition(to,scale);
   
    // this.b_from = {x: from_comp.bounds.topleft.x, y: from_comp.bounds.topleft.y + from_comp.bounds.height};
    // this.b_to = {x: to_comp.bounds.topleft.x, y: to_comp.bounds.topleft.y};
     
    this.scale = scale;
    this.calculateBounds();
    this.drawConnection(scale);

    // const container: HTMLElement = document.getElementById('cxn-'+this.id);
    // container.style.transformOrigin = 'top left';
    // container.style.transform = 'scale(' + this.scale/5 + ')';

  }


}
