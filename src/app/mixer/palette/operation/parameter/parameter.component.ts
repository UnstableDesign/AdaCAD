import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, UntypedFormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatOption } from '@angular/material/autocomplete';
import { MatButton, MatFabButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { AnalyzedImage, BoolParam, CodeParam, FileParam, NumParam, SelectParam, StringParam } from 'adacad-drafting-lib';
import { IndexedColorImageInstance, OpNode, OpStateParamChange } from '../../../../core/model/datatypes';
import { MediaService } from '../../../../core/provider/media.service';
import { OperationService } from '../../../../core/provider/operation.service';
import { StateService } from '../../../../core/provider/state.service';
import { TreeService } from '../../../../core/provider/tree.service';
import { ImageeditorComponent } from '../../../../core/ui/imageeditor/imageeditor.component';
import { TextparamComponent } from '../../../../core/ui/textparam/textparam.component';
import { UploadFormComponent } from '../../../../core/ui/uploads/upload-form/upload-form.component';


export function regexValidator(nameRe: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const globalRegex = new RegExp(nameRe, 'g');
    const valid = globalRegex.test(control.value);
    return !valid ? { forbiddenInput: { value: control.value } } : null;
  };
}



@Component({
  selector: 'app-parameter',
  templateUrl: './parameter.component.html',
  styleUrls: ['./parameter.component.scss'],
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { floatLabel: 'always' } }
  ],
  imports: [MatFormField, MatFabButton, TextFieldModule, MatLabel, MatInput, FormsModule, ReactiveFormsModule, MatSelect, MatOption, MatButton, UploadFormComponent]
})
export class ParameterComponent implements OnInit {
  tree = inject(TreeService);
  ss = inject(StateService);
  dialog = inject(MatDialog);
  ops = inject(OperationService);
  mediaService = inject(MediaService);


  fc: UntypedFormControl;
  opnode: OpNode;
  name: any;

  @Input() param: NumParam | StringParam | SelectParam | BoolParam | FileParam | CodeParam;
  @Input() opid: number;
  @Input() paramid: number;
  @Output() onOperationParamChange = new EventEmitter<any>();
  @Output() onFileUpload = new EventEmitter<any>();
  @Output() preventDrag = new EventEmitter<any>();



  //you need these to access values unique to each type.


  has_image_uploaded: boolean = false;
  filewarning: string = '';

  @ViewChild('autosize') autosize: CdkTextareaAutosize;


  ngOnInit(): void {

    this.opnode = this.tree.getOpNode(this.opid);


    switch (this.param.type) {
      case 'number':
        console.log("PARAMS ", this.param, this.opnode.params[this.paramid]);
        this.fc = new UntypedFormControl(
          this.opnode.params[this.paramid] ?? this.param.value,
          [
            Validators.required,
            Validators.min((<NumParam>this.param).min),
            Validators.max((<NumParam>this.param).max),
          ]);
        this.fc.valueChanges.subscribe(val => {
          if (this.fc.valid) this.onParamChange(val);
        });
        break;

      case 'boolean':
        this.fc = new UntypedFormControl(this.opnode.params[this.paramid] ?? this.param.value);
        this.fc.valueChanges.subscribe(val => {
          this.onParamChange(val);
        });
        break;

      case 'select':

        this.fc = new UntypedFormControl(this.opnode.params[this.paramid] ?? this.param.value);
        this.fc.valueChanges.subscribe(val => {
          this.onParamChange(val);
        });
        break;

      case 'file':
        this.fc = new UntypedFormControl(this.opnode.params[this.paramid] ?? this.param.value);
        break;

      case 'string':
        const value = this.opnode.params[this.paramid] ?? this.param.value;
        this.fc = new UntypedFormControl(value, [Validators.required, Validators.pattern((<StringParam>this.param).regex)]);
        this.fc.valueChanges.subscribe(val => {
          if (!this.fc.hasError('pattern')) {
            this.onParamChange(val);
          }
        });
        break;


      // case 'draft':
      //   this.draftparam = <DraftParam> this.param;
      //   this.fc = new FormControl(this.draftparam.value);
      //   break;


    }






  }


  // _updateString(val: string) {
  //   this.refresh_dirty = false;
  //   this.onParamChange(val);
  //   return val;
  // }

  /**
   * changes the view and updates the tree with the new value
   * @param value 
   */
  onParamChange(value: any) {

    console.log("VALUE ON CHANGE ", value)

    const opnode: OpNode = <OpNode>this.tree.getNode(this.opid);

    switch (this.param.type) {

      case 'file':
        if (value == null) value = 1;
        opnode.params[this.paramid] = value;
        //this.fc.setValue(value);
        this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });
        break;

      case 'number':

        const change: OpStateParamChange = {
          originator: 'OP',
          type: 'PARAM_CHANGE',
          before: opnode.params[this.paramid],
          after: value
        }

        this.ss.addStateChange(change);

        opnode.params[this.paramid] = value;
        this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });

        break;

      case 'boolean':
        if (value == null) value = false;
        opnode.params[this.paramid] = (value) ? 1 : 0;
        this.fc.setValue(value);
        this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });
        break;

      case 'string':
        if (value == null) value = '';
        opnode.params[this.paramid] = value;
        //this.fc.setValue(value); //this is being handled in the form input
        if (!this.fc.hasError('pattern')) this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });
        break;

      case 'select':
        if (value == null) value = 0;
        opnode.params[this.paramid] = value;
        this.fc.setValue(value);
        this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });
        break;

      case 'draft':
        opnode.params[this.paramid] = value;
        this.fc.setValue(value);
        this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });
        break;
    }


  }

  openTextEditor() {

    const opnode = this.tree.getOpNode(this.opid);

    const dialogRef = this.dialog.open(TextparamComponent, { data: { val: opnode.params[this.paramid], param: this.param } });
    dialogRef.afterClosed().subscribe(text => {
      this.onParamChange(text);
    });
  }


  openImageEditor() {

    const opnode = this.tree.getOpNode(this.opid);
    const obj = <IndexedColorImageInstance>this.mediaService.getMedia(opnode.params[this.paramid].id);

    if (obj === undefined || obj.img == undefined || obj.img.image == null) return;

    const dialogRef = this.dialog.open(ImageeditorComponent, { data: { media_id: obj.id, src: this.opnode.name } });
    dialogRef.afterClosed().subscribe(nothing => {

      let updated_media = <IndexedColorImageInstance>this.mediaService.getMedia(this.opnode.params[this.paramid].id)
      this.onParamChange({ id: this.opnode.params[this.paramid].id, data: updated_media.img });
    });
  }

  handleError(err: any) {
    this.filewarning = err;
    this.clearImagePreview();

  }

  replaceImage() {
    this.clearImagePreview();
    const opnode = this.tree.getOpNode(this.opid);
    this.mediaService.removeInstance(opnode.params[this.paramid].id)
    this.opnode.params[this.paramid] = { id: '' };
    this.onOperationParamChange.emit({ id: this.paramid, value: this.opnode.params[this.paramid], type: this.param.type });

  }




  /**
   * this is called by the upload services "On Data function" which uploads and analyzes the image data in the image and returns it as a image data object
   * @param obj 
   */
  handleFile(obj: Array<IndexedColorImageInstance>) {

    this.filewarning = "";
    let img: AnalyzedImage = obj[0].img;

    this.opnode.params[this.paramid] = { id: obj[0].id, data: img };
    this.onOperationParamChange.emit({ id: this.paramid, value: this.opnode.params[this.paramid] });

    this.fc.setValue(img.name);

    if (img.warning !== '') {
      this.filewarning = img.warning;
    } else {

      const opnode = this.tree.getOpNode(this.opid);
      //now update the default parameters to the original size 
      opnode.params[1] = img.width;
      opnode.params[2] = img.height;

      this.drawImagePreview();

    }





  }

  drawImagePreview() {


    //check if the image has been removed
    const opnode = this.tree.getOpNode(this.opid);
    if (opnode.params[this.paramid].id == '') {
      this.clearImagePreview();
      return;
    }

    const obj = <IndexedColorImageInstance>this.mediaService.getMedia(opnode.params[this.paramid].id);

    if (obj === null || obj.img == null || obj.img.image == null) return;

    this.has_image_uploaded = true;


    //   const data = obj.data;

    //   this.has_image_preview = true;
    //   const image_div =  document.getElementById('param-image-'+this.opid);
    //   image_div.style.display = 'flex';

    //   const dims_div =  document.getElementById('param-image-dims-'+this.opid);
    //   dims_div.innerHTML=data.width+"px x "+data.height+"px";

    //   const canvas: HTMLCanvasElement =  <HTMLCanvasElement> document.getElementById('preview_canvas-'+this.opid);
    //   const ctx = canvas.getContext('2d');

    //   const max_dim = (data.width > data.height) ? data.width : data.height;
    //   const use_width = (data.width > 100) ? data.width / max_dim * 100 : data.width;
    //   const use_height = (data.height > 100) ? data.height / max_dim * 100 : data.height;

    //   canvas.width = use_width;
    //   canvas.height = use_height;


    //   ctx.drawImage(data.image, 0, 0, use_width, use_height);




  }


  clearImagePreview() {

    this.has_image_uploaded = false;

    // const opnode = this.tree.getOpNode(this.opid);
    // const obj = this.imageService.getImageData(opnode.params[this.paramid].id);

    // if(obj === undefined) return;

    //   const data = obj.data;

    //   const image_div =  document.getElementById('param-image-'+this.opid);
    //   image_div.style.display = 'none';

    //   const dims_div =  document.getElementById('param-image-dims-'+this.opid);
    //   dims_div.innerHTML="";

    //   const canvas: HTMLCanvasElement =  <HTMLCanvasElement> document.getElementById('preview_canvas-'+this.opid);


    //   canvas.width = 0;
    //   canvas.height = 0;




  }



}
