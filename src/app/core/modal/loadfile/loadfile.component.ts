import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileService } from '../../provider/file.service';

@Component({
  selector: 'app-loadfile',
  templateUrl: './loadfile.component.html',
  styleUrls: ['./loadfile.component.scss']
})
export class LoadfileComponent {
 
 
 
  constructor(
    private fls: FileService,
    private dialogRef: MatDialogRef<LoadfileComponent>, 
    @Inject(MAT_DIALOG_DATA) private data: any) {
      
  }

  /**
   * this is called on upload of a file from any location
   * @param e 
   */
   async handleFile(e: any) : Promise<any>{

    switch(e.type){
      // case 'image': 
      // return this.fls.loader.bmp(e.name, e.data).then(
      //   res => this.dialogRef.close(res)
      // );
      // case 'wif': 
      //   return this.fls.loader.wif(e.name, e.data)
      //   .then(
      //     res => this.dialogRef.close(res)
      //   );
      
      case 'ada': 
        return this.fls.loader.ada(e.name,-1, '', e.data)
        .then(
          res => this.dialogRef.close(res)
        );

        

    }
  
  }


}
