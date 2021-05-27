import { Injectable } from '@angular/core';



interface Ink{
  value: string;
  viewValue: string;
  dx: string;
  icon: string;
  selected: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class InkService {
  inks: Array<Ink>;
  selected: Ink;


  constructor() { 


    this.inks = [
      {value: 'neq', viewValue: 'Reversing Ink', dx: "compares this pattern with what is underneight and draws black square when they are not equal", icon: "fas fa-adjust", selected: false},
      {value: 'up', viewValue: 'Setting Ink', dx: "sets this pattern within the draft no matter what is under it", icon: "fas fa-square",  selected: false},
      {value: 'down', viewValue: 'Erasing Ink', dx: "places all the heddle downs atop the draft underneith it", icon: "far fa-square",  selected: false},
      {value: 'unset', viewValue: 'Removing Ink', dx: "removes the use of this heddle in the draft (for shape and inlay weaving)", icon: "fas fa-times", selected: false},
      {value: 'and', viewValue: 'Masking Ink', dx: "only reveals bottom pattern in areas where this pattern is black", icon: "fas fa-mask", selected: false},
      {value: 'or', viewValue: 'Overlaying Ink', dx: "copies all black pattern cells atop the draft", icon: "fas fa-plus", selected: false}
    ];
  
    this.select('neq');

    
  
  }


  /**
   * A function to retreive an ink by name. 
   * @param name the name of the ink we're looking to retreive
   * @returns the Ink associated with that name, or null if nothing was found
   */

   getInk(name: string): Ink {
    let found: Ink = null;
 
    this.inks.forEach( ink => {
       if(ink.value === name) found =  ink;
    });
    return found;
   }
 
   /**
    * sets false to the selection parameter on all the modes. 
    */
   clearSelection(){
     this.selected = null
   }
 
 /**
  * clears previous selections and selects ink associated with name
  * @param name a string corresponding to the name of this ink
  * @returns boolean cooresponding to whether or not a selection was made 
  */
   select(name: string): boolean{
 
     let found: boolean = false;
     this.clearSelection();
 
     this.inks.forEach(ink => {
       if(ink.value === name){
         ink.selected = true;
         found = true;
         this.selected = ink;
       } 
    });
 
    return found;
   }
 
 
   /**
    * Get the current ink name that is selected
    * @returns returns the selected ink name
    */
   getSelected():string{
     return this.selected.value;
   }
 
   /**
    * checks if a user specified ink is selected
    * @param name the name of the mode we are asking about
    * @returns boolean describing if it was selected or not
    */
   isSelected(name:string):boolean{
     return(name == this.selected.value);
   }
}
