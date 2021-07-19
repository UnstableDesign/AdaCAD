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

 
  async getCollection(collectionName) {
    var snapshot = await this.db.database.ref("collections/").once('value');
    var returnVal = [];
    if (snapshot.exists()) {
      snapshot.forEach(function(collection) {
        var name: string = collection.val().name;
        if (name == collectionName) {
          for (var i = 0; i < collection.val().clusterCount; i++) {
            let tempObj = {centroid: collection.val().centroids[i],
              cluster: eval('collection.val().cluster' + i + ';')
            };
            returnVal.push(tempObj);
          }
        }
      });
      console.log("Success");
      return returnVal;
    } else {
      console.log("Error");
      return null;
    }
  }

  async getCollectionNames() {
    var ref = this.db.database.ref("collections/");
    var returnVal = [];
    var snapshot = await ref.once('value');

    if (snapshot.exists()) {
      snapshot.forEach(function(collection) {
        var allLowerCaps: string = collection.val().name;
        var name: string = allLowerCaps.charAt(0).toUpperCase() + allLowerCaps.slice(1);
        returnVal.push({name: name});
      });
      return returnVal;
    } else {
      return [];
    }
  }

}
