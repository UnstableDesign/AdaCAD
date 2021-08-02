import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * Definition of pattern provider.
 * @class
 */
@Injectable()
export class PatternService {

  constructor(private http: HttpClient) {  }

  getPatterns() {
    return this.http.get('assets/patterns.json', {observe: 'response'});
  }

}
