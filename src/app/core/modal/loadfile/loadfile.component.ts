import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileService } from '../../provider/file.service';

@Component({
  selector: 'app-loadfile',
  templateUrl: './loadfile.component.html',
  styleUrls: ['./loadfile.component.scss']
})
export class LoadfileComponent {
 
 
  multiple: boolean = false;
  accepts: string = '';
  type: string = ''; //'single_image', 'ada', or 'bitmap_collection'
  title: string = 'Select Files'
  errorstring: string = '';

  constructor(
    private fls: FileService,
    private dialogRef: MatDialogRef<LoadfileComponent>, 
    @Inject(MAT_DIALOG_DATA) private data: any) {

      this.multiple = data.multiple;
      this.accepts = data.accepts;
      this.type = data.type;
      if(data.title !== undefined) this.title = data.title;
      
  }

  handleError(e: any){
      this.errorstring = e;
  }

  /**
   * this is called on upload of a file from any location
   * @param e 
   */
   async handleFile(e: any) : Promise<any>{
    this.errorstring = '';
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

      case 'bitmap_collection':
        this.dialogRef.close(e.drafts)
        break;

      
      case 'ada': 
      
        return this.fls.loader.ada(e.name,'upload',-1, '', e.data, '')
        .then(
          res => this.dialogRef.close(res)
        );

        

    }
  
  }


}
