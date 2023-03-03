import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { getAnalytics, logEvent } from "@angular/fire/analytics";
import { AuthService } from '../../provider/auth.service';
import { FileService } from '../../provider/file.service';

@Component({
  selector: 'app-examples',
  templateUrl: './examples.component.html',
  styleUrls: ['./examples.component.scss']
})
export class ExamplesComponent {
  @Output() onLoadExample = new EventEmitter <any>(); 


  constructor(
    private fls: FileService,
    private auth: AuthService,
    private http: HttpClient) {
      

  }

  loadExample(filename: string){
    
    const analytics = getAnalytics();
    logEvent(analytics, 'onloadexample', {
      items: [{ uid: this.auth.uid, name: filename }]
    });

    this.http.get('assets/examples/'+filename+".ada", {observe: 'response'}).subscribe((res) => {

      return this.fls.loader.ada(filename, -1, '', res.body)
        .then(res => {
          this.onLoadExample.emit(res);
          return;
        }
        );
    }); 
  }


}

