import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireStorage } from 'angularfire2/storage';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';

/**
 * Definition of pattern provider.
 * @class
 */
@Injectable()
export class CollectionService {

  constructor(private af: AngularFireAuth, 
    private db: AngularFireDatabase,
    private st: AngularFireStorage,
    private http: HttpClient,
    private httpClient: HttpClient) { 
      console.log('db:', db);
    }

  getCollectiion() {
  }

}
