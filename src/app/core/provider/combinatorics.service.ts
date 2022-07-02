
import { Injectable } from '@angular/core';
import { forIn } from 'lodash';
import { Cell } from '../model/cell';
import { Draft } from '../model/draft';
import utilInstance from '../model/util';



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


@Injectable({
  providedIn: 'root'
})
export class CombinatoricsService {

  cur_set: any = {warps: 0, wefts: 0};
  all_possible_drafts: Array<Draft> = [];
  min_interlacements: number = 1;

  constructor() { 

  }

  /**
   * returns all the values from the valid set that match the sequence
   * @param seq 
   * @param valid 
   */
  filterForSeq(seq: Array<number>, valid: Array<Array<number>>) : Array<Array<number>>{
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
  printTree(tree: ComboTree){

    console.log("***PRINT TREE***");
    this.printNodes([tree.top]);
  }

  printNodes(nodes: Array<ComboNode>){
    
    nodes.forEach(node => {
      console.log("Node: ", this.traceSequenceViaParents(node), node.set);
      this.printNodes(node.children);
    });
  }


  /**
   * given a node, it creates the sequence (e.g. 0110) that it represnts by calling each parent
   * @param node a tree node from which to start
   * @returns the sequence reprsented by this node. 
   */
  traceSequenceViaParents(node: ComboNode) : Array<number>{
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
  createTreeFromValidSet(valid: Array<Array<number>>) : Promise<ComboTree> {

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
  initSet(wefts: number, warps: number) : Promise<Array<Draft>>{

    this.cur_set = {warps:0, wefts:0};
    this.all_possible_drafts = [];

    return this.getAllPossible(warps-1)
    .then(possible => {
      return this.makeValid(possible);
    })
    .then(valid => {

      console.log("valid is: ", valid);
      return this.createTreeFromValidSet(valid);


    }).then(tree => {

      this.printTree(tree);

      let drafts: Array<Draft> = [];
       let opts = this.getOptions([], tree);
       
       opts.forEach(opt => {

        const draft: Draft = new Draft({warps: warps, wefts: wefts});
    
        for(let i = 0; i < wefts; i++){
          for(let j = 0; j < warps; j++){
            if(i == 0) draft.pattern[i][j].setHeddle((opt[j] == 0) ? false: true);
          }
        }
        
        drafts = drafts.concat([draft]);

      });

      console.log("calling on set 0, length", drafts.length)
      //drafts.forEach(el => utilInstance.printDraft(el));

      
      const its = (wefts * 2) -1;
      for(let i = 1; i <= its; i++){
       drafts = this.expandDrafts(drafts, tree, i, wefts);
       console.log("calling on set ", i, drafts.length)
       //drafts.forEach(el => utilInstance.printDraft(el));

      }

      console.log("FINAL /// LEN", drafts.length);
      //drafts.forEach(el => utilInstance.printDraft(el));

      this.all_possible_drafts = drafts.slice();
      this.cur_set.wefts = wefts;
      this.cur_set.warps = warps;
      return Promise.resolve(this.all_possible_drafts);


    });

  }


  /**
   * checks to see if the current dimensions match the input
   * @param warps the warps to check
   * @param wefts the wefts to check
   * @returns a boolean 
   */
  hasSet(warps: number, wefts: number) : boolean {
    if(warps === this.cur_set.warps && wefts === this.cur_set.wefts) return true;
    else return false;
  }

  /**
   * gets the draft at location NDX from the current set of generated drafts
   * @param ndx the index to return
   * @returns returns the draft at the index, or an empty draft if so
   */
  getDraft(ndx: number) : Draft{
    if(ndx >= this.all_possible_drafts.length) return new Draft({wefts: 1, warps: 1});
    else return this.all_possible_drafts[ndx];
  }

  /**
   * gets the draft at location NDX from the current set of generated drafts
   * @param ndx the index to return
   * @returns returns the draft at the index, or an empty draft if so
   */
  getDrafts(ndx: number, divisor: number) : Array<Draft>{
    const set_size = Math.floor(this.all_possible_drafts.length/divisor);
    const begin = ndx * set_size;
    const stop = begin + set_size;
    const drafts = this.all_possible_drafts.filter((el, ndx) => ndx > begin && ndx <= stop);
    return drafts;
  }

  /**
   * gets a list of possible drafts by adding a single row or column
   * @param vsd an array of drafts and associated valid sets
   * @param ndx the index in the adding of row columns
   * @param wefts the size of the structure
   * @returns an (expanded)array of drafts and associated valid sets
   */
  expandDrafts(drafts: Array<Draft>, tree: ComboTree, ndx: number, wefts: number) : Array<Draft> {

    let all_drafts: Array< Draft> = [];
    drafts.forEach(draft => {
      if(ndx % 2 == 0) all_drafts = all_drafts.concat(this.addRow(draft, tree, Math.floor(ndx/2), wefts));
      if(ndx % 2 == 1) all_drafts = all_drafts.concat(this.addCol(draft, tree, Math.floor(ndx/2), wefts));
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
  addRow(draft: Draft, tree: ComboTree, i:number, n: number){
    let expanded_drafts = [];  
    //console.log("adding rows to ", vsd);

    let set = [];
    for(let j = 0; j < i; j++){
      set.push(draft.pattern[i][j].getHeddle() ? 1 : 0);
    }
    //console.log("Generated set ", set, );


    let opts = this.getOptions(set, tree);
    //console.log("generated options", opts);
    opts.forEach(opt => {

      let pattern = [];
      pattern = draft.pattern.slice();
      //add to the draft and push
      for(let j = 0; j < n; j++){
        pattern[i][j] = (opt[j] == 0) ? new Cell(false) : new Cell(true);
      }

      expanded_drafts.push(new Draft({warps: n, wefts: n, pattern: pattern.slice()}));
      
    });


    return expanded_drafts;
  }

  addCol(draft: Draft, tree: ComboTree, j:number, n: number){
    //console.log("adding cols to ", vsd);

    let expanded_drafts = [];

    let set = [];
    for(let i = 0; i < (j+1); i++){
      set.push(draft.pattern[i][j].getHeddle() ? 1 : 0);
    }

    let opts = this.getOptions(set, tree);
    //console.log("generated options for set", set, opts);

    opts.forEach(opt => {

      let pattern = [];
      pattern = draft.pattern.slice();
      //add to the draft and push
      for(let i = 0; i < n; i++){
        pattern[i][j] = (opt[i] == 0) ? new Cell(false) : new Cell(true);
      }

      expanded_drafts.push(new Draft({warps: n, wefts: n, pattern: pattern.slice()}));
      
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
  getOptions(seq: Array<Number>, tree: ComboTree) : Array<Array<number>>{

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
  makeValid(all_possible: Array<Array<number>>) : Promise<Array<Array<number>>>{
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
   * if there is all zeros or all ones, it adds a contrasting bit at the end, or both bits 
   * @param all_possible 
   * @returns 
   */
   makeValidBitString(all_possible: Array<number>, length: number) : Promise<Array<number>>{
    const all_valid = [];
    console.log("all poss", all_possible)

    for(let i = 0; i < all_possible.length; i++){

      if(all_possible[i] == Math.pow(2,length)-1){
        all_valid.push(all_possible[i] >> 0)
      }else if(all_possible[i] ===  0){
        all_valid.push(all_possible[i] >> 1)
      }else{
        all_valid.push(all_possible[i] >> 0)
        all_valid.push(all_possible[i] >> 1)
      }
    }

    return Promise.resolve(all_valid);
  }



  /**
   * generates a list of all valid sums with n factors that total t. 
   * all elements > 0
   * @param n 
   */
  getAllPossible(n: number): Promise<Array<Array<number>>>{

    let all_combos = [];

    for(let i = 0; i < n; i++){
      all_combos = this.addBit(all_combos);
    }
    return Promise.resolve(all_combos);
    
  }


    /**
   * generates a list of all valid sums with n factors that total t. 
   * all elements > 0
   * @param n 
   */
    getAllPossibleBitStrings(n: number): Promise<Array<number>>{

      let all_combos = [];
  
      for(let i = 0; i < n; i++){
        all_combos = this.addBit(all_combos);
      }
      return Promise.resolve(all_combos);
      
    }
  

  addBit(set: Array<Array<number>>) : Array<Array<number>> {
    
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

  addBitToBitstring(set: Array<number>) : Array<number> {
    
    const expanded_set = [];

    if(set.length == 0){
      expanded_set.push(0b0);
      expanded_set.push(0b1);
    }else{
      for(let i = 0; i < set.length; i++){
        expanded_set.push(set[i] >> 0b1);
        expanded_set.push(set[i] >> 0b1);
      }
    }
    return expanded_set;
  }







  


}
