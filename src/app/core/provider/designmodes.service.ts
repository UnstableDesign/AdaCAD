// import { Injectable } from '@angular/core';
// import { defaults, draft_edit_mode, draft_pencil, draft_edit_source, mixer_edit_mode } from '../model/defaults';


// @Injectable({
//   providedIn: 'root'
// })
// export class DesignmodesService {

//   cur_pencil: string = defaults.pencil;
//   cur_draft_edit_mode: string = defaults.draft_edit_mode;
//   cur_draft_edit_source: string = defaults.draft_edit_source;
//   cur_mixer_mode: string = defaults.mixer_mode;


// /**
//  * Creates the objects that track which design mode (draw, select, etc) the user is currently working in. 
//  */
//   constructor() { 




//    }


//   /**
//    * This Values Get and Set the current mode of editing on the draft detail view. Controlling if the drawdown updates from the shafts or vice versa
//    */

//   isSelectedDraftEditSource(value:string):boolean{
//     return this.cur_draft_edit_source == value;
//   }

//   selectDraftEditSource(value:string){
//     let confirm = draft_edit_source.find(el => el.value == value);
//     if(confirm == undefined) console.error("ATTEMPTING TO SET NONEXISTING DRAFT EDITING MODE", value);
//     else this.cur_draft_edit_source = value;
//   }

//   resetDraftEditSource(){
//     this.cur_draft_edit_source = defaults.draft_edit_source;
//   }

//   /**
//    * These control which type of "pencil" to use with designing a draft
//    */


//   isSelectedPencil(value:string):boolean{
//     return this.cur_pencil == value;
//   }

//   selectPencil(value:string){
//     let confirm = draft_pencil.find(el => el.value == value);
//     if(confirm == undefined) console.error("ATTEMPTING TO SET NONEXISTING DRAFT PENCIL MODE", value);
//     else this.cur_pencil = value;
//   }

//   resetPencil(){
//     this.cur_pencil = defaults.pencil;
//   }


//   /**
//    * These control which type of editing mode we are using when interacting with a draft 
//    */


//   isSelectedDraftEditingMode(value:string):boolean{
//     return this.cur_draft_edit_mode == value;
//   }

//   selectDraftEditingMode(value:string){
//     let confirm = draft_edit_mode.find(el => el.value == value);
//     if(confirm == undefined) console.error("ATTEMPTING TO SET NONEXISTING DRAFT EDIT MODE", value);
//     else this.cur_draft_edit_mode = value;
//   }

//   resetDraftEditingMode(){
//     this.cur_draft_edit_mode = defaults.draft_edit_mode;
//   }

//   /**
//    * These control which type of mixer editing mode we are using when interacting with the mixer interface 
//    */

//   isSelectedMixerEditingMode(value:string):boolean{
//     return this.cur_mixer_mode == value;
//   }

//   selectMixerEditingMode(value:string){
//     let confirm = mixer_edit_mode.find(el => el.value == value);
//     if(confirm == undefined) console.error("ATTEMPTING TO SET NONEXISTING DRAFT MIXER MODE", value);
//     else this.cur_mixer_mode = value;
//   }

//   resetMixerEditingMode(){
//     this.cur_mixer_mode = defaults.mixer_mode;
//   }

//   reset(){
//     this.resetDraftEditSource();
//     this.resetDraftEditingMode();
//     this.resetPencil();
//     this.resetMixerEditingMode();

//   }



// }
