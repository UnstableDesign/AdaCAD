import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { OperationService } from '../../../provider/operation.service';
import { SystemsService } from '../../../../core/provider/systems.service';
import { TreeService } from '../../../provider/tree.service';
import { getDraftName } from '../../../../core/model/drafts';
import { DynamicOperation, OperationInlet,OpNode } from '../../../../core/model/datatypes';
import { I } from '@angular/cdk/keycodes';



@Component({
  selector: 'app-inlet',
  templateUrl: './inlet.component.html',
  styleUrls: ['./inlet.component.scss']
})
export class InletComponent implements OnInit {

  @Input() opid:  number;
  @Input() inletid:  number;
  @Input() dynamic: boolean;
  @Output() onInputSelected = new EventEmitter <any>(); 
  @Output() onConnectionRemoved = new EventEmitter <any>(); 
  @Output() onInletChange = new EventEmitter <any>(); 

  fc: FormControl;
  textValidate: any;
  all_system_codes: Array<any>;
  number_opts: Array<number>;
  opnode: OpNode;
  inlet: OperationInlet;
  selectedValue: number; 

  constructor(public tree: TreeService, private systems: SystemsService, private ops: OperationService) { 

  }

  ngOnInit(): void {    
    this.opnode = this.tree.getOpNode(this.opid);
    this.all_system_codes = this.systems.weft_systems.map(el => {return {code: el.name, id: el.id}} );
    const op = this.ops.getOp(this.opnode.name);  
    this.number_opts = [];
    for(let i = 1; i < 50; i++){
      this.number_opts.push(i);
    }

    
    // initalize any dyanmic inlets
    if(this.inletid >= op.inlets.length && this.dynamic){
      const type = (<DynamicOperation> op).dynamic_param_type;
      this.inlet = <OperationInlet>{
        type: type,
        name: '',
        value: this.parseDefaultInletValue(type, this.opnode.inlets[this.inletid]),
        num_drafts: 1,
        dx: ''
      }
    }else{
      this.inlet = op.inlets[this.inletid];
    }

    if(this.inlet === undefined){
      this.inlet = <OperationInlet>{
        type: 'null',
        name: '',
        value: -1,
        num_drafts: 1,
        dx: ''
      }
    }


    this.fc = new FormControl(this.parseDefaultInletValue(this.inlet.type, this.opnode.inlets[this.inletid]));

  }

  parseDefaultInletValue(type: string, value: any) : any {
    switch (type){
      case 'number':
      case 'system':
      case 'draft':
        return parseInt(value);
        break;
      case 'notation':
      case 'string':
      case 'color':
        return value.slice();
      
    }
  }


  inputSelected(){
    this.onInputSelected.emit(this.inletid);
  }

  removeConnectionTo(sd_id: number){
    this.onConnectionRemoved.emit({from: sd_id, to: this.opid, inletid: this.inletid});
  }

  getInputName(id: number) : string {
    const sd = this.tree.getDraft(id);
    if(sd === null || sd === undefined) return "null draft"
    return getDraftName(sd);
  }

  inletChange(){

    const opnode: OpNode = <OpNode> this.tree.getNode(this.opid);

    // switch(this.inlet.type){
    //   case 'number':
    //     this.fc.setValue(value);
    //     opnode.inlets[this.inletid] = value;
    //     break;
    //   case 'system':
    //    // opnode.inlets[this.inletid] = value;
    //     break;
    //   case 'color':
    //     this.fc.setValue(value);
    //     opnode.inlets[this.inletid] = value;
    //     break;
    //   case 'notation':
    //     this.fc.setValue(value);
    //     opnode.inlets[this.inletid] = value;
    //     break;

    // }

    this.onInletChange.emit({id: this.inletid});

  }






}
