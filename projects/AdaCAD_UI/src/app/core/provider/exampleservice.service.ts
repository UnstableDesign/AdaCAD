import { Injectable } from '@angular/core';
import { Example } from '../model/datatypes';
import examples from '../../../assets/json/examples.json';

@Injectable({
  providedIn: 'root'
})
export class ExampleserviceService {

  example_set: Array<Example> = [];

  constructor() { 

    examples.examples.forEach(e => {
      this.example_set.push({
        id: e.id,
        ext: e.ext,
        desc: e.desc,
        title: e.title
      })
    })

  }

  getExamples() : Array<Example>{

    return this.example_set;
  }







}
