import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireStorage } from 'angularfire2/storage';
import { AngularFireDatabase, AngularFireList, snapshotChanges } from 'angularfire2/database';
import { reject } from 'lodash';

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
      console.log('db constrructed for CollectionService');
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
    // ref.once('value').then((snapshot) => {
    //   snapshot.forEach(data => {
    //     returnVal.push(data.key);
    //   });
    //   return returnVal;
    // });
    var snapshot = await ref.once('value');

    if (snapshot.exists()) {
      snapshot.forEach(function(data) {
        returnVal.push(data.key);
      });
      return returnVal;
    } else {
      return [];
    }
    // ref.on("value", function(data) {
    //   data.forEach(function(data) {
    //     returnVal.push(data.key);
    //   });
    //   console.log("returnVal", returnVal);
    //   return returnVal;
    // });
  }

  // public getCollectionNames = new Promise((resolve, reject) => {
  //   var ref = this.db.database.ref("collections/");
  //   var returnVal: any[] = [];
  //   ref.on("value", function(data) {
  //     data.forEach(function(data) {
  //       returnVal.push(data.key);
  //     });
  //     resolve(returnVal);
  //   });
  // })

}
