import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { getDatabase, child, ref as fbref, set as fbset, onValue, query, orderByChild, ref, get } from '@angular/fire/database';
import { getAuth } from "firebase/auth";
import { Observable, Observer } from 'rxjs';


/**
 * users{
 *  uid: 
 *    ada:
 *    timestamp: 
 *    tree: 
 *    
 *  }
 * 
 * 
 * filemeta{
 *  file_id: 
 *  name: 
 *  timestamp: 
 *  owner: 
 *  desc:
 * }
 * 
 * filedata{
 *  file_id: 
 *  data: 
 * }
 * 
 */


@Injectable({
  providedIn: 'root'
})
export class FilesystemService {

  file_tree: Array<any> = [];

  constructor(public auth: AuthService) {

  }

  /**
   * called from auth when hte status changes
   */
  updateUserFiles(userId: any){


    const dbRef = ref(getDatabase());
    get(child(dbRef, `users/${userId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        console.log(snapshot.val());

        const tree = snapshot.val().tree;
        tree.forEach(id => {

          let tree_obj = {
            id: id,
            meta: null
          }
          
          //get the file metadata
          get(child(dbRef, `filemeta/${id}`)).then((meta_snapshot) => {
            if (meta_snapshot.exists()) {
              console.log(meta_snapshot.val());
              tree_obj.meta = meta_snapshot.val();

              if(meta_snapshot.val().timestamp !== undefined){
                var dateFormat = new Date(meta_snapshot.val().timestamp);
                tree_obj.meta.timestamp = dateFormat.toLocaleDateString();
                console.log(  tree_obj.meta.timestamp)
              }
              
            } else {
              console.log("No filemetadata available at ", id);
            }
          }).catch((error) => {
            console.error(error);
          });
          this.file_tree.push(tree_obj);

        })






      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });


    console.log("filetree", this.file_tree)
    
    
    
  }

  validateWriteData(cur_state: any) : any {
    return cur_state;
  }

 

   /**
   * this writes the most current state of the program to the user's entry to the realtime database
   * @param cur_state returned from file saver, constains the JSON string of the file as well as the obj
   * @returns 
   */
   public writeUserData(cur_state: any) {

    if(this.auth.uid === undefined) return;

    cur_state = this.validateWriteData(cur_state)
  
  }

  public writeFileData(file_id: number, name: string, desc: string, cur_state: any) {

    if(this.auth.uid === undefined) return;
    const db = getDatabase();
    fbset(fbref(db, 'users/' + this.auth.uid), {
      timestamp: Date.now(),
      ada: cur_state,
      tree: [file_id],
      filedata: {id: file_id}
    }).catch(console.error);


    fbset(fbref(db, 'filedata/' + file_id), {
      ada: cur_state
    }).catch(console.error);

    fbset(fbref(db, 'filemeta/' + file_id), {
      name: name,
      timestamp: Date.now(),
      owner: this.auth.uid, 
      desc: desc
    }).catch(console.error);
  }


  getFileSystem(uid: string){
    //get uid; 
    //organize into nested array
  }

  createFolder(path: string){

    //write to u_id: filesys
    //make a unique id
    //write it

  }

  deleteFolder(loc: string){

  }

  renameFolder(old_loc: string, new_name: string) : Promise<boolean>{
    //all folders
    return Promise.resolve(true);
  }

  createFile(path: string, name: string){
    //make unique id 
    //write it to file data

    //write it to the users file list
  }

  moveFile(path_from: string, path_to:string){

  }

  getFile(path: string){
    //get the file id
    //retreive it from filedata
    //validate by UID
  }

  deleteFile(path:string){

  }

  renameFile(path:string){
    
  }

  
}



