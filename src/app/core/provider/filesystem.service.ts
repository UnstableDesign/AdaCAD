import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { getDatabase, child, ref as fbref, set as fbset, onValue, query, orderByChild, ref, get as fbget } from '@angular/fire/database';
import { getAuth } from "firebase/auth";
import { Observable, Observer } from 'rxjs';
import utilInstance from '../model/util';
import { THREE } from '@angular/cdk/keycodes';


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
  current_file_id: number = -1;
  current_file_name: string = "draft"
  current_file_desc: string = "";

  constructor(public auth: AuthService) {

    //needs to know if its booting an existing file or needs a new file ID


  }

  setCurrentFileId(id: number){
    this.current_file_id = id;
  }

  generateFileId(){
    this.current_file_id = utilInstance.generateId(8);
  }

  /**
   * called from auth when hte status changes
   */
  updateUserFiles(userId: any){

    this.file_tree = [];
    const dbRef = ref(getDatabase());
    fbget(child(dbRef, `users/${userId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        console.log(snapshot.val());

        const tree = snapshot.val().tree;
        if(tree === undefined) return;
        tree.forEach(id => {

          let tree_obj = {
            id: id,
            meta: null
          }
          
          //get the file metadata
          fbget(child(dbRef, `filemeta/${id}`)).then((meta_snapshot) => {
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



  /**
   * writes the data for the currently open file to the database
   * @param cur_state 
   * @returns 
   */
  public writeCurrentFileData(cur_state: any) {


    const auth = getAuth();
    const user = auth.currentUser;
    
    if(user === null) return; 

    const db = getDatabase();

    this.getUserFilesList(user.uid).then( updatedfiles => {
      console.log("updated files", updatedfiles)
      fbset(fbref(db, 'users/' + user.uid), {
        timestamp: Date.now(),
        ada: cur_state,
        tree: updatedfiles,
        last_opened: this.current_file_id
      }).catch(console.error);
  
  
      fbset(fbref(db, 'filedata/' + this.current_file_id), {
        ada: cur_state
      }).catch(console.error);
  
      fbset(fbref(db, 'filemeta/' + this.current_file_id), {
        name: this.current_file_name,
        timestamp: Date.now(),
        owner: user.uid, 
        desc: this.current_file_desc
      }).catch(console.error);
    })
    
    
  }

  /**
   * gets the users filesystemm as stored on database 
   * @param userId 
   * @returns 
   */
  getUserFilesList(userId:string): Promise<Array<number>>{
    const db = getDatabase();
    return fbget(fbref(db, `users/${userId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const tree = snapshot.val().tree;
        if(tree == undefined){
          return Promise.resolve([this.current_file_id]);
        }else{
          const found = tree.find(el => el === this.current_file_id);
          if(found === undefined){
            return Promise.resolve(tree.concat(this.current_file_id));
          }else{
            return Promise.resolve(tree);
          }
        }
      }else{
        return Promise.reject();
      }
    });
  }


  /**
   * gets the file to preload for the user on load
   * @param uid 
   */
  getOnLoadDefaultFile() : Promise<any>{
    const db = getDatabase();
    const auth = getAuth();
    const user = auth.currentUser;

    if(user === null) return Promise.reject("no such user");

    return fbget(fbref(db, `users/${user.uid}`)).then((snapshot) => {
      if (snapshot.exists()) {
        console.log("GOT AUTH USER", snapshot.val())
        if(snapshot.val().last_opened !== undefined){
          const file_id = snapshot.val().last_opened;
          this.current_file_id = file_id;

          return fbget(fbref(db, `filedmeta/${this.current_file_id}`)).then((meta) => {

            if(meta.exists()){

              this.current_file_name = meta.val().name;
              this.current_file_desc = meta.val().desc;

            }else{
              Promise.reject("User found but file id not found")
            }


            return fbget(fbref(db, `filedata/${this.current_file_id}`)).then((filedata) => {

              if(filedata.exists()){
  
               return Promise.resolve(this.current_file_name = filedata.val().ada);
  
              }else{
                Promise.reject("User found but file id not found")
              }
  
            });


          });



      
       

        }else if(snapshot.val().ada !== undefined){
          return Promise.resolve(snapshot.val().ada);
        }else{
          return Promise.reject("no saved file data");

        }
        
      }else{
        return Promise.reject("no such user with this id");
      }
    });
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



