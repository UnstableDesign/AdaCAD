import { Component, Inject, SimpleChanges } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { TreeService } from '../../provider/tree.service';
import { Draft } from '../../model/datatypes';

@Component({
  selector: 'app-rename',
  standalone: false,
  templateUrl: './rename.component.html',
  styleUrl: './rename.component.scss'
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
