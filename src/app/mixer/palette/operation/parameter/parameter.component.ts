import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, UntypedFormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { shareReplay } from 'rxjs/operators';
import { BoolParam, FileParam, NotationTypeParam, NumParam, OpNode, SelectParam, StringParam } from '../../../../core/model/datatypes';
import { OperationDescriptionsService } from '../../../../core/provider/operation-descriptions.service';
import { OperationService } from '../../../../core/provider/operation.service';
import { TreeService } from '../../../../core/provider/tree.service';


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
  
  fc: UntypedFormControl;
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
          this.fc = new UntypedFormControl(this.param.value);
          break;

        case 'boolean':
          this.boolparam = <BoolParam> this.param;
          this.fc = new UntypedFormControl(this.param.value);
          break;

        case 'select':
          
          this.selectparam = <SelectParam> this.param;
          this.fc = new UntypedFormControl(this.param.value);
          break;

        case 'file':
          this.fileparam = <FileParam> this.param;
          this.fc = new UntypedFormControl(this.param.value);
          break;

        case 'string':
          this.stringparam = <StringParam> this.param;
          this.fc = new UntypedFormControl(this.stringparam.value, [Validators.required, regexValidator((<StringParam>this.param).regex)]);
          break;

        case 'notation_toggle':
          this.boolparam = <NotationTypeParam> this.param;
          this.fc = new UntypedFormControl(this.param.value);
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

      case 'notation_toggle':
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

  /**
   * this is called by the upload services "On Data function" which uploads and analyzes the image data in the image and returns it as a image data object
   * @param obj 
   */
  handleFile(obj: any){


    this.opnode.params[this.paramid] = {id: obj[0].id, data: obj[0]};
    this.onOperationParamChange.emit({id: this.paramid, value: this.opnode.params[this.paramid]});
    this.fc.setValue(obj[0].name);
  }


}
