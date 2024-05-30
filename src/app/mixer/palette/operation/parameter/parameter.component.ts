import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormControl, UntypedFormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { BoolParam, CodeParam, FileParam, NotationTypeParam, NumParam, OpNode, SelectParam, StringParam } from '../../../../core/model/datatypes';
import { OperationDescriptionsService } from '../../../../core/provider/operation-descriptions.service';
import { OperationService } from '../../../../core/provider/operation.service';
import { TreeService } from '../../../../core/provider/tree.service';
import { ImageService } from '../../../../core/provider/image.service';
import { map, startWith } from 'rxjs/operators';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import {NgZone} from '@angular/core';
import {take} from 'rxjs/operators';


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
  styleUrls: ['./parameter.component.scss'],
  encapsulation: ViewEncapsulation.None,
  // providers: [
  //   {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline', subscriptSizing: 'dynamic' }}
  // ]
})
export class ParameterComponent implements OnInit {
  
  fc: UntypedFormControl;
  opnode: OpNode;
  name: any;

  @Input() param:  NumParam | StringParam | SelectParam | BoolParam | FileParam | CodeParam;
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
  has_image_preview: boolean = false;
  filewarning: string = '';

  @ViewChild('autosize') autosize: CdkTextareaAutosize;

  constructor(
    public tree: TreeService, 
    public ops: OperationService,
    public op_desc: OperationDescriptionsService,
    public imageService: ImageService,
    private _ngZone: NgZone) { 




  }

  triggerResize() {
    // Wait for changes to be applied, then trigger textarea resize.
    this._ngZone.onStable.pipe(take(1)).subscribe(() => this.autosize.resizeToFitContent(true));
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
         // this.fc = new UntypedFormControl(this.stringparam.value, [Validators.required, Validators.pattern((<StringParam>this.param).regex)]);
          this.fc = new UntypedFormControl(this.stringparam.value, [Validators.required, Validators.pattern((<StringParam>this.param).regex)]);
    
          this.fc.valueChanges.forEach(el => {this._updateString(el.trim())})

    
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

  _updateString(val: string){
    this.onParamChange(val);
    return val;
  }


  /**
   * changes the view and updates the tree with the new value
   * @param value 
   */
  onParamChange(value: any){

    const opnode: OpNode = <OpNode> this.tree.getNode(this.opid);

    switch(this.param.type){
      case 'number': 
       if(value == null) value = 1;
        opnode.params[this.paramid] = value;
        this.fc.setValue(value);
        this.onOperationParamChange.emit({id: this.paramid, value: value, type: this.param.type});
        break;

      case 'boolean':
        if(value == null) value = false;
        opnode.params[this.paramid] = (value) ? 1 : 0;
        this.fc.setValue(value);
        this.onOperationParamChange.emit({id: this.paramid, value: value, type: this.param.type});
        break;

      case 'notation_toggle':
        if(value == null) value = false;
        opnode.params[this.paramid] = (value) ? 1 : 0;
        this.fc.setValue(value);
        this.onOperationParamChange.emit({id: this.paramid, value: value, type: this.param.type});
        break;

      case 'string':
        if(value == null) value = '';
        opnode.params[this.paramid] = value;
        //this.fc.setValue(value); //this is being handled in the form input
        if(!this.fc.hasError('pattern'))this.onOperationParamChange.emit({id: this.paramid, value: value, type: this.param.type});
        break;

      case 'select':
        if(value == null) value = 0;
        opnode.params[this.paramid] = value;
        this.fc.setValue(value);
        this.onOperationParamChange.emit({id: this.paramid, value: value, type: this.param.type});
        break;

      case 'draft':
        opnode.params[this.paramid] = value;
        this.fc.setValue(value);
        this.onOperationParamChange.emit({id: this.paramid, value: value, type: this.param.type});
        break;
    }

   
  }

  handleError(err: any){
    console.log("CAUGHT ERROR", err);
    this.filewarning = err;
    this.clearImagePreview();

  }

  /**
   * this is called by the upload services "On Data function" which uploads and analyzes the image data in the image and returns it as a image data object
   * @param obj 
   */
  handleFile(obj: any){

    this.filewarning = "";

    this.opnode.params[this.paramid] = {id: obj[0].id, data: obj[0]};
    
    this.onOperationParamChange.emit({id: this.paramid, value: this.opnode.params[this.paramid]});
    
    this.fc.setValue(obj[0].name);


    switch(obj.type){
      case 'image':

        if(obj.data.warning !== ''){
            this.filewarning = obj.warning;
        }else{

          const opnode = this.tree.getOpNode(this.opid);
          //now update the default parameters to the original size 
          opnode.params[1] = obj.data.width;
          opnode.params[2] = obj.data.height;
          this.drawImagePreview();

        }
        break;
    }




  }

  drawImagePreview(){

    const opnode = this.tree.getOpNode(this.opid);
    const obj = this.imageService.getImageData(opnode.params[this.paramid].id);

    if(obj === undefined || obj.data == undefined || obj.data.image == null ) return;

      const data = obj.data;

      this.has_image_preview = true;
      const image_div =  document.getElementById('param-image-'+this.opid);
      image_div.style.display = 'flex';

      const dims_div =  document.getElementById('param-image-dims-'+this.opid);
      dims_div.innerHTML=data.width+"px x "+data.height+"px";

      const canvas: HTMLCanvasElement =  <HTMLCanvasElement> document.getElementById('preview_canvas-'+this.opid);
      const ctx = canvas.getContext('2d');

      const max_dim = (data.width > data.height) ? data.width : data.height;
      const use_width = (data.width > 100) ? data.width / max_dim * 100 : data.width;
      const use_height = (data.height > 100) ? data.height / max_dim * 100 : data.height;

      canvas.width = use_width;
      canvas.height = use_height;


      ctx.drawImage(data.image, 0, 0, use_width, use_height);
  

    

  }
  clearImagePreview(){

      this.has_image_preview = false;

      const opnode = this.tree.getOpNode(this.opid);
      const obj = this.imageService.getImageData(opnode.params[this.paramid].id);
  
      if(obj === undefined) return;
  
        const data = obj.data;
  
        const image_div =  document.getElementById('param-image-'+this.opid);
        image_div.style.display = 'none';
  
        const dims_div =  document.getElementById('param-image-dims-'+this.opid);
        dims_div.innerHTML="";
  
        const canvas: HTMLCanvasElement =  <HTMLCanvasElement> document.getElementById('preview_canvas-'+this.opid);
  

        canvas.width = 0;
        canvas.height = 0;
  
  
    
  
  }



}
