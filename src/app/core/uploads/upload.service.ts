import { Injectable } from '@angular/core';
import { HttpResponse, HttpClient, HttpHeaders } from '@angular/common/http';
import { AngularFireAuth } from '@angular/fire/compat/auth';
 import { AngularFireDatabase, AngularFireList } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Upload } from './upload';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import * as firebase from 'firebase/compat/app';

const httpOptions = {
  headers: new HttpHeaders({
  })
};

@Injectable()
export class UploadService {

  constructor(private af: AngularFireAuth, 
              private db: AngularFireDatabase,
              private st: AngularFireStorage,
              private http: HttpClient,
              private httpClient: HttpClient) { }

  private basePath:string = '/uploads';
  uploadProgress: Observable<number>;
  imageToShow: any;

  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
       this.imageToShow = reader.result;
    }, false);

    if (image) {
       reader.readAsDataURL(image);
    }
  }

  pushUpload(upload: Upload) {

    //LD - Right now we're just writing an ID to the database, not sure why
    const id = Math.random().toString(36).substring(2);
    let storageRef = this.st.ref(id);
    let uploadTask = storageRef.put(upload.file);


    this.uploadProgress = uploadTask.percentageChanges();

    this.uploadProgress.subscribe((p) => {
      upload.progress = p;
    });

    upload.name = id;

    this.saveFileData(upload);
    return uploadTask.snapshotChanges();
  }

  getDownloadURL(id) {
    let storageRef = this.st.ref('');
    return storageRef.child(id).getDownloadURL();
  }



  // Writes the file details to the realtime db
  private saveFileData(upload: Upload) {
    // this.db.list(`${this.basePath}/`).push(upload);
  }

  deleteUpload(upload: Upload) {
    // this.deleteFileData(upload.$key)
    // .then( () => {
    //   this.deleteFileStorage(upload.name)
    // })
    // .catch(error => console.log(error))
  }

  // Deletes the file details from the realtime db
  private deleteFileData(key: string) {
    return this.db.list(`${this.basePath}/`).remove(key);
  }

  // Firebase files must have unique names in their respective storage dir
  // So the name serves as a unique key
  private deleteFileStorage(name:string) {
    // let storageRef = this.st.ref(name);
    // storageRef.child(`${this.basePath}/${name}`).delete()
  }
}
