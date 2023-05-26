
import { createCellFromSequenceVal, getCellValue } from "./cell";
import { Cell, Drawdown } from "./datatypes";
import utilInstance from "./util";

export module Sequence{

  export class OneD{

    private state: Array<number> = [];


    constructor(initSequence:Array<number> = []){
      if(initSequence){
        this.state = initSequence;
      }
      return this;
    }

       /**
     * adds a new value to the front of current sequence state
     * @param val can accept a number or boolean. 
     */
       unshift(val: number | boolean){
        if(typeof val == 'number'){
          this.state.unshift(val)
        }else{
          switch(val){
            case null:
              this.state.unshift(2);
              break;
            case false: 
              this.state.unshift(0);
              break;
            case true: 
              this.state.unshift(1);
              break;
          }
        }
  
        return this;
      }

    /**
     * pushes a new value to the current sequence state
     * @param val can accept a number or boolean. 
     */
    push(val: number | boolean){
      if(typeof val == 'number'){
        this.state.push(val)
      }else{
        switch(val){
          case null:
            this.state.push(2);
            break;
          case false: 
            this.state.push(0);
            break;
          case true: 
            this.state.push(1);
            break;
        }
      }

      return this;
    }

 

     pushMultiple(push_val: number | boolean, multiple: number){

      for(let i = 0; i < multiple; i++){
        this.push(push_val);
      }
      return this;

    }

    unshiftMultiple(push_val: number | boolean, multiple: number){

      for(let i = 0; i < multiple; i++){
        this.unshift(push_val);
      }
      return this;

    }
    
    


    /**
     * repeats the current sequence so that it is of length n.
     * @param n the length of the sequence 
     */
    expand(n: number){

      if(this.state.length == 0) return;

      let len = this.state.length;
      let remainder = n - len;

      for(let j = 0; j < remainder; j++){
        this.state.push(this.state[j%len]); 
      };

      return this;
    }

        /**
     * adds unset cells so that it is of length n.
     * @param n the length of the sequence 
     */
      padTo(n: number){

        if(this.state.length == 0) return;
  
        let len = this.state.length;
        let remainder = n - len;
  
        for(let j = 0; j < remainder; j++){
          this.state.push(2); 
        };
  
        return this;
      }
    


    /**
     * inverts all of the values of the current state
     * @returns 
     */
    invert(){
      this.state = this.state.map(el => {
        if(el == 2) return 2;
        else return (el == 0) ? 1: 0;
      });
      return this;
    }

    import(row: Array<Cell>){
      this.state = [];
      row.forEach(cell => {
        this.push(getCellValue(cell));
      })
      return this;

    }

    deleteAndDrawIn(val: number){

      console.log("DRAWING IN ", val)
      if(val < 1 || val >= this.state.length) return this;
      
      let deleted = this.state[val];

      this.state = this.state.filter((el, ndx) => ndx !== val);
      this.state.unshift(deleted);
      // this.state.push(deleted);
      return this;
    }


    /**
     * shifts the sequence in the amount of val
     * @param val a positive or negative number that controls the direction of the shift
     * @returns 
     */
    shift(val: number){
      this.state = this.state.map((el, ndx) => {     
        let shift_ndx = (ndx - val)%this.state.length;
        if(shift_ndx < 0) shift_ndx+= this.state.length;
        return this.state[shift_ndx];
      });
      return this;
    }

    /**
     * repeats the sequence val times returning a sequence of size val * original sequence
     * @param val the number of times you would like to repeat. 1 returns itself. 0 returns nothing
     * @returns 
     */
    repeat(val: number){
      if(val <= 0) return;
      for(let j = 0; j < val-1; j++){
        this.state = this.state.concat(this.state);
      }
      return this;
    }


    reverse(){
      this.state = this.state.reverse();
      return this;
    }


    /**
     * provides the value of the state at this given moment of computation. 
     * @returns the sequence as a numeric array
     */
    val():Array<number>{
      return this.state.slice();
    }



  }

  export class TwoD{

    private state: Array<Array<number>> = [];


    constructor(){
      return this;
    }

    deleteWeft(i: number){
      this.state = this.state.filter((el, ndx)=> ndx != i);
      return this;
   }

   deleteWarp(j: number){
     this.state.forEach((row, i) => {
      this.state[i] = row.filter((el, ndx)=> ndx != j);
     });
     return this;
  }

    /**
     * adds a row to the first (or subsequent row) of the 2D sequence
     * @param seq the 1D sequence value to add 
     * @returns 
     */
    pushWarpSequence(seq: Array<number>){

      let height = this.state.length;
      if(this.state.length > 0 && height != seq.length){
        let lcm = utilInstance.lcm([height, seq.length]);
        let width = this.state[0].length;

        for(let j = 0; j < width; j++){
          let col = this.state.map(el => el[j]);
          let col_seq = new OneD(col).expand(lcm).val();
          for(let i = 0; i < lcm; i++){
            this.state[i][j] = col_seq[i];
          }
        }
      }

      if(this.state.length == 0){
        seq.forEach((num, ndx) => {
          this.state.push([]);
        })
      }

      seq.forEach((num, ndx) => {
        this.state[ndx].push(num);
      })
      
      return this;
    }

     /**
     * adds a col to the first (or subsequent col) of the 2D sequence
     * @param seq the 1D sequence value to add 
     * @returns 
     */
     pushWeftSequence(seq: Array<number>){


     
      if(this.state.length > 0 && this.state[0].length !== seq.length){
          let width = this.state[0].length;     

          let lcm = utilInstance.lcm([width, seq.length]);
          
          this.state.forEach((row, ndx) => {
            this.state[ndx] = new OneD(row).expand(lcm).val();
          })
        }
        this.state.push(seq);

      
      return this;
    }

         /**
     * adds this weft to the front of the pattern
     * @param seq the 1D sequence value to add 
     * @returns 
     */
      unshiftWeftSequence(seq: Array<number>){


     
          if(this.state.length > 0 && this.state[0].length !== seq.length){
              let width = this.state[0].length;     
    
              let lcm = utilInstance.lcm([width, seq.length]);
              
              this.state.forEach((row, ndx) => {
                this.state[ndx] = new OneD(row).expand(lcm).val();
              })
            }
            this.state.unshift(seq);
    
          
          return this;
      }

    setBlank(val: number | boolean = 1){

      let res = new OneD().push(val).val();
      this.state = [res];
      return this;
    }

    wefts(): number{
      return this.state.length;
    }

    warps(): number{
      if(this.state.length == 0) return 0;
      return this.state[0].length;
    }


    /**
     * fills a rectangle of given size with the current state.
     * @param w the width
     * @param h the hieght
     */
    fill(w: number, h: number) {
      if(w < 0 || h < 0) return this;
      if(this.state.length == 0) return;

      let len = this.state.length;

      for(let i = 0; i < h; i++){
        let row = new OneD(this.state[i%len]).expand(w).val();
        this.state[i] = row;
      }
      return this;
    }


    /**
     * clears the current state (if any)
     * and creates a new 2D Sequence Object from a DD
     * @param dd 
     */
    import(dd: Drawdown) {
      this.state = [];
      dd.forEach((row, i) => {
        this.state.push([]);
        row.forEach((cell, j)=> {
          switch(getCellValue(cell)){
            case null:
              this.state[i][j] = 2;
              break;
            case false:
              this.state[i][j] = 0;
              break;
            case true:
              this.state[i][j] = 1;
              break;
          }
        })
      });
      return this;
    }

    /**
     * converts the current state to a drawdown format
     * @returns 
     */
    export() : Drawdown {

      const dd: Drawdown = [];
      this.state.forEach((row, i) =>{
        dd.push([]);
        row.forEach((cell_val, j) => {
          dd[i][j] = createCellFromSequenceVal(cell_val);
        });
      })
      return dd;

    }

  }

  
}




// var SequenceClass = function(){

//   this.val = [0,1];

// }

// SequenceClass.prototype.invert = function () {

//   this.sequence = this.sequence.map(el => !el)
  
//   return this;

// }



// export const sequence = {
//     state: { value: [false,true] },
//     callbacks: [] as ((...args: any[]) => any)[],
//     _exec: {
//       setValue: (arr: Array<boolean>) => (sequence.state.value = arr),
//       invert: () => (sequence.state.value = sequence.state.value.map(el => !el)),
//       shift: (val: number) => (
//         sequence.state.value = sequence.state.value.map((el, ndx) => sequence.state.value[(ndx+val)%sequence.state.value.length])
//         )
//     },
//     _queue: {
//       setValue: (arr: Array<boolean>) => {
//         sequence.callbacks.push(() => sequence._exec.setValue(arr));
//         return sequence._queue;
//       },
//       invert: () => {
//         sequence.callbacks.push(() => sequence._exec.invert());
//         return sequence._queue;
//       },
//       shift: (val: number) => {
//         sequence.callbacks.push(() => sequence._exec.shift(val));
//         return sequence._queue;
//       },
//       run: () => {
//         sequence.callbacks.forEach((cb) => cb());
//         sequence.callbacks = [];
//       },
//     },
//     chain: () => sequence._queue,
//   };
  