import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { getAnalytics, logEvent } from "@angular/fire/analytics";
import { AuthService } from '../../provider/auth.service';
import { FileService } from '../../provider/file.service';
import { ExampleserviceService } from '../../provider/exampleservice.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FilebrowserComponent } from '../../ui/filebrowser/filebrowser.component';
import { FilesystemService } from '../../provider/filesystem.service';

@Component({
  selector: 'app-examples',
  templateUrl: './examples.component.html',
  styleUrls: ['./examples.component.scss']
})
export class ExamplesComponent {
  @Output() onLoadExample = new EventEmitter <any>(); 
  local_examples: any;
  community_examples: any;


  constructor(
    public fs: FilesystemService,
    public examples: ExampleserviceService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ExamplesComponent>) {
      
      this.local_examples = examples.getExamples();
    

      console.log("PUBLIC FILES:", this.fs.public_files)
      this.fs.public_file_change$.subscribe(data => {
        this.community_examples = data.slice();
        console.log("COMMUNITY EXAMPLES ", this.community_examples)
      });

  }

  loadExample(filename: string){
    
    this.onLoadExample.emit(filename);
    this.dialogRef.close();
  }

}

