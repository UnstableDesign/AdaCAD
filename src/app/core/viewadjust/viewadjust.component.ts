import { Component } from '@angular/core';
import {CdkDrag, CdkDragMove} from '@angular/cdk/drag-drop';
import { ViewadjustService } from '../provider/viewadjust.service';
import { MatButton, MatMiniFabButton } from '@angular/material/button';

@Component({
  selector: 'app-viewadjust',
  standalone: true,
  imports: [CdkDrag, MatButton],
  templateUrl: './viewadjust.component.html',
  styleUrl: './viewadjust.component.scss'
})
export class ViewadjustComponent {

  pos: {x: number, y:number} = {x:200, y:0};

  constructor(private vas: ViewadjustService){

    this.pos.x = this.vas.left;

  }

  ngAfterViewInit(){

    let width = window.innerWidth;
    this.vas.updatePosition(4*width/5);
    this.pos.x = this.vas.left;


  }

  /**
   * called when we need to automatically move the view in response to a window resize event
   */
  updatePosition(){
    this.pos = {x: Math.floor(this.vas.left), y: 0}
  }




  dragMove(e: CdkDragMove){
    this.vas.updatePosition(e.pointerPosition.x);


  }

}
