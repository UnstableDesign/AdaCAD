import { Component, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Draft, Loom, LoomSettings } from '../../../core/model/datatypes';
import { numFrames, numTreadles } from '../../../core/model/looms';
import {wefts, warps} from '../../../core/model/drafts'
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
import { InkService } from '../../provider/ink.service';
import { OperationService } from '../../provider/operation.service';
import { DesignmodesService } from '../../../core/provider/designmodes.service';
import { WeaverComponent } from '../../../weaver/weaver.component';
import { MaterialsService } from '../../../core/provider/materials.service';
import { WorkspaceService } from '../../../core/provider/workspace.service';
import { from } from 'rxjs';
import { TreeService } from '../../provider/tree.service';


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


  id: number;


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

   loom_settings: LoomSettings;


  scrollingSubscription: any;

  viewonly: boolean = false;


  constructor(private dialogRef: MatDialogRef<DraftdetailComponent>,
             @Inject(MAT_DIALOG_DATA) private data: any, 
             private scroll: ScrollDispatcher,
             public inks: InkService,
             private dm: DesignmodesService,
             private ops: OperationService,
             private ms: MaterialsService,
             public ws: WorkspaceService,
             private tree: TreeService) { 

              this.scrollingSubscription = this.scroll
              .scrolled()
              .subscribe((data: any) => {
                 this.onWindowScroll(data);
               });

               this.id = data.id;
               this.draft = this.tree.getDraft(this.id);
               this.loom = this.tree.getLoom(this.id);
               this.loom_settings = this.tree.getLoomSettings(this.id);
               this.ink = data.ink;
               this.viewonly = this.tree.hasParent(this.id);


        
                            

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

  //HELPER FUNCTIONS TO AID VARIABLES CALLED FROM HTML
 warps(){
    return warps(this.draft.drawdown);
  }

 wefts(){
    return wefts(this.draft.drawdown);
  }

 width(){
    if(this.loom_settings.units == 'cm') return warps(this.draft.drawdown) / this.loom_settings.epi * 10;
    else return warps(this.draft.drawdown) / this.loom_settings.epi;
  }

  numFrames(){
    return numFrames(this.loom);
  }
  
  numTreadles(){
    return numTreadles(this.loom);
  }
  
}