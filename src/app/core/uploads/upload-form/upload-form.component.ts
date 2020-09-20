import { Component, OnInit, ViewChild, ElementRef, Output, Input, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UploadService } from '../upload.service';
import { Upload } from '../upload';
import * as _ from "lodash";
import * as d3 from 'd3';
import { map } from 'rxjs/operators';

@Component({
  selector: 'upload-form',
  templateUrl: './upload-form.component.html',
  styleUrls: ['./upload-form.component.scss']
})
export class UploadFormComponent implements OnInit {
  @Input() warps: number;
  @Input() type: string;
  selectedFiles: FileList;
  currentUpload: Upload;
  imageToShow: any;
  @ViewChild('uploadImage', {static: false}) canvas: ElementRef;
  @Output() onData: any = new EventEmitter();

  constructor(private upSvc: UploadService, private httpClient: HttpClient) { }

  detectFiles(event) {
      this.selectedFiles = event.target.files;
  }

  

  uploadSingle() {
    let file = this.selectedFiles.item(0)
    let fileType = file.name.split(".").pop();
    this.currentUpload = new Upload(file);
    var p, id;
    p = this.upSvc.pushUpload(this.currentUpload);

    p.subscribe((e) => {
      var progress = this.currentUpload.progress;
      if (progress && progress === 100) {
        if (fileType != "ada") {
          this.upSvc.getDownloadURL(this.currentUpload.name).subscribe((url) => {
            var image = new Image();
            image.src = url;
            image.crossOrigin = "Anonymous";

            var canvas = this.canvas.nativeElement;
            var ctx = canvas.getContext('2d');

            image.onload = (() => {
              if (this.type === "shuttle") {
                canvas.width = this.warps;
                canvas.height = image.naturalHeight * (this.warps / image.naturalWidth);
              }
              else if (this.type === "init") {
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
              }
              
              
              ctx.mozImageSmoothingEnabled = false;
              ctx.webkitImageSmoothingEnabled = false;
              ctx.msImageSmoothingEnabled = false;
              ctx.imageSmoothingEnabled = false;

              ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

              var data = ctx.getImageData(0,0, canvas.width, canvas.height);
              var obj = {
                data: data,
                type: 'image',
              }
              this.onData.emit(obj);
            });
          });
        }
        else if (fileType === "ada") {
          this.upSvc.getDownloadURL(this.currentUpload.name).subscribe((url) => {
            this.httpClient.get(url).subscribe(data => {
              var obj = {
                data: data,
                type: 'ada',
              }
              this.onData.emit(obj);
            });
          });
        }
      }
    });
  }

  ngOnInit() {
  }

}
