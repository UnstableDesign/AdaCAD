import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class PatternService {

  constructor(private http: Http) { }

  getPatterns() {
    return this.http.get('assets/patterns.json')
      .map((response: Response) => response.json());
  }

}
