import { Component, OnInit, ViewChild, ElementRef, Output, Input, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UploadService } from '../upload.service';
import { Upload } from '../upload';
import { finalize } from 'rxjs/operators';
import utilInstance from '../../model/util';
import { ImageService } from '../../provider/image.service';

@Component({
  selector: 'upload-form',
  templateUrl: './upload-form.component.html',
  styleUrls: ['./upload-form.component.scss']
})
export class UploadFormComponent implements OnInit {
  @Input() warps: number;
  @Input() type: string;
  progress:number = 0;
  selectedFiles: FileList;
  currentUpload: Upload;
  uploading: boolean = false;
  imageToShow: any;
  downloadid: string;
  @ViewChild('uploadImage') canvas: ElementRef;
  @Output() onData: any = new EventEmitter();

  constructor(private upSvc: UploadService, private httpClient: HttpClient, private imageService: ImageService) { }

  detectFiles(event) {
      this.selectedFiles = event.target.files;
  }

  uploadAda(upload: Upload, file: File){
    this.upSvc.pushUpload(upload).then(snapshot => {
    return this.upSvc.getDownloadData(upload.name)
    }).then(url => {
        
      this.httpClient.get(url).subscribe(data => {
        var obj = {
          name: file.name.split(".")[0],
          data: data,
          type: 'ada',
        }
        console.log(obj);
        this.onData.emit(obj);
      });  

            
    });
  
  }

  async uploadImage(upload: Upload, file: File){
     await this.upSvc.pushUpload(upload).then(snapshot => {
      return  this.imageService.loadFiles([upload.name]);
    }).then(uploaded => {
      const obj = this.imageService.getImageData(upload.name);
      this.onData.emit(obj);
    }); 
  }


  uploadSingle() {

    this.uploading = true;

    let file:File = this.selectedFiles.item(0)
    let fileType = file.name.split(".").pop();
   const upload = new Upload(file);


    switch(fileType){
      case 'ada':
        this.uploadAda(upload, file);
      break;

      case 'jpg':
      case 'bmp':
      case 'png':

      this.uploadImage(upload, file);
      break;
    }



  }

  ngOnInit() {
  }

}
