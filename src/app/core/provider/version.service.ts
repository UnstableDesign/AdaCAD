import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  private version: string = '4.1.5'


  constructor() { 
  }

  currentVersion() : string {
    return this.version;
  }
  


}
