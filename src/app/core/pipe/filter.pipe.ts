import { Pipe, PipeTransform } from '@angular/core';

/**
 * Creates a filter pipe.
 * @class
 */
@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(value: Array<any>, args?: any): any {
    let results = [];
    if (value) {
      for (let item of value) {
        if (item) {
          let found = true;
          for (let key in args) {
            let val = args[key];

            if (val != item[key]) {
              found = false;
            }
          }

          if (found) {
            results.push(item);
          }
        }
      }
    }
    return results;
  }

}
