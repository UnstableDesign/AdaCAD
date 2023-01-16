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
 *    last_opened: 
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

  generateFileId() : number{
    return utilInstance.generateId(8);
  }

  /**
   * if a user only has an ada file on their user id, this converts it to a file that is stored in teh filesystem
   * @param ada 
   * @returns the id of the file
   */
  convertAdaToFile(uid: string, ada: any) : Promise<number>{
    
   const fileid = this.generateFileId();
   this.writeFileData(uid, fileid, "recovered draft", "", ada);
   return Promise.resolve(this.current_file_id);
    
  }

  /**
   * creates a blank file
   * @param ada 
   * @returns the id of the file
   */
  createFile(uid: string) : Promise<number>{
  
    const fileid = this.generateFileId();
    this.writeFileData(uid, fileid, "new draft", "", null);
    return Promise.resolve(this.current_file_id);
      
  }

  /**
   * gets the file at a given id
   * @returns the file data
   */
  getFile(fileid: number) : Promise<any> {
    const db = getDatabase();

    return fbget(fbref(db, `filedata/${fileid}`)).then((filedata) => {

        if(filedata.exists()){
         return Promise.resolve(filedata.val().ada);
        }else{
          Promise.reject("User found but file id not found")
        }

      });

  }

  /**
   * gets the file meta for a given id. 
   * @param fileid 
   * @returns the meta data
   */
  getFileMeta(fileid: number) : Promise<any> {
    const db = getDatabase();

    return fbget(fbref(db, `filemeta/${fileid}`)).then((meta) => {

        if(meta.exists()){
          return Promise.resolve(meta.val());
        }else{
          Promise.reject("No meta data found for file id"+fileid)
        }

      });

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


  /**
   * writes the data for the currently open file to the database
   * @param cur_state 
   * @returns 
   */
  writeFileData(uid: string, fileid: number, name: string, desc: string,  cur_state: any) {

    const db = getDatabase();

    this.getUserFilesList(uid).then( updatedfiles => {
      fbset(fbref(db, 'users/' + uid), {
        timestamp: Date.now(),
        tree: updatedfiles,
        last_opened:fileid
      }).catch(console.error);
  
      if(cur_state != null){
      fbset(fbref(db, 'filedata/' + fileid), {
        ada: cur_state
      }).catch(console.error);
      }
  
      fbset(fbref(db, 'filemeta/' + fileid), {
        name: name,
        timestamp: Date.now(),
        owner: uid, 
        desc: desc
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

          return fbget(fbref(db, `filemeta/${this.current_file_id}`)).then((meta) => {

            if(meta.exists()){

              console.log("meta", meta.val().name);
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



  deleteFile(path:string){

  }

  renameFile(path:string){
    
  }

  
}



