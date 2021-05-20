import { Injectable } from '@angular/core';
import { elementAt } from 'rxjs/operators';

interface DesignMode{
  value: string;
  viewValue: string;
  icon: string;
  children: Array<DesignMode>;
  selected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DesignmodesService {


  modes: Array<DesignMode>;
  selected: Array<DesignMode>;

/**
 * Creates the objects that track which design mode (draw, select, etc) the user is currently working in. 
 */
  constructor() { 

    this.selected = [];

  
  const drawChildren: Array<DesignMode> = [
    {value: 'toggle', viewValue: 'Toggle Heddle', icon: "fas fa-adjust",  children: [], selected: false},
    {value: 'up', viewValue: 'Set Heddle Up', icon: "fas fa-square",  children: [], selected: false},
    {value: 'down', viewValue: 'Set Heddle Down', icon: "far fa-square",  children: [], selected: false}
  ];

  console.log(drawChildren);

  this.modes = [
    {value: 'draw', viewValue: 'Draw', icon: "fas fa-pen", children: drawChildren, selected: false},
    {value: 'select', viewValue: 'Select', icon: "fas fa-expand", children: [], selected:false},
    {value: 'move', viewValue: 'Move Drafts', icon: "fas fa-arrows-alt", children: [], selected:false},
    {value: 'operator', viewValue: 'Add Operation', icon: "fas fa-network-wired", children: [], selected:false}
  ];

    this.select('toggle');
  
  }


  /**
   * A function to retreive a mode by name. Only works if modes are nested no more than 1 deep. 
   * @param name the name of the component we're looking to retreive
   * @returns the DeisgnMode associated with that name, or null if nothing was found
   */

  getMode(name: string): DesignMode {
   let found: DesignMode = null;

   this.modes.forEach( mode => {
      if(mode.value === name) found =  mode;
      mode.children.forEach(child => {
        if(child.value === name) found = child;
      });
   });
   return found;
  }

  /**
   * sets false to the selection parameter on all the modes. 
   */
  clearSelection(){
    this.selected.forEach( mode => {
      mode.selected = false;
    });
    this.selected = [];
  }

/**
 * clears previous selections and selects both parent and child mode associated with name
 * @param name a string corresponding to the name of this mode
 * @returns boolean cooresponding to whether or no a selection was made 
 */
  select(name: string): boolean{

    let found: boolean = false;
    this.clearSelection();

    this.modes.forEach( mode => {
      if(mode.value === name){
        mode.selected = true;
        found = true;
        this.selected.push(mode);
      } 
      mode.children.forEach(child => {
        if(child.value === name){
          mode.selected = true;
          child.selected = true;
          found = true;
          this.selected.push(mode);
          this.selected.push(child);
        } 
      });
   });

   return found;
  }


  /**
   * Get the current modes that are selected
   * @returns returns the collection of selected modes
   */
  getSelected():Array<DesignMode>{
    return this.selected;
  }

  /**
   * checks if a user specified mode is selected
   * @param name the name of the mode we are asking about
   * @returns boolean describing if it was selected or not
   */
  isSelected(name:string):boolean{
    const found:DesignMode = this.selected.find(el => el.value == name);
    return (found === undefined) ? false : true;
  }
 

}
