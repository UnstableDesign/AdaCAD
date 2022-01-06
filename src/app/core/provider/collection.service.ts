import { Injectable } from '@angular/core';
import { collection as mlCollections, Firestore, collectionData } from '@angular/fire/firestore';
import { Console } from 'console';
import { Observable } from 'rxjs';


interface Item {
  warps: number,
  wefts: number
};

/**
 * Definition of pattern provider.
 * @class
 */
@Injectable()
export class CollectionService {
  item$: Observable<any>;
  constructor(private firestore: Firestore) {
    const collection = mlCollections(firestore, 'items');
    this.item$ = collectionData(collection);
    console.log("Collection loaded")
    console.log(this.item$);
  }

  // constructor( 
  //    private db: Database
  //   ) { }
  
  indicator: boolean = false;

 
  async getCollection(collectionName) {
    // var snapshot = await this.db.database.ref("collections/").once('value');
    // var returnVal = { warpSize: 0,
    //                   weftSize: 0
    //                 };
    // if (snapshot.exists()) {
    //   snapshot.forEach(function(collection) {
    //     var name: string = collection.val().name;
    //     if (name == collectionName) {
    //       returnVal.warpSize = collection.val().Warps;
    //       returnVal.weftSize = collection.val().Wefts;
    //     }
    //   });
    //   console.log("Success");
    //   return returnVal;
    // } else {
    //   console.log("Error");
    //   return null;
    // }
  }

  async getCollectionNames() {
    // var ref = this.db.database.ref("collections/");
    // var returnVal = [];
    // var snapshot = await ref.once('value');

    // if (snapshot.exists()) {
    //   snapshot.forEach(function(collection) {
    //     var allLowerCaps: string = collection.val().name;
    //     var name: string = allLowerCaps.charAt(0).toUpperCase() + allLowerCaps.slice(1);
    //     returnVal.push({name: name});
    //   });
    //   return returnVal;
    // } else {
    //   return [];
    // }
  }

  async getPatternFinderIndicator() {
    return this.indicator;
  }

}
