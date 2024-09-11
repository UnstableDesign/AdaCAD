import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  private version: string = '4.1.1'
  private log: Array<{v: string, note: string}> = [];


  


  constructor() { 

    this.log.push(
      {v: '4.1.1', 
      note: "added fullscreen option via minimize and maximize icon button on bottom left, for Julia Wright"}
    );
  }

  currentVersion() : string {
    return this.version;
  }
  
  getLog(){
    return this.log;
  }

}
