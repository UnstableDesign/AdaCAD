import { Injectable } from '@angular/core';
import { Firestore } from 'firebase/firestore';
import { AuthService } from './auth.service';
import {getDatabase, ref as fbref, set as fbset, onValue} from '@angular/fire/database'



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
 * files{
 *  id: 
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

  constructor(firestore: Firestore, public auth: AuthService) {

    const db = getDatabase();


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



