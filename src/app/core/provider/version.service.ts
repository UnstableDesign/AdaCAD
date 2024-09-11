import { Injectable } from '@angular/core';
import version_history from '../../../assets/json/version_history.json';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  private version: string = '4.1.1'


  


  constructor() { 
    console.log("VERSION HISTORY ", version_history)
  }

  currentVersion() : string {
    return this.version;
  }
  
  getLog(){

    return this.version;
  }

}
