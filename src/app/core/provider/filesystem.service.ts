import { Injectable, Optional } from '@angular/core';
import { AuthService } from './auth.service';
import { getDatabase, child, ref as fbref, set as fbset, query, ref, get as fbget, remove } from '@angular/fire/database';
import utilInstance from '../model/util';
import { DataSnapshot, equalTo, onChildAdded, onChildChanged, onChildRemoved, update } from 'firebase/database';
import { FileService } from './file.service';
import { ZoomService } from '../../mixer/provider/zoom.service';
import { Auth, authState, getAuth } from '@angular/fire/auth';


/**
 * users{
 *  uid: 
 *    ada:
 *    timestamp: 
 *    last_opened: 
 *     files : {
        *  file_id: 
        *  name: 
        *  timestamp: 
        *  desc:
  }
 * 
 *  }
 * 
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
  constructor(@Optional() private auth: Auth,
    private fs: FileService, private zs: ZoomService) {

      this.file_tree = [];
      
      authState(this.auth).subscribe(user => {
        console.log('user', user)
        if(user == null) return;
        //update the tree based on the state of the DB
       
    
    
    
        const db = getDatabase();
        const userFiles = query(ref(db, 'users/'+user.uid+'/files'));
        
        //called once per item, then on subsequent changes
        onChildAdded(userFiles, (childsnapshot) => {
          console.log("child added")
           this.addToTree(parseInt(childsnapshot.key), childsnapshot.val())
        });
    
        //called when anything in meta changes
        onChildChanged(userFiles, (data) => {
          console.log("Child Changed")
            const ndx = this.file_tree.findIndex(el => el.id === data.key);
            if(ndx !== -1) this.file_tree[ndx].name = data.val().name
        });
        
        //needs to redraw the files list 
        onChildRemoved(userFiles, (removedItem) => {
          console.log("child removed")
          const removedId = removedItem.key;
          this.file_tree = this.file_tree.filter(el => el.id !== removedId);
        });
    
    
      });

  }

  /**
   * converts the data snapshot from the database to a UI readable tree
   * @param snapshot 
   * @returns 
   */
  private updateFileList(snapshot: DataSnapshot){
    const auth = getAuth();
    const user = auth.currentUser;

    if(user === undefined) return;

    //this.file_tree = [];
   
    snapshot.forEach((childSnapshot) => {
      const childKey = childSnapshot.key;
      const childData = childSnapshot.val();
      if(childData.owner === user.uid) this.addToTree(parseInt(childKey), childData)
      
    });
  }

  /**
   * adds to the local tree for the UI
   */
  addToTree(fileid: number, meta: any){

    var dateFormat = new Date(meta.timestamp);
    meta.date = dateFormat.toLocaleDateString();

    this.file_tree.push({
      id: fileid,
      meta: meta
    })
  }

  setCurrentFileId(id: number){
    this.current_file_id = id;
    const auth = getAuth();
    const user = auth.currentUser;
    if(user){
      const db = getDatabase();
      update(fbref(db, `users/${user.uid}`),{last_opened: id});
    }



  }

  setCurrentFileInfo(fileid: number, name: string, desc: string){
    this.current_file_id = fileid;
    this.current_file_name = name;
    this.current_file_desc = desc;
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
   this.writeFileData(uid, fileid, ada);
   return Promise.resolve(this.current_file_id);
    
  }

  /**
   * creates a blank file
   * @param ada 
   * @returns the id of the file
   */
  createFile(uid: string) : Promise<number>{
    const fileid = this.generateFileId();
    this.updateFileMetaOnOpen(uid, fileid);
    this.renameCurrentFile('blank draft');
    this.fs.saver.ada(
      'mixer', 
      false,
      this.zs.zoom)
      .then(so => {
        this.writeFileData(uid, fileid, so)
      });
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
         return Promise.reject("User found but file id not found")
        }

      });

  }


  /**
   * calls when a file is selected to be deleted from the files list
   * deletes all references to the file and then deletes from the users file list
   * @param fileid 
   * @returns 
   */
  removeFile(fileid: number) {

    const db = getDatabase();
    const auth = getAuth();
    const user = auth.currentUser;

    if(user == null) return;
    remove(fbref(db, `filedata/${fileid}`));
    remove(fbref(db, 'users/'+user.uid+'/files/'+fileid));
  }

  /**
   * gets the file meta for a given id. 
   * @param fileid 
   * @returns the meta data
   */
  getFileMeta(fileid: number) : Promise<any> {
    const db = getDatabase();
    const auth = getAuth();
    const user = auth.currentUser;

    if(user == null) return;
    
    return fbget(fbref(db, 'users/'+user.uid+'/files/'+fileid)).then((meta) => {

        if(meta.exists()){
          return Promise.resolve(meta.val());
        }else{
          return Promise.reject("No meta data found for file id "+fileid)
        }

      });

  }

  renameCurrentFile(newname: string){
    const db = getDatabase();
    const fbauth = getAuth();
    const user = fbauth.currentUser;

    if(user === null) return;
    fbset(fbref(db, 'users/'+user.uid+'/files/' + this.current_file_id), {
      name: newname
    })
    .catch(console.error);
  }

  /**
   * writes the data for the currently open file to the database
   * @param cur_state 
   * @returns 
   */
  writeFileData(uid: string, fileid: number, cur_state: any) {
    const db = getDatabase();
    update(fbref(db, 'filedata/'+fileid),{ada: cur_state});
  }


  //write data on load (n)
  updateFileMetaOnOpen(uid: string, fileid: number) {
    const stamp = Date.now();
    const db = getDatabase();
    update(fbref(db, 'users/'+uid+'/files/'+fileid),{timestamp: stamp, last_opened:fileid});
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



