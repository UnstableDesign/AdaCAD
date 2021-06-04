import { Draft } from "../../core/model/draft";


 export class Splice {
    min_inputs:number = 1;
    max_inputs:number = 100;
    num_outputs = 1;
    inputs: Array<Draft> = [];
    outputs: Array<Draft> = [];
  
    constructor() {
     
    }

    /**
     * write rules here to validate any given action
     */
    load(inputs: Array<Draft>):boolean{
        this.inputs = inputs;
        return this.validate();
    }

        /**
     * write rules here to validate any given action
     */
    validate():boolean{
        return(this.inputs.length > 0);
    }
    

    perform():Array<Draft>{  

        if(!this.validate) return null;
                
        const max_wefts:number = this.inputs.reduce((acc, draft)=>{
            if(draft.wefts > acc) return draft.wefts;
            return acc;
        }, 0);

        const max_warps:number = this.inputs.reduce((acc, draft)=>{
            if(draft.warps > acc) return draft.warps;
            return acc;
        }, 0);

        //create a draft to hold the merged values
        const d:Draft = new Draft({warps: max_warps, wefts:(max_wefts * this.inputs.length)});

        d.pattern.forEach((row, ndx) => {
            const select_array: number = ndx % this.inputs.length; 
            const select_row: number = Math.floor(ndx / this.inputs.length);
            row.forEach((cell, j) =>{
                cell.setHeddle(this.inputs[select_array].pattern[select_row][j].getHeddle());
            });
        });

        this.outputs.push(d);
        return this.outputs;
    }


    recompute():Array<Draft>{
        if(!this.validate()) return;
        return this.perform();
    }
   
  }
