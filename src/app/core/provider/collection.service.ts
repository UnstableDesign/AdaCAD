import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * Definition of pattern provider.
 * @class
 */
@Injectable()
export class CollectionService {

  constructor(private http: HttpClient) { }

  getCollectiion() {
    return this.http.get('assets/collections.json', {observe: 'response'});
  }

}
