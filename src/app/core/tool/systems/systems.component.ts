import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ElementRef, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-systems',
  templateUrl: './systems.component.html',
  styleUrls: ['./systems.component.scss']
})



export class SystemsComponent implements OnInit {

  @Input() warp_systems: any;
  @Input() weft_systems: any;
  @Input() warp_systems_pattern: any;
  @Input() weft_systems_pattern: any;
  @Input() shuttles: any;
  @Input() warp_shuttles_pattern: any;
  @Input() weft_shuttles_pattern: any;

  //chip params
  visible = true;
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];


  warpSystemCtrl = new UntypedFormControl();
  // warp_systems_pattern_strings: string[] = [];
  // allWarpSystems: string[] = [];


  weftSystemCtrl = new UntypedFormControl();
  // weft_systems_pattern_strings: string[] = [];
  // allWeftSystems: string[] = [];

  warpShuttleCtrl = new UntypedFormControl();
  // warp_shuttles_pattern_strings: any[] = [];
  // allWarpShuttles: any[] = [];

  weftShuttleCtrl = new UntypedFormControl();
  // weft_shuttles_pattern_strings: any[] = [];
  // allWeftShuttles: any[] = [];

  // fruits: string[] = ['Lemon'];
  // allFruits: string[] = ['Apple', 'Lemon', 'Lime', 'Orange', 'Strawberry'];

  @ViewChild('warpSystemInput') warpSystemInput: ElementRef<HTMLInputElement>;
  @ViewChild('weftSystemInput') weftSystemInput: ElementRef<HTMLInputElement>;
  @ViewChild('warpShuttleInput') warpShuttleInput: ElementRef<HTMLInputElement>;
  @ViewChild('weftShuttleInput') weftShuttleInput: ElementRef<HTMLInputElement>;
  
  @ViewChild('auto_wasy') matAutocompleteWasy: MatAutocomplete;
  @ViewChild('auto_wesy') matAutocompleteWesy: MatAutocomplete;
  @ViewChild('auto_wash') matAutocompleteWash: MatAutocomplete;
  @ViewChild('auto_wesh') matAutocompleteWesh: MatAutocomplete;


   @Output() onUpdateWarpSystems: any = new EventEmitter();
   @Output() onUpdateWeftSystems: any = new EventEmitter();
   @Output() onUpdateWarpShuttles: any = new EventEmitter();
   @Output() onUpdateWeftShuttles: any = new EventEmitter();


  constructor() {



  }

  ngOnInit() {

    console.log(this.warp_systems);

    // for(let i = 0; i < this.warp_systems_pattern.length; i++){
    //   this.warp_systems_pattern_strings.push(this.warp_systems[this.warp_systems_pattern[i]].getChar());
    // }

    // for(let i = 0; i < this.warp_systems.length; i++){
    //   this.allWarpSystems.push(this.warp_systems[i].getChar());
    // }


    // for(let i = 0; i < this.weft_systems_pattern.length; i++){
    //   this.weft_systems_pattern_strings.push(this.weft_systems[this.weft_systems_pattern[i]].getChar());
    // }

    // for(let i = 0; i < this.warp_systems.length; i++){
    //   this.allWeftSystems.push(this.weft_systems[i].getChar());
    // }

    // for(let i = 0; i < this.weft_shuttles_pattern.length; i++){
    //   let s = this.shuttles[this.weft_shuttles_pattern[i]];
    //   this.weft_shuttles_pattern_strings.push({color: s.getColor(), name: s.getName(), id: s.getId()});
    // }

    // for(let i = 0; i < this.warp_shuttles_pattern.length; i++){
    //   let s = this.shuttles[this.warp_shuttles_pattern[i]];
    //   this.warp_shuttles_pattern_strings.push({color: s.getColor(), name: s.getName(), id: s.getId()});
    // }

    // for(let i = 0; i < this.shuttles.length; i++){
    //   let s = this.shuttles[i];
    //   this.allWeftShuttles.push({color: s.getColor(), name: s.getName(), id: s.getId()});
    //   this.allWarpShuttles.push({color: s.getColor(), name: s.getName(), id: s.getId()});
    // }
  }
  
  idFromString(s: string){
    console.log(s);
    return s.charCodeAt(0)-97;
  }

  shuttleIdFromName(s: string):number{


    for(var i = 0; i < this.shuttles.length; i++){
      let s_name = this.shuttles[i].getName().toLowerCase();
      if(s_name.localeCompare(s.toLowerCase()) === 0) return i;
    }
    return -1;
  }

  add(event: MatChipInputEvent): void {


    const input = event.input;
    const value = event.value;
    const name = input.name;

    console.log("adding to ", name);
    let shuttle_id = this.shuttleIdFromName((value || '').trim());


    switch(name){
      case 'wasy':

        let warp_sys_id = this.idFromString((value || '').trim());
        console.log("value is ", warp_sys_id);
        if (warp_sys_id >= 0 && warp_sys_id < this.warp_systems.length) {
          this.warp_systems_pattern.push(this.idFromString(value.trim()));
        }
        this.warpSystemCtrl.setValue(null);
      
      break;

      case 'wash':
        console.log("value is ", this.shuttleIdFromName(value.trim()));

        if ((value || '').trim() && shuttle_id != -1) {
          // let all = {
          //   id: shuttle_id,
          //   color: this.shuttles[shuttle_id].getColor(),
          //   name: this.shuttles[shuttle_id].getName()
          // }
          this.warp_shuttles_pattern.push(shuttle_id);
        }
        this.warpShuttleCtrl.setValue(null);

      break;

      case 'wesy':

        let weft_sys_id = this.idFromString((value || '').trim());
        if (weft_sys_id >= 0 && weft_sys_id < this.warp_systems.length) {
          this.weft_systems_pattern.push(weft_sys_id);
        }
        this.weftSystemCtrl.setValue(null);
      break;

      case 'wesh':
        console.log("value is ", this.shuttleIdFromName(value.trim()));

        if ((value || '').trim() && shuttle_id != -1) {
          // let all = {
          //   id: shuttle_id,
          //   color: this.shuttles[shuttle_id].getColor(),
          //   name: this.shuttles[shuttle_id].getName()
          // }
          this.weft_shuttles_pattern.push(shuttle_id);
        }
        this.weftShuttleCtrl.setValue(null);


      break;
    }

    

    // Reset the input value
    if (input) {
      input.value = '';
    }


    //this.onUpdateWarpSystems.emit(this.warp_systems_pattern_strings);

  }

  remove(caller: string, index: number): void {

    switch(caller){
      case 'wasy':

        if (index >= 0 && this.warp_systems_pattern.length > 1) {
          this.warp_systems_pattern.splice(index, 1);
        }
          
      
      break;

      case 'wash':

        if (index >= 0 && this.warp_shuttles_pattern.length > 1) {
          this.warp_shuttles_pattern.splice(index, 1);
        }
      

      break;

      case 'wesy':
        

        if (index >= 0 && this.weft_systems_pattern.length > 1) {
          this.weft_systems_pattern.splice(index, 1);
        }
     
      break;

      case 'wesh':

        if (index >= 0 && this.weft_shuttles_pattern.length > 1) {
          this.weft_shuttles_pattern.splice(index, 1);
        }
      break;
    }

  }

  sendUpdates(source: string){
    console.log("send updates", source);
  switch(source){
      case 'wasy':
      this.onUpdateWarpSystems.emit(this.warp_systems_pattern);
      break;

      case 'wash':
      this.onUpdateWarpShuttles.emit(this.warp_shuttles_pattern);
      break;

      case 'wesy':
      this.onUpdateWeftSystems.emit(this.weft_systems_pattern);
      break;

      case 'wesh':
        this.onUpdateWeftShuttles.emit(this.weft_shuttles_pattern);
      break;
    }

  }

  selected(source: string, event: MatAutocompleteSelectedEvent): void {
    console.log("selected", source);
     switch(source){
      case 'wasy':
      let warp_sys_id = this.idFromString(event.option.viewValue);
      console.log("selected", warp_sys_id);

      this.warp_systems_pattern.push(warp_sys_id);
      this.warpSystemCtrl.setValue(null);
      break;

      case 'wash':

      let warp_id =  this.shuttleIdFromName(event.option.viewValue);

      // let warp_obj = {
      //   id: warp_id, 
      //   name: this.shuttles[warp_id].getName(), 
      //   color: this.shuttles[warp_id].getColor()
      // };

      this.warp_shuttles_pattern.push(warp_id);
      this.warpShuttleCtrl.setValue(null);
      
      break;

      case 'wesy':
      let weft_sys_id = this.idFromString(event.option.viewValue);
      this.weft_systems_pattern.push(weft_sys_id);
      this.weftSystemCtrl.setValue(null);
      break;

      case 'wesh':


      let weft_id =  this.shuttleIdFromName(event.option.viewValue);

      // let weft_obj = {
      //   id: weft_id, 
      //   name: this.shuttles[weft_id].getName(), 
      //   color: this.shuttles[weft_id].getColor()
      // };

      this.weft_shuttles_pattern.push(weft_id);
      this.weftShuttleCtrl.setValue(null);
      break;
    }

  
  }

  



}
