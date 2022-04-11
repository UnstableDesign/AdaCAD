import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Upload } from './upload';
import { Observable, of } from 'rxjs';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable, UploadMetadata, listAll } from "firebase/storage";
import { AuthService } from '../provider/auth.service';
const httpOptions = {
  headers: new HttpHeaders({
  })
};



@Injectable()
export class UploadService {

   constructor(private auth: AuthService) { }

  private basePath:string = '/uploads';
  uploadProgress: Observable<number>;
  progress: number;
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


  getHash(upload: Upload) : Promise<string>{
    let file = upload.file;
    
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
     
      reader.onload = function (event) {
        let data = event.target.result;
        let ret: any = data;
        if (data) {
          let uintArBuff = new Uint8Array(ret);   //Does an array buffer convert to a Uint8Array?
            crypto.subtle.digest('SHA-1', uintArBuff).then(data => {
              var base64 = btoa(
                new Uint8Array(data)
                  .reduce((data, byte) => data + String.fromCharCode(byte), '')
              );
              resolve(base64);
            }
          );
        }else{
            reject('null')
        }  
      }
      reader.readAsArrayBuffer(file);

      });
  }

  

  uploadData(id: string, upload: Upload, metadata: UploadMetadata){
      const storage = getStorage();
      const storageRef = ref(storage, 'uploads/'+id);
      console.log("upload data" , upload);
      const uploadTask = uploadBytesResumable(storageRef, upload.file, metadata);

      uploadTask
      .on('state_changed', (snapshot) => {
          // Observe state change events such as progress, pause, and resume
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          this.progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + this.progress + '% done');
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        (error) => {
          console.error(error);
        },
        () => {
          
        });

    return uploadBytes(storageRef, upload.file, metadata).then((snapshot) => {
      return snapshot;
    }).catch(console.error); //error on get hash
  }

  


  /**
   * runs checks and, if cleared, pushes the upload to the firebase storage server
   * @param upload the upload data
   * @returns Promise of the result of firebase's upload task, snapshot of the file
   */
  pushUpload(upload: Upload) : Promise<any> {
   
    //const id = Math.random().toString(36).substring(2);
    let id = '';
    let metadata: UploadMetadata = null;
    return this.getHash(upload)
    .then(hash => {
      id = hash;
      upload.name = id;
      metadata  = {
        customMetadata: {user: this.auth.uid, filename: upload.file.name} 
      };

      return this.alreadyLoaded(id);
    })
    .then(already_loaded => {
      if(!already_loaded){
        return this.uploadData(id, upload, metadata);
      }
    }).catch(console.error);
     
  }

  getDownloadData(id: string) : Promise<any> {
    console.log('getdownload data for', id)
    const storage = getStorage();
    if(id === 'noinput') return Promise.resolve('');
    return getDownloadURL(ref(storage, 'uploads/'+id))
      .then((url) => {
        console.log("url", url)
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = (event) => {
          const blob = xhr.response;
        };
        xhr.open('GET', url);
        xhr.send();
        return Promise.resolve(url);
      })
      .catch((error) => {
        
        // A full list of error codes is available at
    // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
          case 'storage/object-not-found':
            console.error("file does not exist")
            Promise.reject("not found");
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

  alreadyLoaded(id) : Promise<boolean> {
    const storage = getStorage();
    if(id === 'noinput') return Promise.resolve(false);
    
    return getDownloadURL(ref(storage, 'uploads/'+id))
      .then((url) => {
        return Promise.resolve(true);
      })
      .catch((error) => {

        switch (error.code) {
          case 'storage/object-not-found':
            console.error("file does not exist")
            return Promise.resolve(false);
            break;
          case 'storage/unauthorized':
            console.error("not authorized")
            // User doesn't have permission to access the object
            return Promise.resolve(false);
            break;
          case 'storage/canceled':
            // User canceled the upload
            console.error("canceled")
            return Promise.resolve(false);
            break;

        
          case 'storage/unknown':
            // Unknown error occurred, inspect the server response
            console.error('unknown')
            return Promise.resolve(false);

            break;

          default: 
          console.error("unhandled error", error.code);
          return Promise.resolve(false);

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
