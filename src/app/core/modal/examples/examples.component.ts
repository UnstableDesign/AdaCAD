import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { getAnalytics, logEvent } from "@angular/fire/analytics";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../../provider/auth.service';
import { FileService } from '../../provider/file.service';

@Component({
  selector: 'app-examples',
  templateUrl: './examples.component.html',
  styleUrls: ['./examples.component.scss']
})
export class ExamplesComponent {


  constructor(
    private fls: FileService,
    private auth: AuthService,
    private http: HttpClient,
    private dialogRef: MatDialogRef<ExamplesComponent>, 
    @Inject(MAT_DIALOG_DATA) private data: any) {
      

  }

  loadExample(filename: string){
    
    const analytics = getAnalytics();
    logEvent(analytics, 'onloadexample', {
      items: [{ uid: this.auth.uid, name: filename }]
    });

    console.log("loading example: ", filename);
    this.http.get('assets/examples/'+filename+".ada", {observe: 'response'}).subscribe((res) => {

      return this.fls.loader.ada(filename, -1, '', res.body)
        .then(
          res => this.dialogRef.close(res)
        );
    }); 
  }


}

