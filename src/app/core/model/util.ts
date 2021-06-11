/**
 * A collection of functions that are heplful within many areas of the tool
 * @class
 */

import { SubdraftComponent } from "../../mixer/palette/subdraft/subdraft.component";
import { Point, Interlacement, Bounds } from "./datatypes";
import { Draft } from "./draft";


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

    /**
     * A function to count the number of occurances of a give value within an array
     * @param arr the arary to search
     * @param val the value we are seeking
     * @returns number of occurances
     */
    public countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);

      
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

    maxOfPositiveList(array) {
      var max = -1;
      for (var i = 0; i < array.length; i++){
        if (array[i] > max) {
          max = array[i];
        }
      }
      return max;
    }

    minOfList(array) {
      var min = array[0]
      for (var i = 0; i < array.length; i++) {
        if (array[i] < min) {
          min = array[i]
        }
      }
      return min;
    }

    findSmallestElmtBiggerThan(n, array) {
      var minElmtBiggerThanN = this.maxOfPositiveList(array) + 1;
      for (var i =0; i < array.length; i++) {
        if (array[i] > n && minElmtBiggerThanN[i] > array[i]) {
          minElmtBiggerThanN = array[i];
        }
      }
      return minElmtBiggerThanN;
    }

    findSmallestGap(array) {
      var min = this.minOfList(array);
      var smallestElmtBiggerThan = this.findSmallestElmtBiggerThan(min,array);
      var max = this.maxOfPositiveList(array);
      while (smallestElmtBiggerThan-min < 2 && smallestElmtBiggerThan != (max+1)) {
        min = min+1;
        smallestElmtBiggerThan = this.findSmallestElmtBiggerThan(min,array);
      }
      return smallestElmtBiggerThan;
    }


  /**
   * finds the left-most component, used to create bounding box 
   * @param main the component we are comparing to
   * @param isects all intersecting components
   * @returns the leftmost component
   */
  getLeftMost(main:SubdraftComponent,  isects:Array<SubdraftComponent>):SubdraftComponent{

    return isects.reduce((acc, isect) => {
      if(isect.getTopleft().x < acc.getTopleft().x) {
        acc = isect;
      }
      return acc;
    }, main);    
  }


  /**
   * finds the top-most component, used to create bounding box 
   * @param main the component we are comparing to
   * @param isects all intersecting components
   * @returns the top component
   */
  getTopMost(main:SubdraftComponent,  isects:Array<SubdraftComponent>):SubdraftComponent{

    return isects.reduce((acc, isect) => {
      if(isect.getTopleft().y < acc.getTopleft().y) {
        acc = isect;
      }
      return acc;
    }, main);    
  }


  /**
   * finds the right-most component, used to create bounding box 
   * @param main the component we are comparing to
   * @param isects all intersecting components
   * @returns the rightmost component
   */
  getRightMost(main:SubdraftComponent,  isects:Array<SubdraftComponent>):SubdraftComponent{

    return isects.reduce((acc, isect) => {
      if((isect.getTopleft().x + isect.bounds.width) > (acc.getTopleft().x + acc.bounds.width)) {
        acc = isect;
      }
      return acc;
    }, main);    
  }

  /**
   * finds the bottom-most component, used to create bounding box 
   * @param main the component we are comparing to
   * @param isects all intersecting components
   * @returns the bottom-most component
   */
  getBottomMost(main:SubdraftComponent,  isects:Array<SubdraftComponent>):SubdraftComponent{

    return isects.reduce((acc, isect) => {
      if((isect.getTopleft().y + isect.bounds.height)> (acc.getTopleft().y + acc.bounds.height)) {
        acc = isect;
      }
      return acc;
    }, main);    
  }

  /**
   * takes absolute screen coordinates and returns the i, j position if a cell were to exist at that point
   * considers the top banner of 62 pixels to offset
   * @param p the point
   * @param scale the scale of the view we are using
   * @returns an Interlacement
   */
  resolveCoordsToNdx(p: Point, scale:number) : Interlacement {  
    const i = Math.floor((p.y - 62) / scale);
    const j = Math.floor((p.x) / scale);
    return {i: i, j: j, si: i};
  }

  /**
   * takes two interlacements and sees if they are the same
   * @param p1 the point
   * @param p2 the point
   */
  isSameNdx(p1: Interlacement, p2:Interlacement) : boolean {    
    if(p1.i != p2.i ) return false;
    if(p1.j != p2.j) return false;
    return true;
  }

   /**
   * takes two booleans and returns their result based on the ink assigned
   * @param ink the name of the ink in question 
   * @param a the first (top) value 
   * @param b the second (under) value
   * @returns boolean result
   */
  computeFilter(ink: string, a: boolean, b: boolean):boolean{
      switch(ink){
        case 'neq':
          if(a === null) return b;
          if(b === null) return a;
          return (a !== b);
        break;
  
        case 'up':
          if(a === null) return b;
          if(a === true) return true;
          return false;
        break;
  
        case 'down':
          if(a === null) return b;
          if(b === null) return a;
          if(a === false) return false;
          return b;
        break;
  
        case 'unset':
          if(a === null) return b;
          if(b === null) return a;
          if(a === true) return null;
          else return b;
        break;
  
        case 'and':
        if(a === null || b === null) return null;
        return (a && b)
        break;
  
        case 'or':
          if(a === null) return b;
          if(b === null) return a;
          return (a || b);
        break;
  
      }
    }

/**
 * check if the rectangles defined by the points overlap
 * @param l1 top left point of rectangle 1
 * @param r1 bottom right point of rectangle 1
 * @param l2 top left point of rectangle 2
 * @param r2 bottom right point of rectanble 2
 * @returns true or false in accordance to whether or not they overlap
 */
  doOverlap(l1:Point,  r1:Point,  l2:Point,  r2:Point){

    if (l1.x == r1.x || l1.y == r2.y || l2.x == r2.x
        || l2.y == r2.y) {
        // the line cannot have positive overlap
        return false;
    }

    // If one rectangle is on left side of other
    if (l1.x >= r2.x || l2.x >= r1.x){
        return false;
      }

    // If one rectangle is above other
    if (l1.y >= r2.y || l2.y >= r1.y){
        return false;
    }
    return true;
  }

   /**
   * returns a Bounds type that represents the intersection between primary and one intersecting subdraft
   * @param primary the rectangular area we are checking for intersections
   * @param isect an array of all the components that intersect
   * @returns the array of bounds of all intersections
   */
    getIntersectionBounds(primary: SubdraftComponent, isect: SubdraftComponent):Bounds{

      const left: number = Math.max(primary.bounds.topleft.x, isect.bounds.topleft.x);
      const top: number = Math.max(primary.bounds.topleft.y, isect.bounds.topleft.y);
      const right: number = Math.min((primary.bounds.topleft.x + primary.bounds.width), (isect.bounds.topleft.x + isect.bounds.width));
      const bottom: number = Math.min((primary.bounds.topleft.y + primary.bounds.height), (isect.bounds.topleft.y + isect.bounds.height));
  
      return {
        topleft: {x: left, y: top},
        width: right - left,
        height: bottom - top
      };
  
    }
  
    /**
     * gets the combined boundary of a Subdraft and any of its intersections
     * @param moving A SubdraftComponent that is our primary subdraft
     * @param isect  Any subdrafts that intersect with this component 
     * @returns the bounds of a rectangle that holds both components
     */
    getCombinedBounds(moving: SubdraftComponent, isect: Array<SubdraftComponent>):Bounds{
      
      const bounds: Bounds = {
        topleft: {x: 0, y:0},
        width: 0,
        height: 0
      }
  
      bounds.topleft.x = utilInstance.getLeftMost(moving, isect).getTopleft().x;
      bounds.topleft.y = utilInstance.getTopMost(moving, isect).getTopleft().y;
  
      const rm =  utilInstance.getRightMost(moving, isect);
      const bm =  utilInstance.getBottomMost(moving, isect);
  
      bounds.width = (rm.getTopleft().x + rm.bounds.width) - bounds.topleft.x;
      bounds.height =(bm.getTopleft().y + bm.bounds.height) - bounds.topleft.y;
  
      return bounds;
  
    }

    /**
     * computes the value of a heddle given overlapping drafts
     * @param p the point we are interested in
     * @param main the top draft
     * @param isect the intersecting drafts
     * @returns 
     */
    computeHeddleValue(p:Point, main: SubdraftComponent, isect: Array<SubdraftComponent>):boolean{
      const a:boolean = main.resolveToValue(p);
      //this may return an empty array, because the intersection might not have the point
      const b_array:Array<SubdraftComponent> = isect.filter(el => el.hasPoint(p));
  
      //should never have more than one value in barray
      // if(b_array.length > 1) console.log("WARNING: Intersecting with Two Elements");
  
      const val:boolean = b_array.reduce((acc:boolean, arr) => arr.resolveToValue(p), null);   
      
      return utilInstance.computeFilter(main.ink, a, val);
    }


    getAdjustedPointerPosition(p: Point, viewport:Bounds) : any {   
      return {
        x: p.x + viewport.topleft.x,
        y: p.y + viewport.topleft.y -62
      } 
    }

    /**
   * takes an absolute point and returns the "cell" boundary that is closest. 
   * @param p the absolute point
   * @returns the snapped point 
   */
    snapToGrid(p: Point, scale:number):Point{

      p.x = Math.floor(p.x / scale) * scale;
      p.y = Math.floor(p.y / scale) * scale;
      return p;

    }

/**
 * Takes an absolute coordinate and translates to a number that would represent its grid position on screen
 * used only for testing if a new move calculation should be called
 * @param p the screen coordinate
 * @returns the row and column within the draft (i = row, j=col), returns -1 if out of bounds
 */
   public resolvePointToAbsoluteNdx(p:Point, scale:number) : Interlacement{
    
    let i = Math.floor((p.y) / scale);
    let j = Math.floor((p.x) / scale);

    return {i: i, j:j, si: i};

  }

  /**
   * returns the number of wefts that is greatest out of all the input drafts
   * 
   */
  public getMaxWefts(inputs: Array<Draft>) : number{
    const max_wefts:number = inputs.reduce((acc, draft)=>{
      if(draft.wefts > acc) return draft.wefts;
      return acc;
      }, 0);
      return max_wefts;
  }

  /**
 * returns the number of warps that is greatest out of all the input drafts
 */
    public getMaxWarps(inputs: Array<Draft>) : number{
    const max_warps:number = inputs.reduce((acc, draft)=>{
      if(draft.warps > acc) return draft.warps;
      return acc;
      }, 0);
      return max_warps;
  }
  

}
  
  //makes it so that we are using this util class as a singleton (referenced: https://www.digitalocean.com/community/tutorials/js-js-singletons)
  const utilInstance = new Util();
  Object.freeze(utilInstance);
  export default utilInstance;