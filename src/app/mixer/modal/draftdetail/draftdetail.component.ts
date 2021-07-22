import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Bounds, Interlacement } from '../../../core/model/datatypes';
import { Draft } from '../../../core/model/draft';
import { Subscription, fromEvent } from 'rxjs';
import { WeaveDirective } from '../../../weaver/directives/weave.directive';
import { Loom } from '../../../core/model/loom';
import { Render } from '../../../core/model/render';
import { Timeline } from '../../../core/model/timeline';
import { Pattern } from '../../../core/model/pattern';
import { ScrollDispatcher } from '@angular/cdk/scrolling';


interface DesignModes{
  value: string;
  viewValue: string;
  icon: string;
}

@Component({
  selector: 'app-draftdetail',
  templateUrl: './draftdetail.component.html',
  styleUrls: ['./draftdetail.component.scss']
})
export class DraftdetailComponent implements OnInit {

    /**
   * The reference to the weave directive.
   * @property {WeaveDirective}
   */
     @ViewChild(WeaveDirective, {static: false}) weaveRef;
     @ViewChild('bitmapImage', {static: false}) bitmap;
   
     design_modes: DesignModes[]=[
      {value: 'toggle', viewValue: 'Toggle Heddle', icon: "fas fa-adjust"},
      {value: 'up', viewValue: 'Set Heddle Up', icon: "fas fa-square"},
      {value: 'down', viewValue: 'Set Heddle Down', icon: "far fa-square"}
    ];

  /**
   * a reference to the draft that we're modifying
   */
  draft:Draft;

    /**
   * The name of the current selected brush.
   * @property {string}
   */
     design_mode = {
      name:'toggle',
      id: -1
    }

  scale:number = 10;
    /**
   * a string to represent the current user defined scale for this component to be used in background grid css. 
   * @property {striing}
   */

  scale_string: string;


  /**
   * The weave Loom object.
   * @property {Loom}
   */
   loom: Loom;

  /**
   * the dimensions of the draft object
   */
  bounds: Bounds = {
    topleft: {x: 0, y: 0},
    width: 0, 
    height: 0
  }

  /**
   * The weave Render object.
   * @property {Render}
   */
   render: Render;

    /**
   * The weave Timeline object.
   * @property {Timeline}
   */
  timeline: Timeline = new Timeline();

   /**
   * A collection of patterns to use in this space
   * @property {Timeline}
   */
    patterns: Array<Pattern>;

  /**
  The current selection, as boolean array 
  **/
  copy: Array<Array<boolean>>;

  scrollingSubscription: any;



  constructor(private dialogRef: MatDialogRef<DraftdetailComponent>,
             @Inject(MAT_DIALOG_DATA) private data: any, 
             private scroll: ScrollDispatcher) { 

              this.scrollingSubscription = this.scroll
              .scrolled()
              .subscribe((data: any) => {
                this.onWindowScroll(data);
               });
    
               this.copy = [[false,true],[false,true]];

              this.draft = data.draft;
              this.loom = new Loom(this.draft, 8, 10);
              this.render = new Render(true, this.draft);
              this.draft.computeYarnPaths();

              this.timeline.addHistoryState(this.draft);  
              this.patterns = [];


              this.scale_string = "10px 10px";
              this.draft = data.draft;

              this.bounds.width = this.draft.warps * this.scale;
              this.bounds.height = this.draft.wefts * this.scale;

  }

  private onWindowScroll(data: any) {
    this.weaveRef.rescale();
  }


  ngOnInit() {

  }

}