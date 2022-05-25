import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  private version: string = '3.4.1'

  constructor() { }

  currentVersion() : string {
    return this.version;
  }  
}
