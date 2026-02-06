import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';
import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, UntypedFormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatOption } from '@angular/material/autocomplete';
import { MatButton, MatFabButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { AnalyzedImage, BoolParam, CodeParam, CanvasParam, FileParam, Img, NumParam, OpParamValType, SelectParam, StringParam, findOrCreateMaterialByHex } from 'adacad-drafting-lib';
import { MediaInstance, OpNode, OpStateParamChange } from '../../../../core/model/datatypes';
import { MediaService } from '../../../../core/provider/media.service';
import { OperationService } from '../../../../core/provider/operation.service';
import { StateService } from '../../../../core/provider/state.service';
import { TreeService } from '../../../../core/provider/tree.service';
import { ImageeditorComponent } from '../../../../core/ui/imageeditor/imageeditor.component';
import { TextparamComponent } from '../../../../core/ui/textparam/textparam.component';
import { UploadFormComponent } from '../../../../core/ui/uploads/upload-form/upload-form.component';
import { MaterialsService } from '../../../../core/provider/materials.service';
import * as p5 from 'p5';

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
export class ParameterComponent implements OnInit, AfterViewInit, OnDestroy {
  tree = inject(TreeService);
  ss = inject(StateService);
  dialog = inject(MatDialog);
  ops = inject(OperationService);
  mediaService = inject(MediaService);
  materialsService = inject(MaterialsService);


  fc: UntypedFormControl;
  opnode: OpNode;

  name: any;

  @Input() param: NumParam | StringParam | SelectParam | BoolParam | FileParam | CodeParam | CanvasParam;
  @Input() opid: number;
  @Input() paramid: number;
  @Output() onOperationParamChange = new EventEmitter<any>();
  @Output() onFileUpload = new EventEmitter<any>();
  @Output() preventDrag = new EventEmitter<any>();

  fromUser: boolean = true;

  has_image_uploaded: boolean = false;
  filewarning: string = '';

  @ViewChild('autosize') autosize: CdkTextareaAutosize;
  @ViewChild('p5canvasContainer') p5canvasContainer: ElementRef;


  private p5Instance: any;

  ngOnInit(): void {



    this.opnode = this.tree.getOpNode(this.opid);


    switch (this.param.type) {
      case 'number':
        this.fc = new UntypedFormControl(

          this.opnode.params[this.paramid] ?? this.param.value,
          [
            Validators.required,
            Validators.min((<NumParam>this.param).min),
            Validators.max((<NumParam>this.param).max),
          ]);
        this.fc.valueChanges.subscribe(val => {
          if (this.fc.valid) {
            this.onParamChange(val);
          }

        });
        break;

      case 'boolean':
        this.fc = new UntypedFormControl(
          this.opnode.params[this.paramid] ?? this.param.value);
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
        this.has_image_uploaded = (<Img>this.opnode.params[this.paramid]).data !== null;
        console.log("FILE PARAM ", this.opnode.params[this.paramid], this.param.value);
        console.log("MEDIA SERVICE CONTAINS ", this.mediaService.current.slice());
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
      case 'p5-canvas':
        this.param = <CanvasParam>this.param;
        this.fc = new UntypedFormControl(this.param.value);
        //ADD ON CHANGE CODE
        this.fc.valueChanges.subscribe(val => {
          this.onParamChange(val);
        });
        break;

      // case 'draft':
      //   this.draftparam = <DraftParam> this.param;
      //   this.fc = new FormControl(this.draftparam.value);
      //   break;


    }






  }

  ngAfterViewInit() {
    // Initialize canvas if needed
    if (this.param.type === 'p5-canvas' && this.p5canvasContainer) {
      // Fetch initial param value from the opnode
      const op = this.ops.getOp(this.opnode.name);

      if (op === null || op === undefined) return Promise.reject("Operation is null")

      const initialParamVals = op.params.map((param, ndx) => {
        return {
          param: param,
          val: this.opnode.params[ndx]
        }
      })

      // Wait for next tick to ensure ViewChild is available
      // Fetch the initial state for the first load - This determines the initial config
      if (!initialParamVals) {
        console.error(`[ParameterComponent ${this.opid}] Could not get initial param value in ngAfterViewInit.`);
        return;
      }

      setTimeout(() => this.initializeP5Canvas(initialParamVals), 0);
    }
  }

  ngOnDestroy() {
    // Clean up p5 instance if it exists
    if (this.p5Instance) {
      this.p5Instance.remove();
    }
  }



  // _updateString(val: string) {
  //   this.refresh_dirty = false;
  //   this.onParamChange(val);
  //   return val;
  // }



  setValueFromStateEvent(value: OpParamValType) {
    console.log("SET VALUE FROM STATE ", value)
    this.fromUser = false;

    if (this.param.type === 'file') {
      if (value !== null) {
        this.addImageFromStateChange(<Img>value)
      } else {
        this.replaceImage();
      }
    } else {
      this.fc.setValue(value);

    }


  }


  addImageFromStateChange(value: Img) {
    const instance = this.mediaService.addIndexColorMediaInstance(
      +value.id,
      'reloaded media item',
      <AnalyzedImage>value.data
    )
    this.handleFile([instance])
  }

  /**
 * changes the view and updates the tree with the new value
 * @param value 
 */
  onParamChange(value: any) {


    const opnode: OpNode = <OpNode>this.tree.getNode(this.opid);

    const change: OpStateParamChange = {
      originator: 'OP',
      type: 'PARAM_CHANGE',
      opid: this.opid,
      paramid: this.paramid,
      before: opnode.params[this.paramid],
      after: value
    }
    if (this.fromUser) this.ss.addStateChange(change);
    this.fromUser = true;

    switch (this.param.type) {

      case 'file':
        if (value == null) value = 1;
        opnode.params[this.paramid] = value;
        this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });
        break;

      case 'number':
        opnode.params[this.paramid] = value;
        this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });

        break;

      case 'boolean':
        if (value == null) value = false;
        opnode.params[this.paramid] = (value) ? 1 : 0;
        this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });
        break;

      case 'string':
        if (value == null) value = '';
        opnode.params[this.paramid] = value;
        if (!this.fc.hasError('pattern')) this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });
        break;

      case 'select':
        if (value == null) value = 0;
        opnode.params[this.paramid] = value;
        this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });
        break;

      case 'draft':
        opnode.params[this.paramid] = value;
        this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });
        break;

      case 'p5-canvas':
        opnode.params[this.paramid] = value;
        this.onOperationParamChange.emit({ id: this.paramid, value: value, type: this.param.type });
        break;
    }


  }

  openTextEditor() {

    const opnode = this.tree.getOpNode(this.opid);

    const dialogRef = this.dialog.open(TextparamComponent, { data: { val: opnode.params[this.paramid], param: this.param } });

    dialogRef.componentInstance.onUpdate.subscribe(text => {
      this.onParamChange(text);
    });

    dialogRef.afterClosed().subscribe(text => {
      this.onParamChange(text);
    });
  }


  async openImageEditor() {

    const opnode = this.tree.getOpNode(this.opid);
    let obj: MediaInstance = this.mediaService.getMedia(+(<Img>opnode.params[this.paramid]).id);
    console.log("MEDIA SERVICE CONTAINS ", obj, this.mediaService.current.slice(), opnode.params[this.paramid]);


    if (obj === undefined || obj === null) return;


    const dialogRef = this.dialog.open(ImageeditorComponent, { data: { media_id: obj.id, src: this.opnode.name } });
    dialogRef.afterClosed().subscribe(nothing => {

      let updated_media = this.mediaService.getMedia(+(<Img>this.opnode.params[this.paramid]).id)
      this.onParamChange({ id: (<Img>this.opnode.params[this.paramid]).id, data: <AnalyzedImage>updated_media.img });
    });
  }

  handleError(err: any) {
    this.filewarning = err;

  }

  replaceImage() {

    const opnode: OpNode = <OpNode>this.tree.getNode(this.opid);

    const img: Img = <Img>opnode.params[this.paramid];

    const change: OpStateParamChange = {
      originator: 'OP',
      type: 'PARAM_CHANGE',
      opid: this.opid,
      paramid: this.paramid,
      before: img,
      after: null
    }

    if (this.fromUser) this.ss.addStateChange(change);
    this.fromUser = true;

    this.has_image_uploaded = false;

    this.mediaService.removeInstance(+img.id)
    this.opnode.params[this.paramid] = { id: '0', data: null as AnalyzedImage };
    this.onOperationParamChange.emit({ id: this.paramid, value: this.opnode.params[this.paramid], type: this.param.type });

  }






  /**
   * this is called by the upload services "On Data function" which uploads and analyzes the image data in the image and returns it as a image data object
   * @param obj 
   */
  handleFile(obj: Array<MediaInstance>) {

    //ADD TEH CHANGE HERE


    this.filewarning = "";
    let img: AnalyzedImage = <AnalyzedImage>obj[0].img;

    this.opnode.params[this.paramid] = { id: obj[0].id.toString(), data: <AnalyzedImage>img };

    const change: OpStateParamChange = {
      originator: 'OP',
      type: 'PARAM_CHANGE',
      opid: this.opid,
      paramid: this.paramid,
      before: null,
      after: this.opnode.params[this.paramid]
    }
    if (this.fromUser) this.ss.addStateChange(change);
    this.fromUser = true;



    this.fc.setValue(img.name);


    if (img.warning !== '') {
      this.filewarning = img.warning;
    } else {
      this.has_image_uploaded = true;
      const opnode = this.tree.getOpNode(this.opid);
      //now update the default parameters to the original size 
      opnode.params[1] = img.width;
      opnode.params[2] = img.height;

    }


    this.onOperationParamChange.emit({ id: this.paramid, value: this.opnode.params[this.paramid] });







  }

  /**
 * Public method called by parent components to explicitly reset the p5 sketch.
 * @param latestConfig The latest configuration object derived from non-canvas params.
 */
  public triggerSketchReset(latestConfig: object): void {
    if (this.param.type === 'p5-canvas') {
      if (!latestConfig) {
        console.error('[ParameterComponent] triggerSketchReset called without latestConfig for op:', this.opid);
        return;
      }

      this._resetSketch(latestConfig);
    }
  }

  /**
   * Private helper to destroy the current p5 instance and re-initialize it
   * with the provided configuration.
   * @param latestConfig The latest configuration object for the sketch.
   */
  private _resetSketch(latestParamVals: object): void {
    if (this.p5Instance) {
      try {
        this.p5Instance.remove();
      } catch (e) {
        console.error('[ParameterComponent] Error removing p5 instance:', e);
      }
      this.p5Instance = null;
    }
    setTimeout(() => this.initializeP5Canvas(latestParamVals), 0);
  }

  initializeP5Canvas(currentParamVals: object) {
    // Setup an interactive p5.js canvas for operations that use it

    if (!this.p5canvasContainer || !this.p5canvasContainer.nativeElement) {
      console.error(`[ParameterComponent ${this.opid}] p5canvasContainer not available.`);
      return;
    }

    if (this.param.type !== 'p5-canvas') {
      console.error(`[ParameterComponent ${this.opid}] This component's own param Input is not type 'p5-canvas'. Type: ${this.param.type}`);
      return;
    }

    const opNodeName = this.tree.getOpNode(this.opid)?.name;
    if (!opNodeName) {
      console.error(`[ParameterComponent ${this.opid}] Could not determine operation name.`);
      return;
    }
    const operationDefinition = this.ops.getOp(opNodeName);

    // If operation provides a sketch function, create the P5 instance
    if (operationDefinition && 'createSketch' in operationDefinition && typeof operationDefinition.createSketch === 'function') {

      const updateCallbackFn = (newCanvasState: any) => {
        // 1. Update the canvasState in the component param value to the newCanvasState
        //    This ensures that if findOrCreateMaterialByHex fails or this logic has an issue,
        //    the raw sketch state is still preserved at a base level.
        this.param.value = newCanvasState;

        // 2. Resolve weft colors used in the sketch to AdaCAD material IDs
        if (this.param.type === 'p5-canvas' &&
          newCanvasState &&
          newCanvasState.generatedDraft &&
          Array.isArray(newCanvasState.generatedDraft.weftColors)) {

          const sketchColors: string[] = newCanvasState.generatedDraft.weftColors;
          const resolvedIds: number[] = [];

          sketchColors.forEach((hexColor, sketchWeftId) => {
            const nameSuggestion = `CrossSection Weft ${String.fromCharCode(97 + sketchWeftId)}`;
            try {
              const materialId = findOrCreateMaterialByHex(hexColor, nameSuggestion, this.materialsService.materials);
              resolvedIds.push(materialId);
            } catch (e) {
              console.error(`Error in findOrCreateMaterialByHex for color ${hexColor} (sketchWeftId: ${sketchWeftId}):`, e);
              resolvedIds.push(0); // Fallback to material ID 0 if service call fails
            }
          });
          newCanvasState.generatedDraft.resolvedSketchMaterialIds = resolvedIds;
        }

        // 3. Emit that a change has occurred to the canvasState
        // Triggers onParamChange, which saves to the tree and notifies the op chain.
        this.onParamChange(newCanvasState);
      };

      // Debounce or ensure cleanup happens correctly if resets are rapid
      if (this.p5Instance) {
        try {
          this.p5Instance.remove();
        } catch (e) {
          console.error("[ParameterComponent] Error removing previous p5 instance:", e);
        }
        this.p5Instance = null;
      }

      const userSketchProvider = operationDefinition.createSketch(currentParamVals, updateCallbackFn);

      // Define the wrapper for p5 instantiation, including the mouse proxy
      const sketchWrapper = (actualP5Instance: any) => {
        this.p5Instance = actualP5Instance; // Store the p5 instance

        // The p5.js canvas is inside an operation that gets scaled by AdaCAD application CSS
        // This makes the mouse coordinates inside a sketch incorrect. This proxy corrects that.
        // It wraps the p5.js instance and intercepts `p.mouseX` and `p.mouseY` and correct them.
        // The error is between the p5 canvas buffer dimensions and the display dimensions.
        const P5MouseProxyHandler: ProxyHandler<any> = {
          get: (target, prop, receiver) => {
            // target: The actual p5 instance.
            // receiver: The proxy instance.

            // Intercept mouseX/Y
            if (prop === 'mouseX') {
              if (!target.canvas || !(target as any)._setupDone) {
                const unscaledFallbackX = Reflect.get(target, 'mouseX', receiver); // Get actual p5.mouseX
                return typeof unscaledFallbackX === 'number' ? unscaledFallbackX : 0;
              }
              const rect = target.canvas.getBoundingClientRect();
              const unscaledMouseX = Reflect.get(target, 'mouseX', receiver); // Get actual p5.mouseX value
              if (rect.width > 0 && target.width > 0 && typeof unscaledMouseX === 'number') {
                return unscaledMouseX * (target.width / rect.width);
              }
              return typeof unscaledMouseX === 'number' ? unscaledMouseX : 0;
            }
            if (prop === 'mouseY') {
              if (!target.canvas || !(target as any)._setupDone) {
                const unscaledFallbackY = Reflect.get(target, 'mouseY', receiver);
                return typeof unscaledFallbackY === 'number' ? unscaledFallbackY : 0;
              }
              const rect = target.canvas.getBoundingClientRect();
              const unscaledMouseY = Reflect.get(target, 'mouseY', receiver); // Get actual p5.mouseY value
              if (rect.height > 0 && target.height > 0 && typeof unscaledMouseY === 'number') {
                return unscaledMouseY * (target.height / rect.height);
              }
              return typeof unscaledMouseY === 'number' ? unscaledMouseY : 0;
            }

            // Delegate all other property access to the original p5 instance.
            return Reflect.get(target, prop, receiver);
          },
        };

        // Use the mouse-correcting proxy.
        const proxiedP5Instance = new Proxy(actualP5Instance, P5MouseProxyHandler);
        // userSketchProvider(proxiedP5Instance as unknown as any); --TODO - LD - I can't figure out the error here
      };

      // Instantiate p5 with the wrapper
      new p5.default(sketchWrapper as any, this.p5canvasContainer.nativeElement);

    } else {
      console.error("[ParameterComponent] An operation with p5-canvas type did not provide a valid createSketch function.");
    }
  }




}




