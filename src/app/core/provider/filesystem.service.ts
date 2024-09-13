import { Injectable, Optional } from '@angular/core';
import { Auth, authState, getAuth } from '@angular/fire/auth';
import { get as fbget, getDatabase, onChildAdded, onChildRemoved, onDisconnect, onValue, orderByChild, update, ref as fbref, ref, remove, query, onChildChanged } from '@angular/fire/database';
// import { onChildAdded, onChildChanged, onChildRemoved, onDisconnect, onValue, orderByChild, update } from 'firebase/database';
import { Observable, Subject } from 'rxjs';
import { FilebrowserComponent } from '../ui/filebrowser/filebrowser.component';
import { LoadedFile, SaveObj } from '../model/datatypes';
import utilInstance from '../model/util';



@Injectable({
  providedIn: 'root'
})
export class FilesystemService {

  file_tree_change$ = new Subject<any>();
  file_saved_change$ = new Subject<any>();
  loaded_file_change$ = new Subject<any>();

  file_tree: Array<any> = [];

  loaded_files: Array<LoadedFile>; 


  private current_file_id: number = -1;
  public current_file_name: string = '';


  connected: boolean = false;

  updateUItree: Observable<Array<any>>;


 constructor(@Optional() private auth: Auth) {

      this.loaded_files = [];

      const db = getDatabase();

      const presenceRef = ref(db, "disconnectmessage");
     
      // Write a string when this client loses connection
      onDisconnect(presenceRef).set("I disconnected!");

      const connectedRef = ref(db, ".info/connected");
      onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          console.log("connected");
          this.connected = true;
        } else {
          console.log("not connected");
          this.connected = false;
        }
      });

      this.file_tree = [];

      authState(this.auth).subscribe(user => {

        if(user == null){
          this.file_tree = [];
          return;
        } 
       
        
        const userFiles = query(ref(db, 'users/'+user.uid+'/files'), orderByChild('timestamp'));
        

        //called once per item, then on subsequent changes
        onChildAdded(userFiles, (childsnapshot) => {
          //console.log("CHILD ADDED ", userFiles)

          //only add values that haven't already been added
          if(this.file_tree.find(el => el.id === parseInt(childsnapshot.key)) === undefined){
            this.addToTree(parseInt(childsnapshot.key), childsnapshot.val());
           this.file_tree_change$.next(this.file_tree.slice());
          }
        }); 

       
    
        //called when anything in meta changes
        onChildChanged(userFiles, (data) => {
         // console.log("CHILD CHANGED ", userFiles)
            const ndx = this.file_tree.findIndex(el => parseInt(el.id) === parseInt(data.key));
            if(ndx !== -1){
              this.file_tree[ndx].meta.name = data.val().name;
              this.file_tree_change$.next(this.file_tree.slice());
            }
        });
        
        //needs to redraw the files list 
        onChildRemoved(userFiles, (removedItem) => {
          //console.log("CHILD REMOVED ", userFiles)

          const removedId = removedItem.key;
          this.file_tree = this.file_tree.filter(el => parseInt(el.id) !== parseInt(removedId));
          this.file_tree_change$.next(this.file_tree.slice());
        });
    
    
      });
  }

  public getLoadedFile(id: number) : LoadedFile{

    let item = this.loaded_files.find(el => el.id == id);
    if(item == undefined){
      return null;
    }else{
      return item
    }
  }



  /**
   * given a new file that has just been loaded, update the meta-data to match the value of this item.
   * @param id 
   * @param ada 
   * @returns boolean representing if the id had meta-data already stored or if new meta-data was created
   */
  public pushToLoadedFilesAndFocus(id: number, name: string, desc: string) : Promise<boolean>{


    // let item = this.getLoadedFile(id);

    // if(item === null){
      
      return this.getFileMeta(id)
      .then(res => {
        this.loaded_files.push({
          id: id,
          name: res.name,
          desc: res.desc,
          ada: undefined,
          last_saved_time: 0
        });
        this.setCurrentFileInfo(id, res.name, res.desc);
        this.loaded_file_change$.next(this.file_tree.slice());
        return Promise.resolve(true);

      })
      .catch(nodata => {
        this.loaded_files.push({
          id: id,
          name:name,
          desc: desc,
          ada: undefined,
          last_saved_time: 0
        })
        this.setCurrentFileInfo(id, name, desc);
        this.loaded_file_change$.next(this.file_tree.slice());
        return Promise.resolve(false);
      });

    // }else{
    //   this.setCurrentFileInfo(item.id, item.name, item.desc);
    //   return Promise.reject('this file has already been loaded')
    // }
  }

  public unloadFile(id: number){
    this.loaded_files = this.loaded_files.filter(el => el.id !== id);
    if(this.current_file_id == id) this.current_file_id = -1;
    this.loaded_file_change$.next(this.file_tree.slice());

  }

  public setCurrentFileId(id: number){
    this.current_file_id = id;
  }

  public getCurrentFileId(){
    return this.current_file_id;
  }

  public getCurrentFileName() : string{
    let item = this.getLoadedFile(this.current_file_id);
    if(item !== null) return item.name;
    return '';
  }

  public getCurrentFileDesc() : string{
    let item = this.getLoadedFile(this.current_file_id);
    if(item !== null) return item.desc;
    return null;
  }

  public getCurrentFileObj() : SaveObj{
    let item = this.getLoadedFile(this.current_file_id);
    if(item !== null) return item.ada;  
    return null;
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

    this.file_tree.unshift({
      id: fileid,
      meta: meta
    })
  }


  /**
   * sets the current metadata
   * @param fileid 
   * @param name 
   * @param desc 
   */
  setCurrentFileInfo(fileid: number, name: string, desc: string){
   
    if(fileid === null || fileid == undefined) return; 

    if(desc === null || desc === undefined) desc = '';
    if(name === null || name === undefined) name = 'no name'; 
   
    this.setCurrentFileId(fileid);
    this.current_file_name = name;

    const item = this.getLoadedFile(this.current_file_id);
    if(item == null){
         console.log("CANNOT FIND ITEM in LOADED FILES IN SET DCURRENT FILE INFO")
    }else{
      item.name = name;
      item.desc = desc;
    }

    // item.current_file_id = fileid;
    // this.current_file_name = name;
    // this.current_file_desc = desc;


    const stamp = Date.now();

    if(!this.connected) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if(user){
      const db = getDatabase();
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

    if(fileid == this.getCurrentFileId()) this.current_file_name = newname;
    const item = this.getLoadedFile(fileid);

    if(item == null){
        //this file is not currently loaded but we can still rename it
    }else{
      //if it is cureently loaded, get it here too
      item.name = newname;
    }

    if(!this.connected) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if(user){
      const db = getDatabase();
      update(fbref(db, 'users/'+user.uid+'/files/'+fileid),{
        name: newname});
    }
  }

  updateDescription(fileid: number, desc: string){
  
    if(fileid === null || fileid == undefined) return; 
    if(desc === null || desc === undefined) desc = ''; 
    
    const item = this.getLoadedFile(fileid);
    if(item == null){
      //this file is not currently loaded
    }else{
      item.desc = desc;
    }
    
    if(!this.connected) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if(user){
      const db = getDatabase();
      update(fbref(db, 'users/'+user.uid+'/files/'+fileid),{
        desc: desc});
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
   this.writeFileData(fileid, ada);
   this.writeNewFileMetaData(uid, fileid, 'recovered draft', '')
   return Promise.resolve(fileid);
    
  }

  /**
   * takes the current state, gives it a new file ID and pushes it to the database
   * @returns the id of the file
   */
    duplicate(uid: string, name: string, desc: string, ada: any) : Promise<number>{
    
      const fileid = this.generateFileId();
      this.writeFileData(fileid, ada);
      this.writeNewFileMetaData(uid, fileid, name, desc)
      return Promise.resolve(fileid);
       
     }
   



  /**
   * gets the file at a given id
   * @returns the file data
   */
getFile(fileid: number) : Promise<any> {
    if(!this.connected) return Promise.reject("get file is not logged in");


    const db = getDatabase();

    return fbget(fbref(db, `filedata/${fileid}`))
    .then((filedata) => {


        if(filedata.exists()){

          return Promise.resolve(filedata.val().ada);

        }else{
         return Promise.reject("User found but file id not found")
        }

      }).catch(e => {console.error(e)});

  }


  /**
   * calls when a file is selected to be deleted from the files list
   * deletes all references to the file and then deletes from the users file list
   * @param fileid 
   * @returns 
   */
  removeFile(fileid: number) {
    
    this.unloadFile(fileid);
    
    if(!this.connected) return;

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

    if(user == null) return Promise.reject("user not logged in");
    
    return fbget(fbref(db, 'users/'+user.uid+'/files/'+fileid)).then((meta) => {

        if(meta.exists()){
          return Promise.resolve(meta.val());
        }else{
          return Promise.reject("No meta data found for file id "+fileid)
        }

      });
    }



  updateCurrentStateInLoadedFiles(fileid: number, cur_state: SaveObj){
    const item = this.getLoadedFile(fileid);

    if(item !== null){
      item.ada = cur_state;
    }
    
  }

  /**
   * writes the data for the currently open file to the database
   * @param cur_state 
   * @returns 
   */
  writeFileData(fileid: number, cur_state: SaveObj) {

    if(!this.connected) return;

    const db = getDatabase();
    const ref = fbref(db, 'filedata/'+fileid);

    update(ref,{ada: cur_state})
    .then(success => {
      const item = this.getLoadedFile(fileid);
      if(item !== null){
        item.last_saved_time = Date.now();
      }else{
        console.error("could not get loaded file after save")
      }

    })
    .catch(err => {
      console.error(err);
    })
  }


  writeNewFileMetaData(uid: string, fileid: number, name: string, desc: string) {

     const item = this.getLoadedFile(fileid);
     if(item !== null){
      item.name = name,
      item.desc = desc
     }

      if(!this.connected) return;
      const stamp = Date.now();
      const db = getDatabase();
      update(fbref(db, 'users/'+uid+'/files/'+fileid),{
        name: name,
        desc: desc,
        timestamp: stamp, 
        last_opened:fileid});
   }
    
    





  
}



