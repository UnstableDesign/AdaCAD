import { Injectable } from '@angular/core';
import { OperationService } from '../../mixer/provider/operation.service';
import { TreeService } from '../../mixer/provider/tree.service';
import { Draft } from '../model/draft';


export interface OpGraphNode{
  id: number,
  name: string,
  params: Array<number>, 
  res: Array<Draft>; 
  dirty: boolean;
 }

 export interface DraftNode{
  id: number,
  draft: Draft; 
 }


@Injectable({
  providedIn: 'root'
})
export class OpgraphService {


  nodes: Array<OpGraphNode> = [];
  drafts: Array<DraftNode> = [];

  constructor(private ops: OperationService, private tree: TreeService) { }


  async addDraftNode(id: number, draft: Draft) : Promise<DraftNode>{
    const sd = {id, draft};
    this.drafts.concat(sd);
    return sd;
  } 

  /**
   * adds a node with the given values, if no values are provided, adds default values
   * @param id 
   * @param name 
   * @param params 
   */
  addNode(id: number, name: string, params: Array<number>){

    const params_in = this.ops.getOp(name).params.map(el => el.value);
    const params_out = params_in.map((p, ndx) => {
      if(ndx < params.length) return params[ndx];
      else return p;
    })



    this.nodes.push(
      {
        id: id, 
        name: name,
        params: params_out.slice(),
        res: null,
        dirty: false
      }
    );
  }




  async loadNode(id: number, name: string, params:Array<number>) : Promise<OpGraphNode>{
    

    const params_in = this.ops.getOp(name).params.map(el => el.value);
    const params_out = params_in.map((p, ndx) => {
      if(ndx < params.length) return params[ndx];
      else return p;
    });

    const node =  {
      id: id, 
      name: name,
      params: params_out.slice(),
      res: null,
      dirty: false
    };

    this.nodes.concat(node);

    return Promise.resolve(node);
  


  }

  removeNode(id: number){
    this.nodes = this.nodes.filter(el => el.id !== id);
  }

  getDraft(id: number) : Draft{
    const found: DraftNode = this.drafts.find(el => el.id == id);
    if(found === undefined) console.error("cannot find draft node at ",  id);
    return found.draft;
  }

  getDraftNode(id: number) : DraftNode{
    const found: DraftNode = this.drafts.find(el => el.id == id);
    if(found === undefined) console.error("cannot find draft node at ",  id);
    return found;
  }

    /**
   * sets a new draft
   * @param temp the draft to set this component to
   */
  setDraft(id: number, temp: Draft) {

    const dn = this.getDraftNode(id);
    dn.draft.reload(temp);
    
  }


  getNode(id: number) : OpGraphNode {
    const found: OpGraphNode =  this.nodes.find(el => el.id == id);
    if(found === undefined) console.error("cannot find graph node at ", this.nodes, id);
    return found;
  }

  setAllClear(){
    this.nodes.forEach(node => node.dirty = false);
  }

  setDirty(id: number){
    this.getNode(id).dirty = true;
  }


  /**gets nodes that depend on any selection of clean nodes */
  getNodesWithDependenciesSatisfied() : Array<OpGraphNode>{

    const dependency_nodes: Array<OpGraphNode> = this.nodes
    .filter(el => el.dirty);

    const ready: Array<OpGraphNode> = dependency_nodes.filter((el, ndx) => {
      const depends_on: Array<number> = this.tree.getUpstreamOperations(el.id);
      const needs = depends_on.map(id => this.getNode(id).dirty);


      const find_true = needs.findIndex(el => el === true);
      if(find_true === -1) return el;
    });
  
    return ready;
  }



/**
 * performs the given operation and all downstream children affected by this change
 * @param op_id 
 */
 async performOp(id:number) : Promise<any> {


    //mark all downsteam nodes as dirty; 
    const ds = this.tree.getDownstreamOperations(id);
    ds.forEach(el => this.setDirty(el));



  
    const node = this.getNode(id);
    const op = this.ops.getOp(node.name);
    
    const input_drafts: Array<Draft> = this.tree.getInputOpsToAnOp(id)
    .map(in_id => this.getNode(in_id))
    .reduce((acc, el) => {
      return acc.concat(el.res);
    }, []);
  

    return op.perform(input_drafts, node.params)
      .then(res => {
        node.res = res.slice();
        node.dirty = false;
        return this.getNodesWithDependenciesSatisfied();
      })
      .then(needs_performing => {
        const fns = needs_performing.map(el => this.performOp(el.id));
        return Promise.all(fns);      
      })
      .then(el => {return node.res});

    }


  // /**
  //  * performs the operation on the inputs added in load
  //  * @returns an Array linking the draft ids to compoment_ids
  //  */
  //  async perform(inputs: Array<Draft>):Promise<Array<DraftMap>>{

  //   console.log("performing name ", this.name, this.op_inputs);

  //   this.op = this.operations.getOp(this.name);
  //   return this.op.perform(inputs, this.op_inputs.map(fc => fc.value))
  //     .then(generated_drafts => {

  //       //if we have more outputs here than we have generated drafts, we should update the already created drafts with empty drafts
  //       if(generated_drafts.length < this.outputs.length){
  //         this.outputs.forEach(out => {
  //           out.draft = new Draft({warps: 1, wefts: 1});
  //         })
  //         return this.outputs;
  //       }

  //       return generated_drafts.map((draft, ndx) => ({
  //           component_id: (this.outputs[ndx] === undefined) ? -1 : this.outputs[ndx].component_id,
  //           draft
  //         })
  //     )
  //   })

    
  // }






}
