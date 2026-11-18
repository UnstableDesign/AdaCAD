import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-saveas',
  templateUrl: './saveas.component.html',
  styleUrl: './saveas.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatDialogTitle, ReactiveFormsModule, CdkScrollable, MatDialogContent, MatFormField, MatLabel, MatInput, MatDialogActions, MatButton]
})
export class SaveAsComponent implements OnInit {
  private dialogRef = inject<MatDialogRef<SaveAsComponent, string>>(MatDialogRef);
  private data = inject<{ name: string }>(MAT_DIALOG_DATA);

  nameForm = new FormControl('', [Validators.required, Validators.minLength(1)]);
  private default_name = '';

  constructor() {
    this.dialogRef.disableClose = true;
    this.dialogRef.backdropClick().subscribe(() => this.closeWithName());
    this.dialogRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        this.closeWithName();
      }
    });
  }

  ngOnInit() {
    this.default_name = this.data.name ?? '';
    this.nameForm.setValue(this.default_name, { emitEvent: false });
  }

  save() {
    this.closeWithName();
  }

  close() {
    this.closeWithName();
  }

  private closeWithName() {
    const trimmed = (this.nameForm.value ?? '').trim();
    this.dialogRef.close(trimmed.length > 0 ? trimmed : this.default_name);
  }
}
