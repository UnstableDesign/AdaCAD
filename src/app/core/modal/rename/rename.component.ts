import { Component, Inject, SimpleChanges } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { TreeService } from '../../provider/tree.service';
import { Draft } from '../../model/datatypes';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-rename',
    templateUrl: './rename.component.html',
    styleUrl: './rename.component.scss',
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatLabel, MatInput, FormsModule, MatHint, MatDialogActions, MatButton, MatDialogClose]
})
export class RenameComponent {

  id: number;
  ud_name: string;
  gen_name: string;
  draft:Draft = null
 constructor(
    private tree: TreeService, 
    private dialogRef: MatDialogRef<RenameComponent>, 
    @Inject(MAT_DIALOG_DATA) private data: any) {
      
      this.id = data.id;
      this.draft = this.tree.getDraft(this.id);
      this.ud_name = this.draft.ud_name;
      this.gen_name = this.draft.gen_name; 

      
    
    
    }

    change(event: SimpleChanges){
      this.draft.ud_name = this.ud_name;
      this.tree.setDraftOnly(this.id, this.draft);
    }

}
