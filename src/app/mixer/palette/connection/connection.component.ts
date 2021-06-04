import { Component, OnInit } from '@angular/core';
import { Bounds, Point } from '../../../core/model/datatypes';

@Component({
  selector: 'app-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss']
})
export class ConnectionComponent implements OnInit {

  id: number;
  from: Bounds;  
  to: Bounds; 
  scale: number;
  bounds: Bounds = {
    topleft: {x: 0, y:0},
    width: 0,
    height:0
  };

  canvas: HTMLCanvasElement;
  cx: any;


  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit(){


    this.canvas = <HTMLCanvasElement> document.getElementById("cxn-"+this.id.toString());
    this.cx = this.canvas.getContext("2d");
    this.calculateBounds();
    this.drawConnection();
  }

  disableDrag(){
  }

  enableDrag(){
  }

  setBounds(to:Bounds, from:Bounds){
    console.log("setting bounds", to, from);
    this.to = to;
    this.from = from;
    this.calculateBounds();
    this.drawConnection();
  }


  calculateBounds(){

    
    const botright:Point = {x: 0, y:0};
    botright.x = Math.max(this.to.topleft.x, this.from.topleft.x);
    botright.y = Math.max(this.to.topleft.y+this.to.height, this.from.topleft.y);

    this.bounds.topleft.x = Math.min(this.to.topleft.x, this.from.topleft.x);
    this.bounds.topleft.y = Math.min(this.to.topleft.y+this.to.height, this.from.topleft.y);
    this.bounds.width = botright.x - this.bounds.topleft.x;
    this.bounds.height = botright.y - this.bounds.topleft.y;

  }

  drawConnection(){

    console.log("called draw connection");
    //make the canvas big enough to encase the point, starting from the topleft of the view
    this.canvas.width = this.bounds.width;
    this.canvas.height = this.bounds.height;


    this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cx.beginPath();
    this.cx.strokeStyle = "#ff4081";
    this.cx.setLineDash([this.scale, 2]);
    this.cx.lineWidth = 2;
    this.cx.moveTo(0, 0);
    this.cx.lineTo(this.bounds.width, this.bounds.height);
    this.cx.stroke();
  }

  rescale(scale:number){
    this.scale = scale;
    this.drawConnection();
  }


}
