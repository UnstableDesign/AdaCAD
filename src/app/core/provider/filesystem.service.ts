import { Injectable, Optional } from '@angular/core';
import { getDatabase, ref as fbref, set as fbset, query, ref, get as fbget, remove } from '@angular/fire/database';
import utilInstance from '../model/util';
import { DataSnapshot, onChildAdded, onChildChanged, onChildRemoved, update } from 'firebase/database';
import { FileService } from './file.service';
import { ZoomService } from '../../mixer/provider/zoom.service';
import { Auth, authState, getAuth } from '@angular/fire/auth';
import { Observable, Observer, Subject } from 'rxjs';
import { FilebrowserComponent } from '../filebrowser/filebrowser.component';


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

  file_tree_change$ = new Subject<any>();
  file_tree: Array<any> = [];
  current_file_id: number = -1;
  current_file_name: string = "draft"
  current_file_desc: string = "";
  updateUItree: Observable<Array<any>>;


 constructor(@Optional() private auth: Auth,
    private fs: FileService, private zs: ZoomService) {


      


      this.file_tree = [];

      authState(this.auth).subscribe(user => {
        console.log('user', user)
        if(user == null){
          this.file_tree = [];
          return;
        } 
        //update the tree based on the state of the DB
       
    
    
    
        const db = getDatabase();
        const userFiles = query(ref(db, 'users/'+user.uid+'/files'));
        

        //called once per item, then on subsequent changes
        onChildAdded(userFiles, (childsnapshot) => {
          //only add values that haven't already been added
          if(this.file_tree.find(el => el.id === parseInt(childsnapshot.key)) === undefined){
            this.addToTree(parseInt(childsnapshot.key), childsnapshot.val());
           this.file_tree_change$.next(this.file_tree.slice());
          }
        }); 

       
    
        //called when anything in meta changes
        onChildChanged(userFiles, (data) => {
            const ndx = this.file_tree.findIndex(el => parseInt(el.id) === parseInt(data.key));
            if(ndx !== -1){
              this.file_tree[ndx].meta.name = data.val().name;
              this.file_tree_change$.next(this.file_tree.slice());
            }
        });
        
        //needs to redraw the files list 
        onChildRemoved(userFiles, (removedItem) => {
          const removedId = removedItem.key;
          this.file_tree = this.file_tree.filter(el => parseInt(el.id) !== parseInt(removedId));
          this.file_tree_change$.next(this.file_tree.slice());
        });
    
    
      });

  }

  
  
  public changeObserver(target: FilebrowserComponent) : Observable<Array<any>>{
    return new Observable<Array<any>>((observer) => {

      const handler = observer.next(this.file_tree);
    }) 
  }
  

  public clearTree(){
    this.file_tree = [];
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


  /**
   * sets the current data and updates the metadeta
   * @param fileid 
   * @param name 
   * @param desc 
   */
  setCurrentFileInfo(fileid: number, name: string, desc: string){
   
    if(fileid === null || fileid == undefined) return; 
    if(desc === null || desc === undefined) desc = '';
    if(name === null || name === undefined) name = 'no name'; 
   
    this.current_file_id = fileid;
    this.current_file_name = name;
    this.current_file_desc = desc;
    const stamp = Date.now();

    const auth = getAuth();
    const user = auth.currentUser;
    if(user){
      const db = getDatabase();
      console.log(name, desc, stamp)
      update(fbref(db, `users/${user.uid}`),{last_opened: fileid});
      update(fbref(db, 'users/'+user.uid+'/files/'+fileid),{
        name: name, 
        desc: desc,
        timestamp: stamp});
    }



  }

  renameFile(fileid: number, newname: string){
  
    if(fileid === null || fileid == undefined) return; 
    if(newname === null || newname === undefined) newname = 'no name'; 
    
    this.current_file_name = newname;

    const auth = getAuth();
    const user = auth.currentUser;
    if(user){
      const db = getDatabase();
      console.log("renaming to "+newname);
      update(fbref(db, 'users/'+user.uid+'/files/'+fileid),{
        name: newname});
    }
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
   this.writeNewFileMetaData(uid, fileid, 'recovered draft', '')
   return Promise.resolve(fileid);
    
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

  /**
   * writes the data for the currently open file to the database
   * @param cur_state 
   * @returns 
   */
  writeFileData(uid: string, fileid: number, cur_state: any) {
    const db = getDatabase();
    update(fbref(db, 'filedata/'+fileid),{ada: cur_state});
  }




  writeNewFileMetaData(uid: string, fileid: number, name: string, desc: string) {
      const stamp = Date.now();
      const db = getDatabase();
      update(fbref(db, 'users/'+uid+'/files/'+fileid),{
        name: name,
        desc: desc,
        timestamp: stamp, 
        last_opened:fileid});
    }
    
    
  


  renameFolder(old_loc: string, new_name: string) : Promise<boolean>{
    //all folders
    return Promise.resolve(true);
  }



  deleteFile(path:string){

  }


  
}



