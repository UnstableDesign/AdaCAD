import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { DynamicOperation, OperationInlet, OpNode } from '../../../../core/model/datatypes';
import { getDraftName } from '../../../../core/model/drafts';
import { OperationService } from '../../../../core/provider/operation.service';
import { SystemsService } from '../../../../core/provider/systems.service';
import { TreeService } from '../../../../core/provider/tree.service';


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
  @Output() onInputVisibilityChange = new EventEmitter <any>(); 
  @Output() onConnectionRemoved = new EventEmitter <any>(); 
  @Output() onInletChange = new EventEmitter <any>(); 
  @Output() onInletLoaded = new EventEmitter <any>(); 

  fc: UntypedFormControl;
  textValidate: any;
  all_system_codes: Array<any>;
  number_opts: Array<number>;
  opnode: OpNode;
  inlet: OperationInlet;
  selectedValue: number; 
  inlet_desc: string;
  show_connection_name: number = -1;
  inlet_open = true;
  show_inlet_desc = false;
  inlet_for_drafts = true;
  inlet_name = "";
  constructor(
    public tree: TreeService, 
    private systems: SystemsService, 
    private ops: OperationService,
    ) { 

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
    if(this.opnode.inlets.length > 0 && this.inletid >= op.inlets.length && this.dynamic){
      const type = (<DynamicOperation> op).dynamic_param_type;
      this.inlet = <OperationInlet>{
        type: type,
        name: '',
        value: this.parseDefaultInletValue(type, this.opnode.inlets[this.inletid]),
        uses: 'draft',
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
        uses: 'draft',
        num_drafts: 1,
        dx: 'input'
      }
    }


    this.fc = new UntypedFormControl(this.parseDefaultInletValue(this.inlet.type, this.opnode.inlets[this.inletid]));
    this.inlet_desc = "input "+this.inlet.dx;
    this.inlet_for_drafts = this.inlet.uses === 'draft';
    this.inlet_name = this.inlet.name;

  }

  ngAfterViewInit(){

    this.onInletLoaded.emit({ndx: this.inletid});
  }

  checkIfInletIsOpen(){
    this.inlet_open = this.inlet.num_drafts == -1 || (this.tree.getInputsAtNdx(this.opid, this.inletid).length < this.inlet.num_drafts);

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
        return value.slice();
        break;

      case 'color':
        return value;
        break;
      
    }
  }



  toggleVisibility(input_ndx: number){
      if(input_ndx == this.show_connection_name){
        this.onInputVisibilityChange.emit({inletid: this.inletid, ndx_in_inlets: input_ndx, show: false});
        this.show_connection_name = -1;
      }  else{
        this.show_connection_name = input_ndx;
        this.onInputVisibilityChange.emit({inletid: this.inletid, ndx_in_inlets: input_ndx, show: true});

      }
      
  }


  inputSelected(){


      this.onInputSelected.emit({inletid: this.inletid});
      this.show_connection_name = -1;
      
  }

  removeConnectionTo(sd_id: number){
    
    this.onConnectionRemoved.emit({from: sd_id, to: this.opid, inletid: this.inletid});
    this.checkIfInletIsOpen();

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
