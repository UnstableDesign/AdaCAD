import { Component, ElementRef, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { PatternService } from '../core/provider/pattern.service';
import { DesignmodesService } from '../core/provider/designmodes.service';
import { ScrollDispatcher } from '@angular/cdk/overlay';
import { Timeline } from '../core/model/timeline';
import { Pattern } from '../core/model/pattern';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ConnectionModal } from './modal/connection/connection.modal';
import { LabelModal } from './modal/label/label.modal';
import {Subject} from 'rxjs';
import { PaletteComponent } from './palette/palette.component';
import { DesignComponent } from './tool/design/design.component';


//disables some angular checking mechanisms
//enableProdMode();


/**
 * Controller of the Weaver component.
 * @class
 */

 interface LoomTypes {
  value: string;
  viewValue: string;
}

interface MaterialTypes {
  value: number;
  viewValue: string;
}

interface DensityUnits {
  value: string;
  viewValue: string;
}


interface ViewModes {
  value: string;
  viewValue: string;
}

// interface ToolModes{
//   value: string; 
//   viewValue: string;
//   icon: string;
//   menu: string;

// }


@Component({
  selector: 'app-mixer',
  templateUrl: './mixer.component.html',
  styleUrls: ['./mixer.component.scss']
})
export class MixerComponent implements OnInit {


  @ViewChild('bitmapImage', {static: false}) bitmap;
  @ViewChild(PaletteComponent, {static: false}) palette;
  @ViewChild(DesignComponent, {static: false}) design_tool;

 /**
   * The weave Timeline object.
   * @property {Timeline}
   */
   timeline: Timeline = new Timeline();


  /**
  The current selection, as boolean array 
  **/
  //copy: Array<Array<boolean>>;


 /**
   * The types of looms this version will support.
   * @property {LoomType}
   */
  loomtypes: LoomTypes[] = [
    {value: 'frame', viewValue: 'Shaft'},
    {value: 'jacquard', viewValue: 'Jacquard'}
  ];


  material_types: MaterialTypes[] = [
    {value: 0, viewValue: 'Non-Conductive'},
    {value: 1, viewValue: 'Conductive'},
    {value: 2, viewValue: 'Resistive'}
  ];

  density_units: DensityUnits[] = [
    {value: 'in', viewValue: 'Ends per Inch'},
    {value: 'cm', viewValue: 'Ends per 10cm '}
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

  draftelement:any;
  scrollingSubscription: any;

  /// ANGULAR FUNCTIONS
  /**
   * @constructor
   * ps - pattern service (variable name is initials). Subscribes to the patterns and used
   * to get and update stitches.
   * dialog - Anglar Material dialog module. Used to control the popup modals.
   */
  constructor(private design_modes: DesignmodesService, private ps: PatternService, private dialog: MatDialog, public scroll: ScrollDispatcher) {


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
    //this.palette.rescale();
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
     this.palette.inkChanged();
  }
  
  


  // reInit(result){
  //   console.log("reinit");

  //   this.draft.reload(result);
  //   this.timeline.addHistoryState(this.draft);

  //   this.render.view_frames = (this.draft.loom.type === 'frame') ? true : false;     

  //   if (this.draft.patterns === undefined) this.draft.patterns = this.default_patterns;
    

  //   this.palette.onNewDraftLoaded();


  //   this.palette.redraw({
  //     drawdown: true, 
  //     loom:true, 
  //     warp_systems: true, 
  //     weft_systems: true, 
  //     warp_materials: true,
  //     weft_materials:true
  //   });

  //   this.palette.rescale();

  // }
  
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

  /**
   * Updates the canvas based on the weave view.
   * @extends WeaveComponent
   * @param {Event} e - view change event from design component.
   * @returns {void}
   */
  public viewChange(value: any) {
    
    // this.render.setCurrentView(value);

    // if(this.render.isYarnBasedView()) this.draft.computeYarnPaths();

    // this.palette.redraw({
    //   drawdown: true
    // });
  }

 
  
  
  public onSave(e: any) {

    e.bitmap = this.bitmap.map(element => (element.isUp() && element.isSet()));
    console.log(e);

    if (e.type === "bmp") this.palette.saveBMP(e.name, e);
    else if (e.type === "ada") this.palette.saveADA(e.name, e);
    else if (e.type === "wif") this.palette.saveWIF(e.name, e);
    else if (e.type === "jpg") this.palette.savePrintableDraft(e.name, e);
    
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
