import { Component, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Bounds, Interlacement } from '../../../core/model/datatypes';
import { Draft } from '../../../core/model/draft';
import { Subscription, fromEvent } from 'rxjs';
import { Loom } from '../../../core/model/loom';
import { Render } from '../../../core/model/render';
import { Timeline } from '../../../core/model/timeline';
import { Pattern } from '../../../core/model/pattern';
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
import { DraftviewerComponent } from '../../../core/draftviewer/draftviewer.component';
import { InkService } from '../../provider/ink.service';
import { OperationService } from '../../provider/operation.service';
import { DesignmodesService } from '../../../core/provider/designmodes.service';


/**
 * this component initatites the draft viewer with custom options. 
 * a copy of the draft is passed to the window and passed back to the parent on close (or null if changes not saved) 
 */
@Component({
  selector: 'app-draftdetail',
  templateUrl: './draftdetail.component.html',
  styleUrls: ['./draftdetail.component.scss']
})
export class DraftdetailComponent implements OnInit {

 
  //the draft view shared by this and weaver
  @ViewChild('dv', {read: DraftviewerComponent, static: true}) dv: DraftviewerComponent;


  ink: String; //the name of the selected ink.

  /**
   * a reference to the draft that we're modifying
   */
  draft:Draft;


  /**
   * The weave Loom object.
   * @property {Loom}
   */
   loom: Loom;


  scrollingSubscription: any;



  constructor(private dialogRef: MatDialogRef<DraftdetailComponent>,
             @Inject(MAT_DIALOG_DATA) private data: any, 
             private scroll: ScrollDispatcher,
             private inks: InkService,
             private dm: DesignmodesService,
             private ops: OperationService) { 

              this.scrollingSubscription = this.scroll
              .scrolled()
              .subscribe((data: any) => {
                 this.onWindowScroll(data);
               });

               this.draft = data.draft;
               this.ink = data.ink;

               this.draft.computeYarnPaths();



              //default loom
               this.loom = new Loom(this.draft, 8, 10);
               this.dm.selectDesignMode('jacquard', 'loom_types');
               this.loom.type = "jacquard";
               //this.loom.recomputeLoom(this.draft);

              
               
    

                            

              // this.modal_height = (this.draft.wefts+20) * this.render.getCellDims('base').h;

  }

  updateSelection(event: any){
    console.log("selection detected");
  }

  private onWindowScroll(data: CdkScrollable) {
    const scrollTop = data.measureScrollOffset("top");
    const scrollLeft = data.measureScrollOffset("left");
    console.log("on repositiion",scrollTop, scrollLeft);

    this.dv.reposition(scrollTop, scrollLeft);
  }

  /**
   * this handles the case where someone clicks outside of the modal window 
   * @param $event 
   */
  @HostListener('document:click', ['$event']) click($event){
    // here you can hide your menu
    const target: HTMLElement = $event.target;
    const name: string = target.className;
    if(name.includes("cdk-overlay-backdrop")){
        this.onSave();
    }
    console.log("anywhere click", target.className);
  }



  ngOnInit() {


  }

  


  ngAfterViewInit(){


   
  }


  
  onNoClick(){
    this.onSave();
  }

  public inkActionChange(name: string){
    this.ink = name;
  }

  designActionChange(e){

  const drafts: Array<Draft> = this.ops.getOp(e).perform([this.draft], []);
        drafts.forEach(draft => {
          this.draft.reload(draft);
          this.dv.redraw({drawdown:true});  
        }); 
    this.dv.redraw({
      drawdown: true
    });   
  }

  public onCancel(){
    this.scrollingSubscription.unsubscribe();
    this.dialogRef.close(null);
  }

  public onSave(){
    this.scrollingSubscription.unsubscribe();
    this.dialogRef.close(this.draft);
  }
  
}