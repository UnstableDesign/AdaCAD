import { createCell, getCellValue, setCellValue } from "../../model/cell";
import { BoolParam, Draft, NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftWithParams, isUp, warps, wefts } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";


const name = "combos";
const old_names = [];

//PARAMS
const ends:NumParam =  
      {name: 'size',
      type: 'number',
        min: 2,
        max: 4,
      value: 3,
      dx: 'the size of the structure'
      }

const selection: NumParam = 
    {name: 'selection',
    type: 'number',
    min: 1,
    max: 22874,
    value: 1,
    dx: 'the id of the generated structure you would like to view'
    }

const download: BoolParam = 
    {
    name: 'download?',
    type: 'boolean',
    falsestate: 'no',
    truestate: 'yes',
    value: 0,
    dx: "when this is set to true, it will trigger download of an image of the whole set everytime it recomputes, this may result in multiple downloads"
    }


const params = [ends, selection, download];

//INLETS

const inlets = [];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      const size: number = getOpParamValById(0, param_vals);
      let selection: number = getOpParamValById(1, param_vals);
      const download: number = getOpParamValById(2, param_vals);

      //adjust by one to convert user input to the array index of the structure
      selection -= 1;

      //for larger set sizes, you must split up the download into multiple files
      const divisor = (size - 3 > 0) ? Math.pow(2,(size-3)): 1;

      return getSet(size, size)
      .then(alldrafts => { 

        if(download){

          for(let set_id = 0; set_id < divisor; set_id++){
            
            const cc = 10;
            const set_data = getDrafts(set_id, divisor);

            let b:HTMLCanvasElement = <HTMLCanvasElement>document.createElement('canvas'); 
            let context = b.getContext('2d');
            b.width = (cc*(size+5))*20;
            b.height = Math.ceil(set_data.length  / 20)*((5+size)*cc);
            context.fillStyle = "white";
            context.fillRect(0,0,b.width,b.height);

            set_data.forEach((set, ndx) => {
              
              const top = Math.floor(ndx / 20) * (wefts(set.draft.drawdown)+5)*cc + 10;
              const left = ndx % 20 * (warps(set.draft.drawdown)+5)*cc + 10; 
              
              context.font = "8px Arial";
              context.fillStyle = "#000000"
              context.fillText((set.id+1).toString(),left, top-2,size*cc)
              context.strokeRect(left,top,size*cc,size*cc);

              for (let i = 0; i < wefts(set.draft.drawdown); i++) {
                for (let j = 0; j < warps(set.draft.drawdown); j++) {
                  drawCell(context, set.draft, cc, i, j, top, left);
                }
              }            
            })

            // console.log("b", b);
            const a = document.createElement('a')
            a.href = b.toDataURL("image/jpg")
            a.download = "allvalid_"+size+"x"+size+"_drafts_"+set_id+".jpg";
            a.click();
          }

        }

        
        return Promise.resolve([getDraft(selection).draft]);

      })
      
  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    const selection: number = getOpParamValById(1, param_vals);
    const size: number = getOpParamValById(0, param_vals);

  return size+'x'+size+'-'+selection;
}


export const combinatorics: Operation = {name, old_names, params, inlets, perform, generateName};



/**** CUSTOM FUNCTIONS FOR GENERATING ALL POSSIBLE STRUCRTURES****/


interface ComboTree {
    set: Array<Array<number>>,
    top: ComboNode
  }
  
  interface ComboNode {
    parent: ComboNode;
    value: number,
    set: Array<Array<number>>,
    children: Array<ComboNode>;
  }

  let cur_set: any = {warps: 0, wefts: 0};
  let all_possible_drafts: Array<{draft:Draft, id:number}> = [];
  let min_interlacements: number = 1;


  function drawCell(cx, draft, cell_size, i, j, top,  left){
    let is_up = isUp(draft.drawdown, i, j);
    let color = "#ffffff"
   
    if(is_up){
      color = '#000000';
    }else{
      color = '#ffffff';
    }
    cx.fillStyle = color;
    cx.strokeStyle = '#000000';

 

    //hack, draw upside down to account for later flip
    i = (wefts(draft.drawdown)-1) - i;

    cx.strokeRect(left+j*cell_size, top+i*cell_size, cell_size, cell_size);
    cx.fillRect(left+j*cell_size, top+i*cell_size, cell_size, cell_size);
  }


  /**
   * returns all the values from the valid set that match the sequence
   * @param seq 
   * @param valid 
   */
  function filterForSeq(seq: Array<number>, valid: Array<Array<number>>) : Array<Array<number>>{
    let filtered = valid.slice();
    seq.forEach((val, ndx) => {
      filtered = filtered.filter(set => set[ndx] == val);
    });
    return filtered;
  }


  /**
   * prints the tree for verification
   * @param tree 
   */
  function printTree(tree: ComboTree){

    console.log("***PRINT TREE***");
    printNodes([tree.top]);
  }

  function printNodes(nodes: Array<ComboNode>){
    
    nodes.forEach(node => {
     // console.log("Node: ", this.traceSequenceViaParents(node), node.set);
      printNodes(node.children);
    });
  }


  /**
   * given a node, it creates the sequence (e.g. 0110) that it represnts by calling each parent
   * @param node a tree node from which to start
   * @returns the sequence reprsented by this node. 
   */
  function traceSequenceViaParents(node: ComboNode) : Array<number>{
    let seq = [];
    while(node.parent !== null){
      seq = [node.value].concat(seq);
      node = node.parent;
    }
    return seq;
  }


  /**
   * converts the valid set into a tree, where the root/top node branches between 0, 1 at each child. 
   * therefore, every valid set traverses the tree. Each treenode stores the valid sets at its location
   * allowing for each row add to be a lookup operation
   * @param valid the valid set of combinations
   * @returns a Combination Tree accounting for every valid set
   */
  function createTreeFromValidSet(valid: Array<Array<number>>) : Promise<ComboTree> {

    let tree:ComboTree = {
      set: valid.slice(),
      top: {
        parent: null,
        value: -1,
        set: valid.slice(),
        children: []},
    }


    valid.forEach(valid_set => {

      let node = tree.top;

      valid_set.forEach(val => {
            
         const found = node.children.filter(el => el.value === val);
         if(found.length == 0){
           const combo_node: ComboNode = {
            parent: node,
            value: val,
            set: [valid_set],
            children: []
            }
            node.children.push(combo_node);
            node = combo_node;
          }else{
            node = found[0];
            node.set.push(valid_set);
          }
      });
    })

    return Promise.resolve(tree);

  }


  /**
   * initializes a set of all possible valid drafts of a given dimension
   * Right now must be square and have a minimum of 1 interlacement
   * @param wefts the number of wefts of the structure
   * @param warps the number of warps in the structure
   * @returns a promise containing the array of all drafts generated
   */
  function initSet(wefts: number, warps: number) : Promise<Array<{draft:Draft, id:number}>>{

    cur_set = {warps:0, wefts:0};
    all_possible_drafts = [];

    return getAllPossible(warps-1)
    .then(possible => {
      return makeValid(possible);
    })
    .then(valid => {

      return createTreeFromValidSet(valid);


    }).then(tree => {

      printTree(tree);

      let drafts: Array<Draft> = [];
       let opts = getOptions([], tree);
       
       opts.forEach(opt => {

        const draft: Draft = initDraftWithParams({warps: warps, wefts: wefts});
    
        for(let i = 0; i < wefts; i++){
          for(let j = 0; j < warps; j++){
            if(i == 0) draft.drawdown[i][j] = setCellValue(draft.drawdown[i][j], ((opt[j] == 0) ? false: true));
          }
        }
        
        drafts = drafts.concat([draft]);

      });

      //drafts.forEach(el => utilInstance.printDraft(el));

      
      const its = (wefts * 2) -1;
      for(let i = 1; i <= its; i++){
       drafts = expandDrafts(drafts, tree, i, wefts);
       //drafts.forEach(el => utilInstance.printDraft(el));

      }

      //drafts.forEach(el => utilInstance.printDraft(el));

      all_possible_drafts = drafts.map((el, ndx) => {return {draft: el, id: ndx}});
      cur_set.wefts = wefts;
       cur_set.warps = warps;
      return Promise.resolve(all_possible_drafts);


    });

  }


  /**
   * gets the set of a defined size. If that set is already in memory, it returns it. If not, it generates it.
   * @param warps the warps to check
   * @param wefts the wefts to check
   * @returns a boolean 
   */
  function getSet(warps: number, wefts: number) : Promise<Array<{draft:Draft, id:number}>> {
    if(warps === cur_set.warps && wefts === cur_set.wefts) return Promise.resolve(all_possible_drafts);
    else return initSet(warps, wefts);
  }

  /**
   * gets the draft at location NDX from the current set of generated drafts
   * @param ndx the index to return
   * @returns returns the draft at the index, or an empty draft if so
   */
  function getDraft(ndx: number) : {draft: Draft, id: number}{
    const found = all_possible_drafts.find(el => el.id == ndx)
    if(found == undefined) return {draft: initDraftWithParams({wefts: 1, warps: 1}), id: -1};
    else return found;
  }

  /**
   * gets the draft at location NDX from the current set of generated drafts
   * @param ndx the index to return
   * @returns returns the draft at the index, or an empty draft if so
   */
  function getDrafts(ndx: number, divisor: number) : Array<{draft: Draft, id: number}>{
    const set_size = Math.floor(all_possible_drafts.length/divisor);
    const begin = ndx * set_size;
    const stop = begin + set_size;
    const drafts = all_possible_drafts.filter(el => (el.id >= begin && el.id <= stop));
    return drafts;
  }

  /**
   * gets a list of possible drafts by adding a single row or column
   * @param vsd an array of drafts and associated valid sets
   * @param ndx the index in the adding of row columns
   * @param wefts the size of the structure
   * @returns an (expanded)array of drafts and associated valid sets
   */
  function expandDrafts(drafts: Array<Draft>, tree: ComboTree, ndx: number, wefts: number) : Array<Draft> {

    let all_drafts: Array< Draft> = [];
    drafts.forEach(draft => {
      if(ndx % 2 == 0) all_drafts = all_drafts.concat(addRow(draft, tree, Math.floor(ndx/2), wefts));
      if(ndx % 2 == 1) all_drafts = all_drafts.concat(addCol(draft, tree, Math.floor(ndx/2), wefts));
    })

    //console.log("returning from all drafts", all_drafts.length);
    return all_drafts;


  }


  /**
   * adds a row to the set of drafts added
   * @param vsd 
   * @param i 
   * @param n 
   * @returns 
   */
  function addRow(draft: Draft, tree: ComboTree, i:number, n: number){
    let expanded_drafts = [];  
    //console.log("adding rows to ", vsd);

    let set = [];
    for(let j = 0; j < i; j++){
      set.push(getCellValue(draft.drawdown[i][j]) ? 1 : 0);
    }
    //console.log("Generated set ", set, );


    let opts = getOptions(set, tree);
    //console.log("generated options", opts);
    opts.forEach(opt => {

      let pattern = [];
      pattern = draft.drawdown.slice();
      //add to the draft and push
      for(let j = 0; j < n; j++){
        pattern[i][j] = (opt[j] == 0) ? createCell(false) : createCell(true);
      }

      expanded_drafts.push(initDraftWithParams({warps: n, wefts: n, pattern: pattern.slice()}));
      
    });


    return expanded_drafts;
  }

  function addCol(draft: Draft, tree: ComboTree, j:number, n: number){
    //console.log("adding cols to ", vsd);

    let expanded_drafts = [];

    let set = [];
    for(let i = 0; i < (j+1); i++){
      set.push(getCellValue(draft.drawdown[i][j]) ? 1 : 0);
    }

    let opts =getOptions(set, tree);
    //console.log("generated options for set", set, opts);

    opts.forEach(opt => {

      let pattern = [];
      pattern = draft.drawdown.slice();
      //add to the draft and push
      for(let i = 0; i < n; i++){
        pattern[i][j] = (opt[i] == 0) ? createCell(false) : createCell(true);
      }

      expanded_drafts.push(initDraftWithParams({warps: n, wefts: n, pattern: pattern.slice()}));
      
    });
    //console.log("****returning ****");
   // expanded_drafts.forEach(el => utilInstance.printDraft(el.draft))
    return expanded_drafts;
  }



  /**
   * uses the input sequence to identify the node of possible children
   * @param seq the input sequence to locate 
   * @param tree the tree to search
   * @returns 
   */
  function getOptions(seq: Array<Number>, tree: ComboTree) : Array<Array<number>>{

    let children = tree.top.children.slice();
    
    if(seq.length == 0) return tree.set.slice();
    //get to the node we need
    let node = null;


    seq.forEach(val => {
      node = children.find(el => el.value == val);
      if(node === undefined) children = [];
      else children = node.children.slice();
    });

    if(node === undefined) return [];
    else return node.set.slice();
  }

  /**
   * if there is all zeros or all ones, it adds a contrasting bit at the end, or both bits 
   * @param all_possible 
   * @returns 
   */
  function makeValid(all_possible: Array<Array<number>>) : Promise<Array<Array<number>>>{
    const all_valid = [];

    for(let i = 0; i < all_possible.length; i++){
      if(all_possible[i].find(el => el == 0) === undefined){
        all_valid.push(all_possible[i].concat([0]))
      }else if(all_possible[i].find(el => el == 1) === undefined){
        all_valid.push(all_possible[i].concat([1]))
      }else{
        all_valid.push(all_possible[i].concat([0]))
        all_valid.push(all_possible[i].concat([1]))
      }
    }

    return Promise.resolve(all_valid);
  }



  /**
   * generates a list of all valid sums with n factors that total t. 
   * all elements > 0
   * @param n 
   */
  function getAllPossible(n: number): Promise<Array<Array<number>>>{

    let all_combos = [];

    for(let i = 0; i < n; i++){
      all_combos = addBit(all_combos);
    }
    return Promise.resolve(all_combos);
    
  }


  

  function addBit(set: Array<Array<number>>) : Array<Array<number>> {
    
    const expanded_set = [];

    if(set.length == 0){
      expanded_set.push([0]);
      expanded_set.push([1]);
    }else{
      for(let i = 0; i < set.length; i++){
        expanded_set.push(set[i].concat([0]));
        expanded_set.push(set[i].concat([1]));
      }
    }
    return expanded_set;
  }



