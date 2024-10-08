import { Injectable, Optional } from '@angular/core';
import { Auth, authState, getAuth } from '@angular/fire/auth';
import { get as fbget, getDatabase, onChildAdded, onChildRemoved, onDisconnect, onValue, orderByChild, update, ref as fbref, ref, remove, query, onChildChanged, set } from '@angular/fire/database';
// import { onChildAdded, onChildChanged, onChildRemoved, onDisconnect, onValue, orderByChild, update } from 'firebase/database';
import { Observable, Subject } from 'rxjs';
import { FilebrowserComponent } from '../ui/filebrowser/filebrowser.component';
import { SaveObj, ShareObj } from '../model/datatypes';
import utilInstance from '../model/util';



@Injectable({
  providedIn: 'root'
})
export class FilesystemService {

  file_tree_change$ = new Subject<any>();
  file_saved_change$ = new Subject<any>();
  shared_file_change$ = new Subject<any>();

  file_tree: Array<any> = [];

  private current_file_id: number = -1;
  public current_file_name: string = '';
  public current_file_desc: string = '';


  connected: boolean = false;

  updateUItree: Observable<Array<any>>;


 constructor(@Optional() private auth: Auth) {

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
        const sharedFiles = query(ref(db, 'shared'));

        //called once per item, then on subsequent changes
        onChildAdded(userFiles, (childsnapshot) => {
          console.log("ON CHILD ADDED")

          //only add values that haven't already been added
          if(this.file_tree.find(el => el.id === parseInt(childsnapshot.key)) === undefined){
            this.isShared(childsnapshot.key).then(res => {
              this.addToTree(parseInt(childsnapshot.key), childsnapshot.val(), res);
              this.file_tree_change$.next(this.file_tree.slice());

            })


          }
        }); 

        onChildAdded(sharedFiles, (childsnapshot) => {
          console.log("ON SHARE ADDED")
          //only add values that haven't already been added
          if(this.file_tree.find(el => el.id === parseInt(childsnapshot.key)) !== undefined){
              this.shared_file_change$.next(this.file_tree.slice());
          }
        }); 

       
    
        //called when anything in meta changes
        onChildChanged(userFiles, (data) => {
          console.log("CHILD CHANGED ", userFiles)
            const ndx = this.file_tree.findIndex(el => parseInt(el.id) === parseInt(data.key));
            if(ndx !== -1){
              this.isShared(data.key).then(res => {
                this.file_tree[ndx].meta.name = data.val().name;
                this.file_tree[ndx].shared = res;
                this.file_tree_change$.next(this.file_tree.slice());
              })
     
            }
        });

        onChildChanged(sharedFiles, (data) => {
            const ndx = this.file_tree.findIndex(el => parseInt(el.id) === parseInt(data.key));
            if(ndx !== -1){
              this.isShared(data.key).then(res => {
                this.file_tree[ndx].shared = res;
                this.shared_file_change$.next(this.file_tree.slice());
              })
     
            }
        });
        
        //needs to redraw the files list 
        onChildRemoved(userFiles, (removedItem) => {
          const removedId = removedItem.key;
          this.file_tree = this.file_tree.filter(el => parseInt(el.id) !== parseInt(removedId));
          this.file_tree_change$.next(this.file_tree.slice());
        });

        //needs to redraw the files list 
        onChildRemoved(sharedFiles, (removedItem) => {

          const removedId = removedItem.key;
          const ndx = this.file_tree.findIndex(el => parseInt(el.id) === parseInt(removedId));
          if(ndx !== -1){
              this.file_tree[ndx].shared = null;
              this.shared_file_change$.next(this.file_tree.slice());
          }
        });
        
        
      
      
      });

        
  }

  /**
   * given a new file that has just been loaded, update the meta-data to match the value of this item.
   * @param id 
   * @param ada 
   * @returns boolean representing if the id had meta-data already stored or if new meta-data was created
   */
  public pushToLoadedFilesAndFocus(id: number, name: string, desc: string) : Promise<boolean>{

      
      return this.getFileMeta(id)
      .then(res => {
        // this.loaded_files.push({
        //   id: id,
        //   name: res.name,
        //   desc: res.desc,
        //   ada: undefined,
        //   last_saved_time: 0
        // });
        this.setCurrentFileInfo(id, res.name, res.desc);
        // this.loaded_file_change$.next(this.file_tree.slice());
        return Promise.resolve(true);

      })
      .catch(nodata => {
        // this.loaded_files.push({
        //   id: id,
        //   name:name,
        //   desc: desc,
        //   ada: undefined,
        //   last_saved_time: 0
        // })
        this.setCurrentFileInfo(id, name, desc);
       // this.loaded_file_change$.next(this.file_tree.slice());
        return Promise.resolve(false);
      });

    // }else{
    //   this.setCurrentFileInfo(item.id, item.name, item.desc);
    //   return Promise.reject('this file has already been loaded')
    // }
  }

  // public unloadFile(id: number){
  //   this.loaded_files = this.loaded_files.filter(el => el.id !== id);
  //   if(this.current_file_id == id) this.current_file_id = -1;
  //   this.loaded_file_change$.next(this.file_tree.slice());

  // }

  public setCurrentFileId(id: number){
    this.current_file_id = id;
  }

  public getCurrentFileId(){
    return this.current_file_id;
  }

  public getCurrentFileName() : string{
    return this.current_file_name;
  }

  public getCurrentFileDesc() : string{
    return this.current_file_desc;
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
  addToTree(fileid: number, meta: any, shared: ShareObj){

    var dateFormat = new Date(meta.timestamp);
    meta.date = dateFormat.toLocaleDateString();

    this.file_tree.unshift({
      id: fileid,
      meta: meta,
      shared: shared
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
  console.log("DUPLICATING")

  const fileid = this.generateFileId();
  this.writeFileData(fileid, ada);
  this.writeNewFileMetaData(uid, fileid, name, desc)
  return Promise.resolve(fileid);
    
  }
   

/**
 * creates a new reference for a shared file 
 * @param file_id 
 * @param share_data 
 * @returns 
 */
createSharedFile(file_id: string, share_data: ShareObj) : Promise<string> {
  console.log("CREATING SHARED FILE ", file_id, share_data)

  if(!this.connected) return;

  const db = getDatabase();
  const ref = fbref(db, 'shared/'+file_id);

  set(ref,share_data)
  .then(success => {
    console.log("SUCCESS");
    return Promise.resolve(file_id)

  })
  .catch(err => {
    console.error(err);
    return Promise.reject("could not create new shared item")

  })


}

/**
 * checks if and how a particular file id is being shared
 * @param file_id 
 */
isShared(file_id:string) : Promise<ShareObj> {
  const db = getDatabase();

  return fbget(fbref(db, `shared/${file_id}`))
  .then((filedata) => {


      if(filedata.exists()){
        return Promise.resolve({
          ada: <SaveObj> filedata.val().ada, 
          author_list: filedata.val().author_list, 
          license: filedata.val().license,
          filename: filedata.val().filename,
          desc: filedata.val().desc});

      }else{
       return Promise.resolve(null)
      }

    })
}



/**
 * called when a user changes the license for a shared file. 
 * @param fileid 
 * @param license 
 * @returns 
 */
updateSharedFile(fileid: string, share: ShareObj) : Promise<any>{
  if(!this.connected) return Promise.reject("not logged in");

  const db = getDatabase();
  const ref = fbref(db, 'shared/'+fileid);

    update(ref,share)
    .then(success => {
      return Promise.resolve(true);
    })
    .catch(err => {
      console.error(err);
      return Promise.resolve(false);
    })

}


/**
 * called when a user changes the license for a shared file. 
 * @param fileid 
 * @param license 
 * @returns 
 */
updateSharedLicense(fileid: string, license: string) : Promise<any>{
  if(!this.connected) return Promise.reject("not logged in");

  const db = getDatabase();
  const ref = fbref(db, 'shared/'+fileid);

    update(ref,{license: license})
    .then(success => {
      return Promise.resolve(true);
    })
    .catch(err => {
      console.error(err);
      return Promise.resolve(false);
    })

}

/**
   * The shared entry is not the same as the file. This operation removes the entry to this file in the shared DB but the file that was shared still exists in the files DB. This will automatically rename that file to reflect that it used to be shared. 
   * @returns the file data
   */
removeSharedFile(file_id: string) : Promise<any> {
  if(!this.connected) return Promise.reject("get shared file is not logged in");


  let int_id: number = +file_id;
  const db = getDatabase();
  const auth = getAuth();
  const user = auth.currentUser;
  remove(fbref(db, `shared/${file_id}`));


  this.getFileMeta(int_id).then(meta => {
      console.log("META GOT ", meta)
    if(user){
      console.log("UPDATED ", meta)

      update(fbref(db, 'users/'+user.uid+'/files/'+file_id),{name: meta.name + "(previously shared)"});
    }
  })



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



  updateSaveTime(fileid: number){
    if(!this.connected) return;
    const auth = getAuth();
    const user = auth.currentUser;
    const stamp = Date.now();
    const db = getDatabase();
    update(fbref(db, 'users/'+user.uid+'/files/'+fileid),{
      timestamp: stamp});
  }



  /**
   * writes the data for the currently open file to the database
   * @param cur_state 
   * @returns 
   */
  writeFileData(fileid: number, cur_state: SaveObj) {
    console.log("ATTEMPTING TO WRITE FILE DATA ", cur_state, fileid)

    if(!this.connected) return;

    const db = getDatabase();
    const ref = fbref(db, 'filedata/'+fileid);

    update(ref,{ada: cur_state})
    .then(success => {
      this.updateSaveTime(fileid)
    })
    .catch(err => {
      console.error(err);
    })
  }


  writeNewFileMetaData(uid: string, fileid: number, name: string, desc: string) {

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



