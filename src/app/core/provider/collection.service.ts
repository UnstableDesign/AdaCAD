import { Injectable } from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/compat/database'
/**
 * Definition of pattern provider.
 * @class
 */
@Injectable()
export class CollectionService {

  constructor( private db: AngularFireDatabase) { }
  
  indicator: boolean = false;

 
  async getCollection(collectionName) {
    var snapshot = await this.db.database.ref("collections/").once('value');
    var returnVal = { warpSize: 0,
                      weftSize: 0
                    };
    if (snapshot.exists()) {
      snapshot.forEach(function(collection) {
        var name: string = collection.val().name;
        if (name == collectionName) {
          returnVal.warpSize = collection.val().Warps;
          returnVal.weftSize = collection.val().Wefts;
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

  async getPatternFinderIndicator() {
    return this.indicator;
  }

}
