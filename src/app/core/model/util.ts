/**
 * Definition of Util class
 * @class
 */
class Util {
    /*Input: two arrays
    Result: a boolean value for if they are equal or not
    */
    equals(array1, array2) {
      if (array1.length != array2.length){
        return false;
      } 
      else {
        for (var i =0; i < array1.length; i++) {
          if(array1[i] != array2[i]) {
            return false;
          }
        }
        return true;
      }
    }
  
    /*Input: an array of booleans
    Result: the number of "ones" in the "bitstring" (in this context, returns the number of true valued booleans in the array of booleans)
    */
    countOnes(array) {
      var counter = 0;
      for (var i = 0; i < array.length; i++) {
        if(array[i] == true) {
          counter+=1;
        }
      }
      return counter;
    }
    /*Input: two arrays of booleans
    Result: a new array of length equal to the length of array1 that has combined array1 with array2 under the "exclusive or" operation
    */
    xor(array1, array2) {
      var returnedList = [];
      for (var i = 0; i < array1.length; i++) {
        if (array1[i] && array2[i]) {
          returnedList.push(false);
        } else if (array1[i] || array2[i]) {
          returnedList.push(true);
        } else {
          returnedList.push(false);
        }
      }
      return returnedList;
    }
  }
  
  //makes it so that we are using this util class as a singleton (referenced: https://www.digitalocean.com/community/tutorials/js-js-singletons)
  const utilInstance = new Util();
  Object.freeze(utilInstance);
  export default utilInstance;