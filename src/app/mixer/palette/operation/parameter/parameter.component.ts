import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroupDirective, NgForm, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { OperationService } from '../../../../core/provider/operation.service';
import { BoolParam, DraftParam, FileParam, NumParam, SelectParam, StringParam, OpNode } from '../../../../core/model/datatypes';
import {TreeService } from '../../../../core/provider/tree.service';
import { parseI18nMeta } from '@angular/compiler/src/render3/view/i18n/meta';
import { OperationDescriptionsService } from '../../../../core/provider/operation-descriptions.service';
import { K } from '@angular/cdk/keycodes';


export function regexValidator(nameRe: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const globalRegex = new RegExp(nameRe, 'g');
    const valid =  globalRegex.test(control.value);
    return !valid ? {forbiddenInput: {value: control.value}} : null;
  };
}



@Component({
  selector: 'app-parameter',
  templateUrl: './parameter.component.html',
  styleUrls: ['./parameter.component.scss']
})
export class ParameterComponent implements OnInit {
  
  fc: FormControl;
  opnode: OpNode;
  name: any;

  @Input() param:  NumParam | StringParam | SelectParam | BoolParam | FileParam;
  @Input() opid:  number;
  @Input() paramid:  number;
  @Output() onOperationParamChange = new EventEmitter <any>(); 
  @Output() onFileUpload = new EventEmitter <any>(); 

  //you need these to access values unique to each type.
  numparam: NumParam;
  boolparam: BoolParam;
  stringparam: StringParam;
  selectparam: SelectParam;
  fileparam: FileParam;
  draftparam: DraftParam;
  description: string;


  constructor(
    public tree: TreeService, 
    public ops: OperationService,
    public op_desc: OperationDescriptionsService) { 
  }

  ngOnInit(): void {

    this.opnode = this.tree.getOpNode(this.opid);
    this.description = this.op_desc.getParamDescription(this.param.name);
    if(this.description == undefined || this.description == null) this.description = this.param.dx;
     //initalize the form controls for the parameters: 

      switch(this.param.type){
        case 'number':
          this.numparam = <NumParam> this.param;
          this.fc = new FormControl(this.param.value);
          break;

        case 'boolean':
          this.boolparam = <BoolParam> this.param;
          this.fc = new FormControl(this.param.value);
          break;

        case 'select':
          
          this.selectparam = <SelectParam> this.param;
          this.fc = new FormControl(this.param.value);
          break;

        case 'file':
          this.fileparam = <FileParam> this.param;
          this.fc = new FormControl(this.param.value);
          break;

        case 'string':
          this.stringparam = <StringParam> this.param;
          this.fc = new FormControl(this.stringparam.value, [Validators.required, regexValidator((<StringParam>this.param).regex)]);
          break;

        // case 'draft':
        //   this.draftparam = <DraftParam> this.param;
        //   this.fc = new FormControl(this.draftparam.value);
        //   break;
         
       
      }
  

  }



  /**
   * changes the view and updates the tree with the new value
   * @param value 
   */
  onParamChange(value: number){

    const opnode: OpNode = <OpNode> this.tree.getNode(this.opid);

    switch(this.param.type){
      case 'number': 
        opnode.params[this.paramid] = value;
        this.fc.setValue(value);
        this.onOperationParamChange.emit({id: this.paramid, value: value});
        break;

      case 'boolean':
        opnode.params[this.paramid] = (value) ? 1 : 0;
        this.fc.setValue(value);
        this.onOperationParamChange.emit({id: this.paramid, value: value});
        break;

      case 'string':
        opnode.params[this.paramid] = value;
        this.fc.setValue(value);
        if(!this.fc.hasError('forbiddenInput'))this.onOperationParamChange.emit({id: this.paramid, value: value});
        break;

      case 'select':
        opnode.params[this.paramid] = value;
        this.fc.setValue(value);
        this.onOperationParamChange.emit({id: this.paramid, value: value});
        break;

      case 'draft':
        opnode.params[this.paramid] = value;
        this.fc.setValue(value);
        this.onOperationParamChange.emit({id: this.paramid, value: value});
        break;
    }

   
  }

  handleFile(obj: any){
    this.fc.setValue(obj.data.name);
    this.opnode.params[this.paramid] = obj.id;
    const param = <FileParam> this.ops.getOp(this.opnode.name).params[this.paramid];
    param.process(obj).then(inlets => {
      this.onFileUpload.emit({id: obj.id, data: obj.data, inlets: inlets});

    })
  }


}
