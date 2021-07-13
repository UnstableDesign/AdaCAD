import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireStorage } from 'angularfire2/storage';
import { AngularFireDatabase, AngularFireList, snapshotChanges } from 'angularfire2/database';
import { reject } from 'lodash';
import { stratify } from 'd3';

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
    }

  /*
  Referenced: https://www.tutorialspoint.com/firebase/firebase_event_types.htm
   */
  getCollection(collectionName) {
    this.db.database.ref("collections/" + collectionName).on("value", function(snapshot) {
      return snapshot.val();
    }, function(error) {
      console.log("Error: " + error.code);
      return null;
    });
  }

  async getCollectionNames() {
    var ref = this.db.database.ref("collections/");
    var returnVal = [];
    var snapshot = await ref.once('value');

    if (snapshot.exists()) {
      snapshot.forEach(function(data) {
        var allLowerCaps = data.key;
        var name = allLowerCaps.charAt(0).toUpperCase() + allLowerCaps.slice(1);
        returnVal.push({name: name});
      });
      return returnVal;
    } else {
      return [];
    }
  }

}
