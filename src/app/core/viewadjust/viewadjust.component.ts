import { Component } from '@angular/core';
import {CdkDrag, CdkDragMove} from '@angular/cdk/drag-drop';
import { ViewadjustService } from '../provider/viewadjust.service';

@Component({
  selector: 'app-viewadjust',
  standalone: true,
  imports: [CdkDrag],
  templateUrl: './viewadjust.component.html',
  styleUrl: './viewadjust.component.scss'
})
export class ViewadjustComponent {


  constructor(private vas: ViewadjustService){

  }




  dragMove(e: CdkDragMove){
    this.vas.updatePosition(e.pointerPosition.x);
  }

}
