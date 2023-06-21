import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  private version: string = '4.0.0'

  constructor() { }

  currentVersion() : string {
    return this.version;
  }  



}
