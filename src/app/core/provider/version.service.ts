import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  private version: string = '3.4.3'

  constructor() { }

  currentVersion() : string {
    return this.version;
  }  
}
