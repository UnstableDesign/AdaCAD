import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Bounds, DraftNode, OpNode, Point } from '../../../core/model/datatypes';
import { TreeService } from '../../../core/provider/tree.service';
import { ZoomService } from '../../../core/provider/zoom.service';
import { OperationService } from '../../../core/provider/operation.service';

@Component({
  selector: 'app-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss']
})
export class ConnectionComponent implements OnInit {


  @Input() id: number;
  @Input() scale: number;
  @Output() onConnectionRemoved = new EventEmitter <any>();


  from: number;
  to: number;
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

    this.from = from_io.tn.node.id;
    this.to = to_io.tn.node.id;

    this.no_draw = this.tree.getType(this.from) === 'op' && this.tree.hasSingleChild(this.from);
    this.show_disconnect = !(this.tree.getType(this.from) === 'op' && !(this.tree.hasSingleChild(this.from)));

    this.updatePathText()


  }

  ngAfterViewInit(){

    this.svg = document.getElementById('svg-'+this.id.toString());
    this.connector = document.getElementById('connector-'+this.id.toString());


    let to_withdata = this.tree.getConnectionOutputWithIndex(this.id);
    this.to = to_withdata.id;
    this.from = this.tree.getConnectionInput(this.id);


     this.updateFromPosition();
     this.updateToPosition(to_withdata.inlet, to_withdata.arr);

     this.drawConnection()


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
  updateToPosition(inlet_id: number, arr_id: number){

    let parent = document.getElementById('scrollable-container');

    let parent_rect = parent.getBoundingClientRect();


    let to_container = document.getElementById("inlet"+this.to+"-"+inlet_id+"-"+arr_id);

    if(to_container == null || to_container == undefined) return;
    
    let to_rect = to_container.getBoundingClientRect();

    const zoom_factor =  1/this.zs.getMixerZoom();

    //on screen position relative to palette
    let screenX = to_rect.x - parent_rect.x + parent.scrollLeft;
    let scaledX = screenX * zoom_factor;

    //on screen position relative to palette
    let screenY = to_rect.y - parent_rect.y + parent.scrollTop;
    let scaledY = screenY * zoom_factor;

    

    this.b_to = {
      x: scaledX + to_rect.width/2,
      y: scaledY + to_rect.height/2
    }


    this.calculateBounds();
    this.drawConnection();
  }


  /**
   * connections can come from a subdraft or an operation component 
   * @param from the id of the component this connection goes to
   */
  updateFromPosition(){
    let parent = document.getElementById('scrollable-container');
    let parent_rect = parent.getBoundingClientRect();
    let sd_element = document.getElementById(this.from+'-out');


    if(sd_element === null ) return;

    let sd_container =sd_element.getBoundingClientRect();

    const zoom_factor =  1/this.zs.getMixerZoom();
   //on screen position relative to palette
   let screenX = sd_container.x - parent_rect.x + parent.scrollLeft;
   let scaledX = screenX * zoom_factor;

   //on screen position relative to palette
   let screenY = sd_container.y - parent_rect.y + parent.scrollTop;
   let scaledY = screenY * zoom_factor;

    
    
    //draw from the center of the icon
   this.b_from = {
    x: scaledX + sd_container.width/2,
    y: scaledY+ sd_container.height/2
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


    this.topleft = {x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y)};

    let cxn_container = document.getElementById('scale-'+this.id);
    cxn_container.style.transform = 'none'; //negate angulars default positioning mechanism
    cxn_container.style.top =  this.topleft.y+"px";
    cxn_container.style.left =  this.topleft.x+"px";

    this.width = bottomright.x - this.topleft.x + 2; //add two so a line is drawn when horiz or vert
    this.height = bottomright.y - this.topleft.y + 2;
  }



  
  drawConnection(){


    const stublength = 40;
    const connector_opening = 20;
    // const connector_font_size = Math.max((10 - scale) / 10, .75);
    const connector_font_size = 2;
    const text_path_font_size =   Math.max((10 - this.zs.getMixerZoom()) / 10, .75);
    const button_margin_left = -24;
    const button_margin_top = -16;
    const color = "#000000"
    
    if(this.no_draw) return;
    if(this.svg === null || this.svg == undefined) return;

    const stroke_width = 2;


    if(this.orientation_x && this.orientation_y){
      
      this.svg.innerHTML = ' <path id="path-'+this.id+'" d="M 0 0 C 0 50, '+this.width+' '+(this.height-70)+', '+this.width+' '+(this.height-(stublength+connector_opening))+'" fill="transparent" stroke="'+color+'"  stroke-dasharray="4 2"  stroke-width="'+stroke_width+'"/>' ;

      if(this.show_path_text){
        this.svg.innerHTML += '<text><textPath startOffset="10%" fill="'+color+'" href="#path-'+this.id+'">'+this.path_text+'</textPath></text> ';

      }
     

      this.svg.innerHTML += '  <line x1="'+this.width+'" y1="'+(this.height-(stublength))+'" x2='+this.width+' y2="'+this.height+'"  stroke="'+color+'"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'" />';

      this.connector.style.top = (this.height-(stublength+connector_opening)+button_margin_top)+'px';
      this.connector.style.left = (this.width+button_margin_left)+'px';
      this.connector.style.fontSize = connector_font_size+"em";
      this.svg.style.fontSize = text_path_font_size+"em";
      
  

    }else if(!this.orientation_x && !this.orientation_y){
      this.svg.innerHTML = ' <path id="path-'+this.id+'" d="M 0 '+-(stublength+connector_opening)+' c 0 -50, '+this.width+' '+(this.height+100)+', '+this.width+' '+(this.height+(stublength+connector_opening))+'" fill="transparent" stroke="'+color+'"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'"/> ' ;

      if(this.show_path_text){
        this.svg.innerHTML += ' <text><textPath startOffset="60%" fill="'+color+'" href="#path-'+this.id+'">'+this.path_text+'</textPath></text>';
      }

      this.svg.innerHTML += '  <line x1="0" y1="'+-(stublength )+'" x2="0" y2="0"  stroke="'+color+'"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'" />';

      this.connector.style.top = -(stublength+connector_opening)+(button_margin_top)+'px';
      this.connector.style.left = (button_margin_left)+'px';
      this.connector.style.fontSize = connector_font_size+"em";
      this.svg.style.fontSize = text_path_font_size+"em";
  


    }else if(!this.orientation_x && this.orientation_y){

      // this.svg.innerHTML = ' <path id="path-'+this.id+'" d="M '+this.bounds.width+' 0 C '+(this.bounds.width)+' 50, 0 '+(this.bounds.height-70)+', 0 '+(this.bounds.height-(stublength+connector_opening))+'" fill="transparent" stroke="#ff4081"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'"/> <text><textPath startOffset="50%" fill="#000000" href="#path-'+this.id+'">'+this.path_text+'</textPath></text> ' ;


      this.svg.innerHTML = ' <path id="path-'+this.id+'" d=" M  0 '+(this.height-(stublength+connector_opening))+' C 0 '+(this.height-(stublength+connector_opening)-50)+', '+this.width+' 50, '+this.width+' 0" fill="transparent" stroke="'+color+'"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'"/> ' ;

      if(this.show_path_text){
        this.svg.innerHTML += '<text><textPath startOffset="60%" fill="'+color+'" href="#path-'+this.id+'">'+this.path_text+'</textPath></text>';
      }

      this.svg.innerHTML += '  <line x1="0" y1="'+(this.height-(stublength))+'" x2="0" y2="'+this.height+'"  stroke="'+color+'"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'" />';


      this.connector.style.top = (this.height-(stublength+connector_opening)+button_margin_top)+'px';
      this.connector.style.left =  (button_margin_left)+'px';
      this.connector.style.fontSize = connector_font_size+"em";
      this.svg.style.fontSize = text_path_font_size+"em";
  
  


    }else{

      this.svg.innerHTML = ' <path id="path-'+this.id+'" d="M 0 '+this.height+' C 0 '+(this.height+50)+', '+this.width+' -50, '+this.width+''+-(stublength+connector_opening)+'" fill="transparent" stroke="'+color+'"  stroke-dasharray="4 2"  stroke-width="'+stroke_width+'"/>' ;

      if(this.show_path_text){
        this.svg.innerHTML = '<text><textPath startOffset="10%" fill="'+color+'" href="#path-'+this.id+'">'+this.path_text+'</textPath></text> ';
      }

      this.svg.innerHTML += '  <line x1="'+this.width+'" y1="'+(-(stublength))+'" x2="'+this.width+'" y2="0"  stroke="'+color+'"  stroke-dasharray="4 2"   stroke-width="'+stroke_width+'" />';


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
  rescale(){

  }


}
