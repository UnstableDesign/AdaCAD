import { Component, ElementRef, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { PatternService } from '../core/provider/pattern.service';
import { DesignmodesService } from '../mixer/provider/designmodes.service';
import { ScrollDispatcher } from '@angular/cdk/overlay';
import { Timeline } from '../core/model/timeline';
import { MaterialTypes, ViewModes } from '../core/model/datatypes';
import { Pattern } from '../core/model/pattern';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import {Subject} from 'rxjs';
import { PaletteComponent } from './palette/palette.component';
import { MixerDesignComponent } from './tool/mixerdesign/mixerdesign.component';
import { Draft } from '../core/model/draft';
import { TreeService } from './provider/tree.service';
import { FileService } from '../core/provider/file.service';


//disables some angular checking mechanisms
//enableProdMode();






@Component({
  selector: 'app-mixer',
  templateUrl: './mixer.component.html',
  styleUrls: ['./mixer.component.scss']
})
export class MixerComponent implements OnInit {

  @ViewChild(PaletteComponent, {static: false}) palette;
  @ViewChild(MixerDesignComponent, {static: false}) design_tool;


  filename = "adacad_mixer";
  notes: string = "";

 /**
   * The weave Timeline object.
   * @property {Timeline}
   */
   timeline: Timeline = new Timeline();




  material_types: MaterialTypes[] = [
    {value: 0, viewValue: 'Non-Conductive'},
    {value: 1, viewValue: 'Conductive'},
    {value: 2, viewValue: 'Resistive'}
  ];


  view_modes: ViewModes[] = [
      {value: 'visual', viewValue: 'Visual'},
      {value: 'pattern', viewValue: 'Draft'},
      {value: 'yarn', viewValue: 'Circuit'}
     // {value: 'mask', viewValue: 'Masks'}

    ];



  private unsubscribe$ = new Subject();

  default_patterns:any;
  collapsed:boolean = false;
  dims:any;

  scrollingSubscription: any;

  /// ANGULAR FUNCTIONS
  /**
   * @constructor
   * ps - pattern service (variable name is initials). Subscribes to the patterns and used
   * to get and update stitches.
   * dialog - Anglar Material dialog module. Used to control the popup modals.
   */
  constructor(private design_modes: DesignmodesService, 
    private ps: PatternService, 
    private tree: TreeService,
    public scroll: ScrollDispatcher,
    private fs: FileService) {


    this.scrollingSubscription = this.scroll
          .scrolled()
          .subscribe((data: any) => {
            this.onWindowScroll(data);
    });

   
    this.default_patterns = [];

    this.ps.getPatterns().subscribe((res) => {
       for(var i in res.body){
          this.default_patterns.push(new Pattern(res.body[i]));
       }
    }); 
  }

  private onWindowScroll(data: any) {
    this.palette.handleScroll(data);
  }


  /**
   * A function originating in the deisgn tool that signals a design mode change and communicates it to the palette
   * @param name the name of the current design mode
   */
  private designModeChanged(name: string){
    this.palette.designModeChanged();
  }

  /**
   * A function originating in the deisgn tool that signals a design mode change and communicates it to the palette
   * @param name the name of the current design mode
   */
  private inkChanged(name: string){
    // this.palette.inkChanged();
  }
  
  /**
   * this gets called when a new file is started from the topbar
   * @param result 
   */
  reInit(result){

    if(result.type == "mixer"){

      //first recreate the nodes and add them to the tree stack
      result.nodes.forEach(node => {

      })


    }else{
     result.drafts.forEach(d => {
        this.palette.createSubDraft(new Draft(d));
     });
    }

    console.log(result);

  }
  
  ngOnInit(){
    
  }

  ngAfterViewInit() {


  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  undo() {
    // let d: Draft = this.timeline.restorePreviousHistoryState();
    // console.log("Prevous State is ", d);
    // if(d === undefined || d === null) return;

    // this.draft.reload(d);    
    // this.palette.onNewDraftLoaded();
    // this.palette.redraw({
    //   drawdown: true, 
    //   loom:true, 
    //   warp_systems: true, 
    //   weft_systems: true, 
    //   warp_materials: true,
    //   weft_materials:true
    // });

    // this.palette.rescale(); 
  }

  redo() {
    // let d: Draft = this.timeline.restoreNextHistoryState();
    // console.log("Next State is ", d);

    // if(d === undefined || d === null) return;

    // console.log(d);

    // this.draft.reload(d);    
    // this.palette.onNewDraftLoaded();
    // this.palette.redraw({
    //   drawdown: true, 
    //   loom:true, 
    //   warp_systems: true, 
    //   weft_systems: true, 
    //   warp_materials: true,
    //   weft_materials:true
    // });

    // this.palette.rescale(); 
  }

  /// EVENTS




/**
   * Change to draw mode on keypress d
   * @returns {void}
   */
  @HostListener('window:keydown.d', ['$event'])
  private keyChangetoDrawMode(e) {
    this.design_modes.select('draw');
    this.designModeChanged('draw');
  }

  /**
   * Change to draw mode on keypress s
   * @returns {void}
   */
   @HostListener('window:keydown.s', ['$event'])
   private keyChangeToSelect(e) {
     this.design_modes.select('select');
     this.designModeChanged('select');
   }


     /**
   * Change to draw mode on keypress s
   * @returns {void}
   */
      @HostListener('window:keydown.m', ['$event'])
      private keyChangeToMove(e) {
        this.design_modes.select('move');
        this.designModeChanged('move');
      }
   

      operationAdded(name:string){
        this.palette.addOperation(name);
      }

/**
   * Call zoom out on Shift+o.
   * @extends WeaveComponent
   * @param {Event} shift+o
   * @returns {void}
   */
  // @HostListener('window:keydown.Shift.o', ['$event'])
  // private keyEventZoomOut(e) {
  //   console.log("zoom out");
  //   this.render.zoomOut();
  //   this.palette.rescale();
  // }


  /**
   * Sets selected area to clear
   * @extends WeaveComponent
   * @param {Event} delete key pressed
   * @returns {void}
   */

  // @HostListener('window:keydown.e', ['$event'])
  // private keyEventErase(e) {
  //   this.design_mode = {
  //     name: 'down',
  //     id: -1
  //   };
  //   this.palette.unsetSelection();

  // }

  /**
   * Sets brush to point on key control + d.
   * @extends WeaveComponent
   * @param {Event} e - Press Control + d
   * @returns {void}
   */
  // @HostListener('window:keydown.d', ['$event'])
  // private keyEventPoint(e) {
  //   this.design_mode = {
  //     name: 'up',
  //     id: -1};
  //   this.palette.unsetSelection();

  // }

  /**
   * Sets brush to select on key control + s
   * @extends WeaveComponent
   * @param {Event} e - Press Control + s
   * @returns {void}
   */
  // @HostListener('window:keydown.s', ['$event'])
  // private keyEventSelect(e) {
  //   this.design_mode = {
  //     name: 'select',
  //     id: -1};
  //   this.palette.unsetSelection();

  // }

  /**
   * Sets key control to invert on control + x
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  // @HostListener('window:keydown.x', ['$event'])
  // private keyEventInvert(e) {
  //   this.design_mode = {
  //     name: 'toggle',
  //     id: -1
  //   };
  //   this.palette.unsetSelection();

  // }

  /**
   * Sets key to copy 
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  // @HostListener('window:keydown.c', ['$event'])
  // private keyEventCopy(e) {
  //   this.onCopy();  
  // }

    /**
   * Sets key to copy 
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  // @HostListener('window:keydown.p', ['$event'])
  // private keyEventPaste(e) {
  //   this.onPaste({});
  // }

  public draftUploaded(result: any){
    const draft: Draft = new Draft(result);
    this.palette.addSubdraftFromDraft(draft);
  }

  /**
   * this is called when a user pushes bring from the topbar
   * @param event 
   * @todo add interface to select which draft to export if BMP or WIF
   */
  public onSave(event: any){



    switch(event.type){
      case 'jpg': 
        this.palette.saveAsPrint(event.name, event);
      break;

      case 'ada': 
      let link = event.downloadLink.nativeElement;
      link.href = this.fs.saver.ada(
        'mixer', 
        this.tree.exportSeedDraftsForSaving(),
        [],
        [],
        this.notes);
      link.download = event.name + ".ada";
    }
  }

  /**
   * Updates the canvas based on the weave view.
   * @extends WeaveComponent
   * @param {Event} e - view change event from design component.
   * @returns {void}
   */
  public renderChange(event: any) {


    console.log(event.value);
    //need to render the scale change to the parent and child subdrafts
     const scale = event.value;
     this.palette.rescale(scale);
    // const div = document.getElementById('scrollable-container');
    // div.style.transform = 'scale(' + scale + ')';

    
    // this.render.setCurrentView(value);

    // if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();

    // this.palette.redraw({
    //   drawdown: true
    // });
  }

 
  



  public updatePatterns(e: any) {
    // this.patterns = e.patterns;
    // this.draft.patterns = this.patterns;
  }



  public notesChanged(e:any) {
    console.log(e);
    //this.draft.notes = e;
  }

  public createPattern(e: any) {

    this.default_patterns.push(new Pattern({pattern: e.pattern}));
  
  }


//should this just hide the pattern or fully remove it, could create problems with undo/redo
   public removePattern(e: any) {
    this.default_patterns.patterns = this.default_patterns.patterns.filter(pattern => pattern !== e.pattern);
  }



  public toggleCollapsed(){
    this.collapsed = !this.collapsed;
  }


}
