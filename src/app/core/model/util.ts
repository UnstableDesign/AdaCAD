/**
 * A collection of functions that are heplful within many areas of the tool
 * @class
 */

import { SubdraftComponent } from "../../mixer/palette/subdraft/subdraft.component";
import { MaterialMap } from "../provider/materials.service";
import { Point, Interlacement, Bounds } from "./datatypes";
import { Draft } from "./draft";
import { Shuttle } from "./shuttle";


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

    const max_wefts:number = inputs
    .filter(el => el !== null)
    .reduce((acc, draft)=>{
      if(draft.wefts > acc) return draft.wefts;
      return acc;
      }, 0);
      return max_wefts;
  }

  /**
 * returns the number of warps that is greatest out of all the input drafts
 */
    public getMaxWarps(inputs: Array<Draft>) : number{


    const max_warps:number = inputs
    .filter(el => el !== null)
    .reduce((acc, draft)=>{
      if(draft.warps > acc) return draft.warps;
      return acc;
      }, 0);
      return max_warps;
  }

  /**
   * given a list of values, return the value that occurs the most
   * @param vals 
   */
  public getMostCommon(vals: Array<any>): any{

    const freq: Array<{i: any,count: any}>  = vals.reduce((acc, el) => {
      const ndx = acc.findIndex(acc_el => acc_el.i === el);  
      if(ndx === -1){
        acc.push({i: el, count: 1});
      }else{
        acc[ndx].count++;
      }
      return acc;
    }, []);

    const common:{i: any,count: any} = freq.reduce((acc, el) => {
      if(el.count > acc.count) return el;
    }, {i:null, count: 0});

    return common.i;
  }

  getInt(val, e) {
    var index = e.search(val);
    if (index != -1) {
      var substring = e.substring(index, e.length);
      var endOfLineChar = '\n';
      var endIndex = substring.indexOf(endOfLineChar);
      if (endIndex!= -1) {
        return +(substring.substring(val.length+1,endIndex)); //string is converted to int with unary + operator
      } else {
        return -1;
      }
    } else {
      return -1;
    }
  }


  getBool(val, e) {
    var index = e.search(val);
    if (index != -1) {
      var substring = e.substring(index, e.length);
      var endOfLineChar = '\n';
      var endIndex = substring.indexOf(endOfLineChar);
      if (endIndex!= -1 && substring.substring(val.length+1,endIndex) === "yes") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  getString(val, e) {
    var index = e.search(val);
    if (index != -1) {
      var substring = e.substring(index, e.length);
      var endOfLineChar = '\n';
      var endIndex = substring.indexOf(endOfLineChar);
      if (endIndex != -1) {
        return substring.substring(val.length+1, endIndex);
      } else {
        return "";
      }
    } else {
      return "";
    }
  }

  getSubstringAfter(val, e){
    var index = e.search(val);
    if( index != -1 ){
      return e.substring(index+val.length);
    } else {
      return e;
    }
  }

  getTreadling(e, draft) {
    var treadling = [];
    var treadles = this.getInt("Treadles", e);

    for (var i=0; i  < draft.wefts; i++) {
      treadling.push(-1);
    }

    var indexOfLabel = e.search("TREADLING]");
    var startIndex = indexOfLabel + "TREADLING]".length+1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar)+startIndex;
    var line = e.substring(startIndex, endIndex);

    while(line.match(/[0-9]*=[0-9]*/) != null) {
      var weft = +(line.match(/[0-9]*/));
      var treadle = +(line.match(/=[0-9]*/)[0].substring(1));
      treadling[weft-1] = treadle-1;
      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }

    return treadling;
  }

  getThreading(e, draft) {
    var threading = [];

    for (var i = 0; i < draft.warps; i++) {
      threading.push(-1);
    }

    var indexOfLabel = e.search("THREADING]");
    var startIndex = indexOfLabel + "THREADING]".length+1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar)+startIndex;
    var line = e.substring(startIndex, endIndex);

    while (line.match(/[0-9]*=[0-9]*/) != null) {
      var warp = +(line.match(/[0-9]*/));
      var frame = +(line.match(/=[0-9]*/)[0].substring(1));
      threading[draft.warps - warp] = frame-1;
      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }

    return threading;
  }

  getTieups(e, draft) {
    var tieups = [];
    var frames = this.getInt("Shafts", e);
    var treadles = this.getInt("Treadles", e);

    for (var i = 0; i < frames; i++) {
      tieups.push([]);
      for (var j = 0; j < treadles; j++) {
        tieups[i].push(false);
      }
    }

    var indexOfLabel = e.search("TIEUP]");
    var startIndex = indexOfLabel + "TIEUP]".length+1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar)+startIndex;
    var line = e.substring(startIndex, endIndex);

    while (line.match(/[0-9]*=[0-9]*/) != null) {
      var treadle = +(line.match(/[0-9]*/));
      var firstFrame = +(line.match(/=[0-9]*/)[0].substring(1));
      tieups[firstFrame-1][treadle-1] = true;
      var restOfFrames = line.match(/,[0-9]/g);
      if(restOfFrames != null) {
        for (var i = 0; i < restOfFrames.length; i++) {
          var currentFrame = +(restOfFrames[i].substring(1));
          tieups[currentFrame-1][treadle-1] = true;
        }
      }
      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }
      
    return tieups;
  }

  //can likely simplify this as it is mostlyy like the function above but with different variable names for the respective applications
  getColorTable(e) :Array<Shuttle>  {
    var color_table = [];
    var originalShuttle = new Shuttle();
    originalShuttle.setColor("#3d3d3d");
    originalShuttle.setID(0);
    color_table.push(originalShuttle);

    var indexOfLabel = e.search("COLOR TABLE]");
    var startIndex = indexOfLabel + "COLOR TABLE]".length+1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar)+startIndex;
    var line = e.substring(startIndex, endIndex);
    var id = 1;

    while (line.match(/[0-9]*=[0-9]*,[0-9]*,[0-9]*/) != null) {
      // var index = +(line.match(/[0-9]*/));
      var redNum = +(line.match(/=[0-9]*/)[0].substring(1));
      var greenAndBlue = line.match(/,[0-9]*/g);
      var greenNum = +(greenAndBlue[0].substring(1));
      var blueNum = +(greenAndBlue[1].substring(1));

      var hex = "#";
      var hexr = redNum.toString(16);
      if(hexr.length ==1 ){
        hex += "0"+hexr;
      } else {
        hex += hexr;
      }
      var hexg= greenNum.toString(16);
      if(hexg.length ==1 ){
        hex += "0"+hexg;
      } else {
        hex += hexg;
      }
      var hexb= blueNum.toString(16);
      if(hexb.length ==1 ){
        hex += "0"+hexb;
      } else {
        hex += hexb;
      }

      var shuttle = new Shuttle();
      shuttle.setColor(hex);
      shuttle.setID(id);
      id++;

      color_table.push(shuttle);

      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }
    return color_table;
  }

  getColToShuttleMapping(e, draft) {
    var colToShuttleMapping = [];

    for (var i = 0; i < draft.warps; i++) {
      colToShuttleMapping.push(0);
    }

    var indexOfLabel = e.search("WARP COLORS]");
    var startIndex = indexOfLabel + "WARP COLORS]".length+1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar)+startIndex;
    var line = e.substring(startIndex, endIndex);

    while (line.match(/[0-9]*=[0-9]*/) != null) {
      var warp = +(line.match(/[0-9]*/));
      var color = +(line.match(/=[0-9]*/)[0].substring(1));
      colToShuttleMapping[warp-1] = color;
      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }

    var reversedMapping = [];
    for (var i = colToShuttleMapping.length-1; i >= 0; i--) {
      reversedMapping.push(colToShuttleMapping[i]);
    }

    return reversedMapping;
  }

  getRowToShuttleMapping(e, draft) {
    var rowToShuttleMapping = [];

    for (var i = 0; i < draft.wefts; i++) {
      rowToShuttleMapping.push(0);
    }

    var indexOfLabel = e.search("WEFT COLORS]");
    var startIndex = indexOfLabel + "WEFT COLORS]".length+1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar)+startIndex;
    var line = e.substring(startIndex, endIndex);

    while (line.match(/[0-9]*=[0-9]*/) != null) {
      var weft = +(line.match(/[0-9]*/));
      var color = +(line.match(/=[0-9]*/)[0].substring(1));
      rowToShuttleMapping[weft-1] = color;
      startIndex = endIndex+1;
      endIndex = e.substring(startIndex).indexOf(endOfLineChar)+startIndex;
      line = e.substring(startIndex,endIndex);
    }

    return rowToShuttleMapping;
  }

  /**
   * this takes a map of material ideas and updates 
   * @param material_mapping - the mapping of rows of cols to a material 
   * @param index_map - a map from old to new material ids
   * @param replacement_ndx - anything not found in the map will be replaced by this value
   */
  updateMaterialIds(material_mapping: Array<number>, index_map: Array<MaterialMap>, replacement_ndx:number) : Array<number>{

    //update the existing drafts given the new ids
      const new_map: Array<number> = material_mapping.map(index => {
        const mapping: MaterialMap = index_map.find(el => el.old_id === index);
        if(mapping !== undefined){
          return mapping.new_id;
        }else{
          return replacement_ndx;
        }
   


    });

    return new_map;
  
  }

  /**
   * takes an array of numbers and returns the highest number
   * @param arr 
   * @returns 
   */
  getArrayMax(arr: Array<number>) : number{
    const max: number = arr.reduce((acc, el, ndx)=>{
      if(el > acc) return el;
      else return acc;
    }, 0);
    return max;
  }

  /**
   * when interlacing two drafts, make sure that each draft maps to a unique set of systems before merging. for instance 
   * merging systems of type a and a generates an a b sequence
   * @param systems the system mappings to compare
   */
  makeSystemsUnique(systems: Array<Array<number>>) : Array<Array<number>> {
   
    const max_in_systems: Array<number> = systems.map(el => this.getArrayMax(el));
    let max_total: number = this.getArrayMax(max_in_systems);


    const visited_systems: Array<Array<number>> = [];

    systems.forEach((system, ndx) => {
      if(visited_systems.length > 0){

        const has_repeat: Array<number> = system.map(el => visited_systems.findIndex(el => el));
        system = has_repeat.map((el, ndx) => {
          if(el != -1){
            return el = system[ndx] + max_total;
          } 
        });
        max_total += max_in_systems[ndx];

      }
      visited_systems.push(system);
    });
    return visited_systems;
  }

  public patternToSize(pattern, warpSize, weftSize) {
    if (pattern[0].length > warpSize) {
        for (var i = 0; i < pattern.length; i++) {
            while(pattern[i].length > warpSize) {
                pattern[i].splice(pattern[i].length-1, 1);
            }
        }
    }
    if (pattern.length > weftSize) {
        while(pattern.length > weftSize) {
            pattern.splice(pattern.length-1, 1);
        }
    }
    var idx = 0;
    while (pattern[0].length < warpSize) {
        for (var j = 0; j < pattern.length; j++) {
            if (idx < pattern[j].length) {
                pattern[j].push(pattern[j][idx]);
            }
        }
        idx += 1;
        if (idx >= pattern[0].length) {
            idx = 0;
        }
    }
    idx = 0;
    while (pattern.length < weftSize) {
        pattern.push(pattern[idx]);
        idx += 1;
        if (idx >= pattern.length) {
            idx = 0;
        }
    }
    return pattern;
}


}
  
  //makes it so that we are using this util class as a singleton (referenced: https://www.digitalocean.com/community/tutorials/js-js-singletons)
  const utilInstance = new Util();
  Object.freeze(utilInstance);
  export default utilInstance;