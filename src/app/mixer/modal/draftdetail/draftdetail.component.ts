import { Component, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Draft } from '../../../core/model/draft';
import { Loom } from '../../../core/model/loom';
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
import { InkService } from '../../provider/ink.service';
import { OperationService } from '../../provider/operation.service';
import { DesignmodesService } from '../../../core/provider/designmodes.service';
import { WeaverComponent } from '../../../weaver/weaver.component';
import { MaterialsService } from '../../../core/provider/materials.service';
import { GloballoomService } from '../../../core/provider/globalloom.service';


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
  @ViewChild('weaver', {read: WeaverComponent, static: true}) weaver: WeaverComponent;


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

  viewonly: boolean = false;


  constructor(private dialogRef: MatDialogRef<DraftdetailComponent>,
             @Inject(MAT_DIALOG_DATA) private data: any, 
             private scroll: ScrollDispatcher,
             public inks: InkService,
             private dm: DesignmodesService,
             private ops: OperationService,
             private ms: MaterialsService,
             public gl: GloballoomService) { 

              this.scrollingSubscription = this.scroll
              .scrolled()
              .subscribe((data: any) => {
                 this.onWindowScroll(data);
               });

               this.draft = data.draft;
               this.ink = data.ink;
               this.loom = data.loom;
               this.viewonly = data.viewonly;
               console.log('this.ink:', this.ink);



          
               
    

                            

              // this.modal_height = (this.draft.wefts+20) * this.render.getCellDims('base').h;

  }

  updateSelection(event: any){
  }

  private onWindowScroll(data: CdkScrollable) {
    const scrollTop = data.measureScrollOffset("top");
    const scrollLeft = data.measureScrollOffset("left");

    // this.dv.reposition(scrollTop, scrollLeft);
  }

  /**
   * this handles the case where someone clicks outside of the modal window 
   * @param $event 
   */
  // @HostListener('document:click', ['$event']) click($event){
  //   // here you can hide your menu
  //   const target: HTMLElement = $event.target;
  //   const name: string = target.className;
  //   if(name.includes("cdk-overlay-backdrop")){
  //       this.onSave();
  //   }
  //   console.log("anywhere click", target.className);
  // }



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

  // designActionChange(e){

  // const drafts: Array<Draft> = this.ops.getOp(e).perform([this.draft], []);
  //       drafts.forEach(draft => {
  //         this.draft.reload(draft);
  //         this.dv.redraw({drawdown:true});  
  //       }); 
  //   this.dv.redraw({
  //     drawdown: true
  //   });   
  // }

  public redraw(){
    this.weaver.materialChange();
  }

  public onCancel(){
    this.scrollingSubscription.unsubscribe();
    this.weaver.closeAllModals();
    this.dialogRef.close(null);
  }

  public onSave(){
    this.scrollingSubscription.unsubscribe();
    this.weaver.closeAllModals();
    this.dialogRef.close(this.draft);
  }
  
}