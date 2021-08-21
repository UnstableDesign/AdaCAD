import { FixedSizeVirtualScrollStrategy } from '@angular/cdk/scrolling';
import { Injectable } from '@angular/core';
import { elementAt } from 'rxjs/operators';
import { DesignMode } from '../model/datatypes';


@Injectable({
  providedIn: 'root'
})
export class DesignmodesService {


  design_modes: Array<DesignMode>;
  draw_modes:Array<DesignMode>;
  shapes:Array<DesignMode>;

  design_actions: Array<DesignMode>;

  
  view_modes:Array<DesignMode>;
  
  density_units:Array<DesignMode>;
  material_types: Array<DesignMode>;
  loom_types: Array<DesignMode>
  
/**
 * Creates the objects that track which design mode (draw, select, etc) the user is currently working in. 
 */
  constructor() { 


    this.loom_types = [
      {value: 'frame', viewValue: 'Shaft',icon: "fas fa-slash", children: [], selected: false},
      {value: 'jacquard', viewValue: 'Jacquard',icon: "fas fa-slash", children: [], selected: true}
    ];
  
  

    this.material_types = [
      {value: '0', viewValue: 'Non-Conductive', icon: "fas fa-slash", children: [], selected: true},
      {value: '1', viewValue: 'Conductive', icon: "fas fa-slash", children: [], selected: false},
      {value: '2', viewValue: 'Resistive', icon: "fas fa-slash", children: [], selected: false}
    ];

    this.view_modes = [
      {value: 'visual', viewValue: 'Visual', icon: "fas fa-slash", children: [], selected: false},
      {value: 'pattern', viewValue: 'Draft', icon: "fas fa-slash", children: [], selected: true},
      {value: 'yarn', viewValue: 'Circuit',icon: "fas fa-slash", children: [], selected: false}
     // {value: 'mask', viewValue: 'Masks'}

    ];

    this.density_units = [
      {value: 'in', viewValue: 'Ends per Inch', icon: "fas fa-slash", children: [], selected: false},
      {value: 'cm', viewValue: 'Ends per 10cm ',icon: "fas fa-slash", children: [], selected: false}
    ];

    this.shapes = [
      {value: 'line', viewValue: 'Line', icon: "fas fa-slash", children: [], selected: true},
      {value: 'fill_circle', viewValue: 'Filled Circle', icon: "fas fa-circle", children: [], selected: false},
      {value: 'stroke_circle', viewValue: 'Circle Outline', icon: "far fa-circle", children: [],selected: false},
      {value: 'fill_rect', viewValue: 'Filled Rectangle', icon: "fas fa-square", children: [], selected: false},
      {value: 'stroke_rect', viewValue: 'Rectangle Outline', icon: "far fa-square", children: [], selected: false},
      {value: 'free', viewValue: 'Freehand', icon: "fas fa-draw-polygon", children: [], selected: false},
    ]

    this.draw_modes = [
      {value: 'toggle', viewValue: 'Toggle Heddle', icon: "fas fa-adjust", children: [],selected: true},
      {value: 'up', viewValue: 'Set Heddle Up', icon: "fas fa-square", children: [], selected: false},
      {value: 'down', viewValue: 'Set Heddle Down', icon: "far fa-square", children: [], selected: false},
      {value: 'unset', viewValue: 'Unset Heddle', icon: "far fa-times", children: [], selected: false},
      {value: 'material', viewValue: 'Draw Material', icon: "fas fa-pen", children: [], selected: false},

    ]
    
    this.design_modes = [
      {value: 'draw', viewValue: 'Draw Heddle', icon: "fas fa-pen", children: this.draw_modes, selected: true},
      {value: 'shape', viewValue: 'Shape', icon: "fas fa-shapes", children: this.shapes,selected: false},
      {value: 'select', viewValue: 'Select', icon: "fas fa-expand", children: [],selected:false},
      {value: 'marquee', viewValue: 'Cut/Create', icon: "fas fa-expand", children: [], selected:false},
      {value: 'move', viewValue: 'Move', icon: "fas fa-arrows-alt", children: [],selected:false},
      {value: 'operation', viewValue: 'Operations', icon: "fas fa-project-diagram", children: [],selected:false},
      {value: 'zoom_in', viewValue: 'Zoom In', icon: "fas fa-search-plus", children: [], selected:false},
      {value: 'zoom_out', viewValue: 'Zoom Out', icon: "fas fa-search-minus", children: [],selected:false},
      {value: 'comment', viewValue: 'Comment', icon: "fas fa-comment", children: [],selected:false},
    ];

   this.design_actions = [
      {value: 'toggle', viewValue: 'Invert Region', icon: "fas fa-adjust", children: [],selected:false},
      {value: 'up', viewValue: 'Set Region Heddles Up', icon: "fas fa-square", children: [],selected:false},
      {value: 'down', viewValue: 'Set Region Heddles Down', icon: "far fa-square", children: [],selected:false},
      {value: 'flip_x', viewValue: 'Vertical Flip', icon: "fas fa-arrows-alt-v", children: [],selected:false},
      {value: 'flip_y', viewValue: 'Horizontal Flip', icon: "fas fa-arrows-alt-h", children: [],selected:false},
      {value: 'shift_left', viewValue: 'Shift 1 Warp Left', icon: "fas fa-arrow-left", children: [],selected:false},
      {value: 'shift_up', viewValue: 'Shift 1 Pic Up', icon: "fas fa-arrow-up", children: [],selected:false},
      {value: 'copy', viewValue: 'Copy Selected Region', icon: "fa fa-clone",children: [],selected:false},
      {value: 'paste', viewValue: 'Paste Copyed Pattern to Selected Region', icon: "fa fa-paste",children: [],selected:false}
    ];
  
  }

  getOptionSet(name: string):Array<DesignMode>{
    let modes: Array<DesignMode> = [];

    switch(name){
      case 'design_modes' : 
      modes = this.design_modes
      break;

      case 'view_modes' : 
      modes = this.view_modes
      break;

      case 'density_units' : 
      modes = this.density_units
      break;

      case 'loom_types' : 
      modes = this.loom_types;
      break;    
      
      case 'shapes' : 
      modes = this.shapes;
      this.selectDesignMode('shape', 'design_modes');
      break; 
     
      case 'draw_modes' : 
      modes = this.draw_modes;
      this.selectDesignMode('draw', 'design_modes');
      break;       
      
      case 'material_types' : 
      modes = this.material_types;
      break;  

      case 'design_actions' : 
      modes = this.design_actions;
      break;  
    }

    return modes;
  }



  /**
   * A function to selects one mode and deselect others from a set of options given by the string "from"
   * @param value of the component we're looking to set as selected
   * @param name of the option set we are selecting from
   */

   selectDesignMode(value: string, from: string) {
     

    const modes:Array<DesignMode> = this.getOptionSet(from);

    modes.forEach( mode => {
       if(mode.value === value){
          mode.selected = true;
       }else{
          mode.selected = false;
       }
    });


   }


  /**
   * A function to retreive a mode by name.
   * @param name the name of the component we're looking to retreive
   * @returns the DeisgnMode associated with that name, or null if nothing was found
   */

  getDesignMode(value: string, from: string): DesignMode {
   
    const modes:Array<DesignMode> = this.getOptionSet(from);
    let found: DesignMode = null;

   modes.forEach( mode => {
      if(mode.value === value) found =  mode;
   });
   return found;
  }

  /**
   * A function to retreive a mode by name.
   * @returns the DeisgnMode associated with that name, or null if nothing was found
   */

   getSelectedDesignMode(from: string): DesignMode {
   
    const modes:Array<DesignMode> = this.getOptionSet(from);
    let found: DesignMode = null;
 
    modes.forEach( mode => {
       if(mode.selected === true) found =  mode;
    });
    return found;
   }



  /**
   * checks if a user specified mode is selected
   * @param name the name of the mode we are asking about
   * @returns boolean describing if it was selected or not
   */
  isSelected(value:string, from: string):boolean{
    const modes:Array<DesignMode> = this.getOptionSet(from);
 
    modes.forEach( mode => {
       if(mode.value === value) return mode.selected;
    });

    return false;
  }



}
