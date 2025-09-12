import { Injectable } from '@angular/core';

/**
 * This service manages the information associated with the current workspace 
 */
@Injectable({
  providedIn: 'root'
})
export class FilesystemService {


  //CURRENTLY LOADED FILE
  current_file = {
    id: -1,
    name: 'no name',
    desc: '',
    from_share: '',

  }




  constructor() {
  }







  // this.file_tree = [];

  // //SETUP COLLECTION OF SHARED FILES (DOES NOT REQUIRE LOGIN)
  // const sharedFiles = query(ref(this.db, 'shared'));

  // onChildAdded(sharedFiles, (childsnapshot) => {
  //   //only add values that haven't already been added
  //   if (this.file_tree.find(el => el.id === parseInt(childsnapshot.key)) !== undefined) {
  //     this.shared_file_change$.next(this.file_tree.slice());
  //   }

  //   if (childsnapshot.val().public) {
  //     if (this.public_files.find(el => el.id === parseInt(childsnapshot.key)) === undefined) {
  //       this.public_files.push({ id: childsnapshot.key, val: childsnapshot.val() })
  //       this.public_file_change$.next(this.public_files.slice());
  //     }
  //   }
  // });

  // onChildChanged(sharedFiles, (data) => {
  //   const ndx = this.file_tree.findIndex(el => parseInt(el.id) === parseInt(data.key));
  //   if (ndx !== -1) {

  //     this.isShared(data.key).then(res => {
  //       this.file_tree[ndx].shared = res;
  //       this.shared_file_change$.next(this.file_tree.slice());
  //     }).catch(err => console.error("caught"))

  //   }

  //   if (data.val().public) {
  //     const ndx = this.public_files.findIndex(el => el.id == data.key);
  //     if (ndx !== -1) {
  //       this.public_files[ndx].val = data.val();
  //       this.public_file_change$.next(this.public_files.slice());
  //     }
  //   }

  // });

  // //needs to redraw the files list 
  // onChildRemoved(sharedFiles, (removedItem) => {

  //   const removedId = removedItem.key;
  //   const ndx = this.file_tree.findIndex(el => parseInt(el.id) === parseInt(removedId));
  //   if (ndx !== -1) {
  //     this.file_tree[ndx].shared = null;
  //     this.shared_file_change$.next(this.file_tree.slice());
  //   }

  //   if (removedItem.val().public) {
  //     this.public_files = this.public_files.filter(el => el.id !== removedId);
  //     this.public_file_change$.next(this.public_files.slice());
  //   }

  // });



  //   authState(this.auth).subscribe(user => {

  //     if (user == null) {
  //       this.file_tree = [];
  //       return;
  //     }


  //     const userFiles = query(ref(this.db, 'users/' + user.uid + '/files'), orderByChild('timestamp'));

  //     //called once per item, then on subsequent changes
  //     onChildAdded(userFiles, (childsnapshot) => {

  //       //only add values that haven't already been added
  //       if (this.file_tree.find(el => el.id === parseInt(childsnapshot.key)) === undefined) {

  //         this.addToTree(parseInt(childsnapshot.key), childsnapshot.val(), undefined);


  //         this.isShared(childsnapshot.key).then(res => {
  //           this.updateShareObj(parseInt(childsnapshot.key), res);
  //           this.file_tree_change$.next(this.file_tree.slice());

  //         }).catch(err => {
  //           //file note shared 
  //         })


  //       }
  //     });







  //     //called when anything in meta changes
  //     onChildChanged(userFiles, (data) => {
  //       const ndx = this.file_tree.findIndex(el => parseInt(el.id) === parseInt(data.key));
  //       if (ndx !== -1) {
  //         this.file_tree[ndx].meta.name = data.val().name;

  //         this.isShared(data.key).then(res => {
  //           this.file_tree[ndx].shared = res;
  //           this.file_tree_change$.next(this.file_tree.slice());

  //         }).catch(err => {
  //           this.file_tree_change$.next(this.file_tree.slice());
  //         })

  //       }
  //     });



  //     //needs to redraw the files list 
  //     onChildRemoved(userFiles, (removedItem) => {
  //       const removedId = removedItem.key;
  //       this.file_tree = this.file_tree.filter(el => parseInt(el.id) !== parseInt(removedId));
  //       this.file_tree_change$.next(this.file_tree.slice());
  //     });


  //   });


  // }
}

/**
  sets the current file data locally
 */
//   public updateCurrentFileInfo(id: number, name: string, desc: string, from_share: string) {

//     //CURRENTLY LOADED FILE
//     this.current_file = { id, name: 'no name', desc, from_share }

//     //IF THIS FILE EXISTS IN THE DATABASE, UPDATE IT THERE TOO

//   }

// }

// public unloadFile(id: number){
//   this.loaded_files = this.loaded_files.filter(el => el.id !== id);
//   if(this.current_file_id == id) this.current_file_id = -1;
//   this.loaded_file_change$.next(this.file_tree.slice());

// }







// /**
//  * adds to the local tree for the UI
//  */
// updateShareObj(fileid: number, shared: ShareObj) {

//   const ndx = this.file_tree.findIndex(el => el.id == fileid);
//   if (ndx !== -1) {
//     this.file_tree[ndx].shared = shared;
//   }
// }





/**
 * if a user only has an ada file on their user id, this converts it to a file that is stored in teh filesystem
 * @param ada
 * @returns the id of the file
 */
// convertAdaToFile(uid: string, ada: any): Promise < number > {

//   const fileid = this.generateFileId();
//   this.writeFileData(fileid, ada);
//   this.writeFileMetaData(uid, fileid, 'recovered draft', '', '')
//     return Promise.resolve(fileid);

// }




/**
 * checks if and how a particular file id is being shared
 * @param file_id
 */
// isShared(file_id: string): Promise < ShareObj > {
//   // if(!this.connected) return Promise.reject("no internet connection");


//   const ref = fbref(this.db, 'shared/' + file_id);
//   return fbget(ref)
//     .then((filedata) => {
//       if (filedata.exists()) {

//         const share_obj: ShareObj = {
//           desc: filedata.val().desc,
//           license: filedata.val().license,
//           filename: filedata.val().filename,
//           img: filedata.val().img,
//           owner_creditline: filedata.val().owner_creditline,
//           owner_uid: filedata.val().owner_uid,
//           owner_url: filedata.val().owner_url,
//           public: filedata.val().public
//         }

//         return Promise.resolve(share_obj);

//       } else {
//         return Promise.reject('No shared file with id: ' + file_id)
//       }

//     })
// }










// /**
//  * usually called after new data is written, this updates the time at which the file was updated and makes sure the current file id is the one that is saved as the last file opened.
//  * @param fileid
//  * @returns
//  */
// updateSaveTime(fileid: number) {
//   if (!this.connected) return;
//   const auth = getAuth();
//   const user = auth.currentUser;

//   if (user == null) return;

//   const stamp = Date.now();
//   update(fbref(this.db, `users/${user.uid}`), { last_opened: fileid });
//   update(fbref(this.db, 'users/' + user.uid + '/files/' + fileid), {
//     timestamp: stamp,
//   });



// }



/**
 * writes the data for the currently open file to the database
 * @param cur_state
 * @returns
 */
// writeFileData(fileid: number, cur_state: SaveObj) {

//   console.log("WRITING FILE DATA FOR ", fileid)

//   if (!this.connected) return;

//   const ref = fbref(this.db, 'filedata/' + fileid);

//   update(ref, { ada: cur_state })
//     .then(success => {
//       this.updateSaveTime(fileid)
//     })
//     .catch(err => {
//       console.error(err);
//     })
// }


// writeFileMetaData(uid: string, fileid: number, name: string, desc: string, from_share: string) {

//   if (!this.connected) return;

//   if (from_share == undefined || from_share == null) from_share = '';

//   const stamp = Date.now();
//   update(fbref(this.db, 'users/' + uid + '/files/' + fileid), {
//     name: name,
//     desc: desc,
//     timestamp: stamp,
//     from_share: from_share
//   });
//   update(fbref(this.db, 'users/' + uid), { last_opened: fileid });

// }












