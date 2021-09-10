import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Pattern } from '../model/pattern';

/**
 * Definition of pattern provider.
 * @class
 */
@Injectable()
export class PatternService {

  patterns: Array<Pattern> = [];


  constructor(private http: HttpClient) { 
    this.fetchDefaultPatterns();

  }

  overridePatterns(patterns: Array<Pattern>){
    this.patterns = patterns;
  }

  getPatterns(): Array<Pattern>{
    return this.patterns;
  }

  getPattern(id: number): Pattern{
    return this.patterns[id];
  }

  setPattern(id: number, pattern: Pattern){
    this.patterns[id] = pattern;
  }



  fetchDefaultPatterns() {

    this.http.get('assets/patterns.json', {observe: 'response'}).subscribe((res) => {
      for(var i in res.body){
        const np:Pattern = new Pattern(res.body[i]);
        if(np.id == -1) np.id = this.patterns.length;
        this.patterns.push(np);
      }
   }); 
  }




}
