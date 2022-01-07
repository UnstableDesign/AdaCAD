import { Injectable } from '@angular/core';
import { HttpResponse, HttpClient, HttpHeaders } from '@angular/common/http';
import { Upload } from './upload';
import { Observable, of } from 'rxjs';
import { map as httpmap } from 'rxjs/operators';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const httpOptions = {
  headers: new HttpHeaders({
  })
};

@Injectable()
export class UploadService {

   constructor() { }

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


  pushUpload(upload: Upload) : Promise<any> {
    const id = Math.random().toString(36).substring(2);
    console.log("push upload", upload);

    const storage = getStorage();
    const storageRef = ref(storage, 'uploads/'+id);

    return uploadBytes(storageRef, upload.file).then((snapshot) => {
      console.log('Uploaded');
      upload.name = id;
      return snapshot;
    });
  
  
  // this.uploadProgress = uploadTask.();

  //    this.uploadProgress.subscribe((p) => {
  //     upload.progress = p;
  //   });


    //LD - Right now we're just writing an ID to the database, not sure why
    // const id = Math.random().toString(36).substring(2);
    // // let storageRef = this.st.ref(id);
    // let uploadTask = storageRef.put(upload.file);


    // this.uploadProgress = uploadTask.percentageChanges();

    // this.uploadProgress.subscribe((p) => {
    //   upload.progress = p;
    // });

    // upload.name = id;

     
  }

  getDownloadData(id) : Promise<any> {
    const storage = getStorage();
    return getDownloadURL(ref(storage, 'uploads/'+id))
      .then((url) => {

        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = (event) => {
          const blob = xhr.response;
        };
        xhr.open('GET', url);
        xhr.send();
        console.log("Got download URL")
        return url;
      })
      .catch((error) => {

        console.error(error);

        // A full list of error codes is available at
    // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
          case 'storage/object-not-found':
            console.error("file does not exist")
            break;
          case 'storage/unauthorized':
            console.error("not authorized")
            // User doesn't have permission to access the object
            break;
          case 'storage/canceled':
            // User canceled the upload
            console.error("canceled")

            break;

          // ...

          case 'storage/unknown':
            // Unknown error occurred, inspect the server response
            console.error('unknown')
            break;

          default: 
          console.error("unhandled error", error.code);
      }
    });
  }


  deleteUpload(upload: Upload) {
 
    const storage = getStorage();

    // Create a reference to the file to delete
    const desertRef = ref(storage, 'uploads/'+upload.name);
    
    // Delete the file
    deleteObject(desertRef).then(() => {
      console.log("file deleted");
    }).catch((error) => {
      // Uh-oh, an error occurred!
    });


  }

}
