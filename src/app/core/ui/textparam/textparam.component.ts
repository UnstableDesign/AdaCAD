import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StringParam } from 'adacad-drafting-lib';

@Component({
  selector: 'app-textparam',
  imports: [ReactiveFormsModule, MatDialogTitle, MatInputModule, CdkScrollable, MatDialogContent, MatDialogActions, MatButton, MatDialogClose, MatHint, MatLabel, MatFormField],
  templateUrl: './textparam.component.html',
  styleUrl: './textparam.component.scss'
})
export class TextparamComponent {
  //fc: FormControl = new FormControl('');

  private dialogRef = inject<MatDialogRef<TextparamComponent>>(MatDialogRef);
  private data = inject(MAT_DIALOG_DATA);

  stringparam: StringParam;
  value: String;
  fc: FormControl;
  original: String;

  constructor() {
    this.stringparam = <StringParam>this.data.param;
    this.value = <String>this.data.val;
    this.original = this.value;
    console.log("STRING PARAM ", this.data)
    this.fc = new FormControl(this.value, [Validators.required, Validators.pattern(this.stringparam.regex)]);
  }

  save() {
    this.dialogRef.close(this.value);
  }

  close() {
    this.dialogRef.close(this.original);
  }




}
