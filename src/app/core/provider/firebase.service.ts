import { inject, Injectable, OnDestroy } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, User, user } from '@angular/fire/auth';
import { Database, get, onChildAdded, onChildChanged, onChildRemoved, onValue, orderByChild, query, ref, remove, set, update } from '@angular/fire/database';
import { generateId } from 'adacad-drafting-lib';
import { BehaviorSubject, Subscription } from 'rxjs';
import { FileMeta, FilesState, SaveObj, ShareObj, UserFile } from '../model/datatypes';

/**
 * A service to streamline interactions with firebase
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseService implements OnDestroy {


  //CONNECTIVITY
  private db = inject(Database);
  connectedRef = ref(this.db, ".info/connected");
  private connectionChangeEvent = new BehaviorSubject<boolean>(false);
  connectionChangeEvent$ = this.connectionChangeEvent.asObservable();


  //USER AUTHENTICATION
  auth: Auth = inject(Auth);
  user$ = user(this.auth);
  userSubscription: Subscription;
  private authChangeEvent = new BehaviorSubject<User | null>(null);
  authChangeEvent$ = this.authChangeEvent.asObservable();


  // DATABASE
  private database = inject(Database);

  //DATABASE - USER DATA (list of file_ids with metadata, last logged in time)
  userFilesSubscription: Subscription;
  private userFilesChangeEvent = new BehaviorSubject<FilesState>(null);
  userFilesChangeEvent$ = this.userFilesChangeEvent.asObservable();


  file_list: FilesState = {
    user: [], //all files associated with this user 
    shared: [], //metadata for any shared files
    public: []
  }




  //DATABASE - SHARED DATA (indexed by id, name, img, license, credit, owner uid, owner url, make public)
  sharedFiles = query(ref(this.db, 'shared'));
  sharedFilesSucscription: Subscription;
  private sharedFilesChangeEvent = new BehaviorSubject<FilesState>(null);
  sharedFilesChangeEvent$ = this.sharedFilesChangeEvent.asObservable();



  constructor() {

    // CHECK FOR CONNECTION EVENT 
    onValue(this.connectedRef, (snap) => {
      this.emitConnectionEvent(snap.val())

      if (snap.val() === true) {
        console.log("connected");
      } else {
        console.log("not connected");
      }
    });


    // CHECK FOR USER EVENTS 

    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
      //handle user state changes here. Note, that user will be null if there is no currently logged in user.
      console.log("FROM FIREBASE SERVICE ", aUser);
      this.emitAuthEvent(aUser);

      if (user) {

        const userFiles = query(ref(this.database, 'users/' + aUser.uid + '/files'), orderByChild('timestamp'));

        onChildAdded(userFiles, (childsnapshot) => {

          if (this.file_list.user.find(el => el.id === parseInt(childsnapshot.key)) === undefined) {

            const meta = childsnapshot.val();
            var dateFormat = new Date(meta.timestamp);
            meta.date = dateFormat.toLocaleDateString();

            const user_file: UserFile = {
              id: parseInt(childsnapshot.key),
              meta: meta,
            }
            this.file_list.user.unshift(user_file);
          }
          this.emitUserFilesEvent(this.file_list);

        });

        onChildChanged(userFiles, (childsnapshot) => {

          const ndx = this.file_list.user.findIndex(el => el.id === parseInt(childsnapshot.key));
          if (ndx !== -1) {
            const meta = childsnapshot.val();
            var dateFormat = new Date(meta.timestamp);
            meta.date = dateFormat.toLocaleDateString();
            this.file_list.user[ndx].meta = meta;

          }
          this.emitUserFilesEvent(this.file_list);
        });

        onChildRemoved(userFiles, (childsnapshot) => {
          this.file_list.user = this.file_list.user.filter(el => el.id !== parseInt(childsnapshot.key))
          this.emitUserFilesEvent(this.file_list);
        });
      }
    })

    //SETUP COLLECTION OF SHARED FILES (DOES NOT REQUIRE LOGIN)
    const sharedFiles = query(ref(this.db, 'shared'));

    onChildAdded(sharedFiles, (childsnapshot) => {

      //mark this as shared in the user's list
      if (childsnapshot.val().owner_uid == this.auth.currentUser.uid) {
        this.file_list.shared.push(childsnapshot.val())
        this.emitSharedFilesEvent(this.file_list);
      }
      if (childsnapshot.val().public) {
        this.file_list.public.push(childsnapshot.val());
        this.emitSharedFilesEvent(this.file_list);

      }

    });

    onChildChanged(sharedFiles, (childsnapshot) => {


      //mark this as shared in the user's list
      if (childsnapshot.val().owner_uid == this.auth.currentUser.uid) {
        this.file_list.shared.push(childsnapshot.val());
        this.emitSharedFilesEvent(this.file_list);


      }
      if (childsnapshot.val().public) {
        this.file_list.public.push(childsnapshot.val())
        this.emitSharedFilesEvent(this.file_list);

      }


    });

    //needs to redraw the files list 
    onChildRemoved(sharedFiles, (removedItem) => {

      this.file_list.shared = this.file_list.shared.filter(el => el.id !== parseInt(removedItem.key))
      this.emitSharedFilesEvent(this.file_list);


    });




  }








  /**
   * EMITTERS
   * @param data 
   */

  emitConnectionEvent(data: boolean) {
    this.connectionChangeEvent.next(data);
  }

  /**
   * Annouces changes in the auth state to components whose functionality depends on state 
   * @param data 
   */
  emitAuthEvent(user: User | null) {
    this.authChangeEvent.next(user)
  }

  // FILE FUNCTIONS

  emitUserFilesEvent(data: FilesState) {
    this.userFilesChangeEvent.next(data)
  }

  emitSharedFilesEvent(files: FilesState) {
    this.sharedFilesChangeEvent.next(files)
  }



  /**
   * AUTH
   */

  getUsername(): string {
    return this.auth.currentUser.displayName;
  }

  logout() {
    signOut(this.auth).then(() => {
      console.log("SUCCESFULLY SIGNED OUT")
    }).catch(err => {
      console.error("Could Not Sign Out")
    })
  }

  login() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }


  //DATABASE READ/WRITE

  /**
  * takes the current state, gives it a new file ID and pushes it to the database
  * @returns the id of the file
  */
  duplicate(ada: SaveObj, meta: FileMeta): Promise<number> {

    if (meta.time == undefined) meta.time = Date.now();
    meta.id = generateId(8);
    this.writeFileData(meta.id, ada);
    this.writeFileMetaData(meta)
    return Promise.resolve(meta.id);

  }

  updateLastOpened(fileid: number): Promise<boolean> {
    const user_ref = ref(this.db, 'users/' + this.auth.currentUser.uid);
    return update(user_ref, { last_opened: fileid })
      .then(success => { return Promise.resolve(true) })
      .catch(err => { return Promise.reject(err) })

  }

  public getFileSize(name: string, obj: any): number {
    const str = JSON.stringify(obj);
    const size = new Blob([str]).size;
    console.log(name + " is ", size);
    return size;

  }



  /**
   * this is called each time a meaningful change has been made in a file, 
   * usually at the same time that it is written into the timeline
   * @param fileid 
   * @param cur_state 
   */
  updateFile(cur_state: SaveObj, meta: FileMeta): Promise<boolean> {

    // this.getFileSize("version", ada.file.version);
    // this.getFileSize("workspace", ada.file.workspace);
    // this.getFileSize("type", ada.file.type);
    // this.getFileSize("nodes", ada.file.nodes);
    // this.getFileSize("tree", ada.file.tree);
    // this.getFileSize("draft nodes", ada.file.draft_nodes);
    // this.getFileSize("ops", ada.file.ops);
    // this.getFileSize("notes", ada.file.notes);
    // this.getFileSize("materials", ada.file.materials);
    // this.getFileSize("indexed_image_data", ada.file.indexed_image_data);
    // console.log('DRAFT NODES # ', ada.file.draft_nodes.length);
    // console.log('DRAFT NODES Values', ada.file.draft_nodes);

    if (this.getFileSize("file", cur_state) > 16000000) return Promise.reject("file size is too large to write")

    //do a quick correction for any undefined loom settings
    cur_state.draft_nodes.forEach(dn => {
      if (dn.loom_settings == undefined) {
        dn.loom_settings = null;
      }
    })


    console.log("WRITING FILE DATA FOR ", meta)

    return this.writeFileData(meta.id, cur_state)
      .then(success => {
        return this.updateSaveTime(meta.id)
      })
      .then(success => {
        return this.updateLastOpened(meta.id);
      })
      .catch(err => {
        return Promise.reject(err);
      })
  }


  private writeFileData(fileid: number, cur_state: SaveObj): Promise<boolean> {

    const filepath_ref = ref(this.db, 'filedata/' + fileid);
    return set(filepath_ref, { ada: cur_state })
      .then(res => {
        return Promise.resolve(true);
      })
      .catch(err => {
        console.error(err);
        return Promise.reject(err);
      })
  }




  writeFileMetaData(meta: FileMeta): Promise<boolean> {

    let user_path = ref(this.db, 'users/' + this.auth.currentUser.uid + '/files/' + meta.id);


    if (meta.from_share == undefined || meta.from_share == null) meta.from_share = '';
    if (meta.time == undefined || meta.time == null) meta.time = Date.now();

    return set(user_path, {
      name: meta.name,
      desc: meta.desc,
      timestamp: meta.time,
      from_share: meta.from_share
    })
      .then(success => { return Promise.resolve(true) })
      .catch(err => { return Promise.reject(err) })
  }

  /**
 * usually called after new data is written, this updates the time at which the file was updated and makes sure the current file id is the one that is saved as the last file opened. 
 * @param fileid 
 * @returns 
 */
  updateSaveTime(fileid: number): Promise<boolean> {

    let user_path = ref(this.db, 'users/' + this.auth.currentUser.uid + '/files/' + fileid);
    const stamp = Date.now();
    return update(user_path, { timestamp: stamp, })
      .then(res => { return Promise.resolve(true) })
      .catch(err => { return Promise.reject(err) })
  }


  /**
 * gets the share Object at a given id
 * @returns the file data
 */
  getShare(fileid: number): Promise<ShareObj> {

    return get(ref(this.db, `share/${fileid}`))
      .then((shareobj) => {

        if (shareobj.exists()) {
          return Promise.resolve(shareobj.val());
        } else {
          return Promise.reject("User found but file id not found")
        }
      }).catch(e => { console.error(e) });

  }



  /**
   * gets the file at a given id
   * @returns the file data
   */
  getFile(fileid: number): Promise<SaveObj> {

    return get(ref(this.db, `filedata/${fileid}`))
      .then((filedata) => {

        if (filedata.exists()) {
          return Promise.resolve(filedata.val().ada);
        } else {
          return Promise.reject("User found but file id not found")
        }
      }).catch(e => { console.error(e) });

  }

  /**
   * gets the file meta for a given id. 
   * @param fileid 
   * @returns the meta data
   */
  getFileMeta(fileid: number): Promise<FileMeta> {

    const file_path = ref(this.db, 'users/' + this.auth.currentUser.uid + '/files/' + fileid);
    return get(file_path).then((meta) => {

      if (meta.exists()) {
        let obj = {
          id: fileid,
          desc: meta.val().desc,
          last_opened: meta.val().last_opened,
          name: meta.val().name,
          timestamp: meta.val().timestamp,
          from_share: (meta.val().from_share == undefined) ? '' : meta.val().from_share
        }
        return Promise.resolve(obj);
      } else {
        return Promise.reject("No meta data found for file id " + fileid)
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

    remove(ref(this.db, `filedata/${fileid}`));
    remove(ref(this.db, 'users/' + this.auth.currentUser.uid + '/files/' + fileid));

  }


  /**
   * creates a new reference for a shared file 
   * @param file_id 
   * @param share_data 
   * @returns 
   */
  createSharedFile(file_id: string, share_data: ShareObj): Promise<string> {

    const shared_ref = ref(this.db, 'shared/' + file_id);

    return set(shared_ref, share_data)
      .then(success => {
        return Promise.resolve(file_id)

      })
      .catch(err => {
        console.error(err);
        return Promise.reject("could not create new shared item")
      })
  }


  /**
   * called when a user changes the license for a shared file. 
   * @param fileid 
   * @param license 
   * @returns 
   */
  updateSharedFile(fileid: string, share: ShareObj): Promise<boolean> {

    const shared_file_ref = ref(this.db, 'shared/' + fileid);

    return update(shared_file_ref, share)
      .then(success => {
        return Promise.resolve(true);
      })
      .catch(err => {
        console.error(err);
        return Promise.reject(false);
      })
  }


  /**
   * called when a user changes the license for a shared file. 
   * @param fileid 
   * @param license 
   * @returns 
   */
  updateSharedLicense(fileid: string, license: string): Promise<boolean> {

    const shared_file_ref = ref(this.db, 'shared/' + fileid);

    return update(shared_file_ref, { license: license })
      .then(success => {
        return Promise.resolve(true);
      })
      .catch(err => {
        console.error(err);
        return Promise.reject(false);
      })


  }

  /**
  * The shared entry is not the same as the file. This operation removes the entry to this file in the shared this.db but the file that was shared still exists in the files this.db. This will automatically rename that file to reflect that it used to be shared. 
  * @returns the file data
   */
  removeSharedFile(file_id: string): Promise<boolean> {

    let int_id: number = +file_id;
    remove(ref(this.db, `shared/${file_id}`)).catch(err => { return Promise.reject(err) })

    return this.getFileMeta(int_id).then(meta => {
      return update(ref(this.db, 'users/' + this.auth.currentUser.uid + '/files/' + file_id), { name: meta.name + "(previously shared)" })
        .then(val => { return Promise.resolve(true) })
        .catch(err => { return Promise.reject(err) })
    })
      .catch(err => { return Promise.reject(err) })



  }


  /**
 * checks to see if this user has an id already saved for their last used file
 * @param user 
 */
  getMostRecentFileIdFromUser(): Promise<number> {
    const user_ref = ref(this.db, `users/${this.auth.currentUser.uid}`);
    return get(user_ref).then((userdata) => {
      if (userdata.exists()) {
        return Promise.resolve(userdata.val().last_opened);
      } else {
        return Promise.reject("no last opened value found for the current user");
      }
    }).catch(err => {
      return Promise.reject(err);
    })
  }


  ngOnDestroy() {
    // when manually subscribing to an observable remember to unsubscribe in ngOnDestroy
    this.userSubscription.unsubscribe();
    this.userFilesSubscription.unsubscribe();
    this.sharedFilesSucscription.unsubscribe();
  }

}

