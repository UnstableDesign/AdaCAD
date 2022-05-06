import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { OperationInlet, OperationService, DynamicOperation } from '../../../provider/operation.service';
import { SystemsService } from '../../../../core/provider/systems.service';
import { OpNode, TreeService } from '../../../provider/tree.service';



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
  opnode: OpNode;
  inlet: OperationInlet;

  constructor(public tree: TreeService, private systems: SystemsService, private ops: OperationService) { 

  }

  ngOnInit(): void {    
    this.opnode = this.tree.getOpNode(this.opid);
    this.all_system_codes = this.systems.weft_systems.map(el => el.name);
    const op = this.ops.getOp(this.opnode.name);  
    
    console.log("dynamic", this.dynamic, this.inletid, this.opnode.inlets.length)
    if(this.inletid >= op.inlets.length && this.dynamic){
      const type = (<DynamicOperation> op).dynamic_param_type;
      this.inlet = <OperationInlet>{
        type: type,
        name: '',
        value: this.opnode.inlets[this.inletid],
        num_drafts: 1,
        dx: ''
      }
    }else{
      this.inlet = op.inlets[this.inletid];
    }
    


    this.fc = new FormControl(this.opnode.inlets[this.inletid]);

    console.log("TEST:", this.opnode, this.inlet)

  }

  inputSelected(){
    this.onInputSelected.emit(this.inletid);
  }

  removeConnectionTo(sd_id: number, ndx: number){
    this.onConnectionRemoved.emit({from: sd_id, to: this.opid});
  }

  getInputName(id: number) : string {
    const sd = this.tree.getDraft(id);
    if(sd === null || sd === undefined) return "null draft"
    return sd.getName();
  }

  inletChange(value: any){
    const opnode: OpNode = <OpNode> this.tree.getNode(this.opid);
    this.fc.setValue(value);
    
    switch(this.inlet.type){
      case 'main':
        opnode.inlets[this.inletid] = 0;
        break;
      case 'number':
        opnode.inlets[this.inletid] = value;
        break;
      case 'system':
        console.log("value", value)
        opnode.inlets[this.inletid] = value;
        console.log("inlets", opnode.inlets);
        break;
      case 'color':
        opnode.inlets[this.inletid] = value;
        break;
      case 'notation':
        opnode.inlets[this.inletid] = value;
        break;

    }

    this.onInletChange.emit({id: this.inletid});
   
  }






}
