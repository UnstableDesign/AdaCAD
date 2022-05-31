import { Injectable, ViewRef } from '@angular/core';
import { cloneDeep, flip, map, toNumber } from 'lodash';
import { Cell } from '../../core/model/cell';
import { Draft } from '../../core/model/draft';
import { Loom } from '../../core/model/loom';
import { NodeComponentProxy, OpComponentProxy, TreeNodeProxy } from '../../core/provider/file.service';
import { ConnectionComponent } from '../palette/connection/connection.component';
import { OperationComponent } from '../palette/operation/operation.component';
import { SubdraftComponent } from '../palette/subdraft/subdraft.component';
import { OperationService, OpInput, DynamicOperation, Operation, StringParam } from './operation.service';
import utilInstance from '../../core/model/util';
import { UploadService } from '../../core/uploads/upload.service';
import { element } from 'protractor';
import { SystemsService } from '../../core/provider/systems.service';
import { WorkspaceService } from '../../core/provider/workspace.service';


/**
 * this class registers the relationships between subdrafts, operations, and connections
 */

/**
 * this stores a reference to a component on the palette with its id and some
 * @param type is the type of component'
 * @param view_id is ndx to reference to this object in the ViewComponentRef (for deleting)
 * @param id is a unique id linked forever to this component 
 * @param component is a reference to the component object
 * @param dirty describes if this needs to be recalcuated or redrawn 
 */
type BaseNode = {
  type: 'draft' | 'op' | 'cxn',
  ref: ViewRef,
  id: number, //this will be unique for every instance
  component: SubdraftComponent | OperationComponent | ConnectionComponent,
  dirty: boolean
}

export type OpNode = BaseNode & {
  name: string,
  params: Array<any>
  inlets: Array<any>;
 }

 export type DraftNode = BaseNode & {
  draft: Draft,
  loom: Loom
 }

 type Node = BaseNode | OpNode | DraftNode;


 /**
  * a type to store input and output information for nodes that takes multiple node inputs and outputs into account.
  * each node stores the node it gets as input and output and the inlet/outlet that node enter into on itself. 
  * connections will have inlet/outlet indexes of 0, 0 (they cannot connect ot multiple things)
  * drafts will have inset/outout indexes of 0, 0 (they can only have one parent)
  * ops will have multiple inlets and outlets. For example, an input of (2, 1) means that treenode 2 is connected to inlet 1. 
  * @param treenode - the treenode that this input or output goes towards
  * @param ndx - which ndx on the said treenodes does this connect to specifically
  */
 export interface IOTuple{
   tn: TreeNode,
   ndx: number
 }

/**
 * A tree node stores relationships between the components created by operations
  * @param node: is a reference to the node object stored in the tree. 
  * @param parent links to the treenode that "created" this node or null if it was created by the user 
  * @param inputs a list of TreeNodes that are used as input to this TreeNode with an idex to which input they belong to
  * @param outputs a list of TreeNodes created by this node or specified by the user
  * Rules: 
  *   Operations can have many inputs and many outputs 
  *   Subdrafts can only have one input and one output (for now)
  *   
*/
export interface TreeNode{
  node: Node,
  parent: TreeNode,
  inputs: Array<IOTuple>,
  outputs: Array<IOTuple>
}

@Injectable({
  providedIn: 'root'
})
export class TreeService {

  nodes: Array<Node> = []; //an unordered list of all the nodes
  tree: Array<TreeNode> = []; //a representation of the node relationships
  private open_connection: number = -1; //represents a node that is currently seeking a conneciton, used for checking which nodes it is able to connect to
  preview: DraftNode; //references the specially identified component that is a preview (but does not exist in tree)

  constructor(
    private ws: WorkspaceService,
    private ops: OperationService,
    private upSvc: UploadService,
    private systemsservice: SystemsService) { 
  }


  /**
   * generates an id from the timestamp and random number (to offset effects to two functions running in the same ms)
   */
  getUniqueId() : number {
    
    return utilInstance.generateId(8);


  }

    /**
     * go through the list of nodes being loaded and replace any with names that have been outdated.  
     * **/
    
    async replaceOutdatedOps(nodes: Array<any>) : Promise<Array<any>>{

      const correctedNodes = nodes.map(node => {
        if(this.ops.getOp(node.name) === null){
          const op =  this.ops.getOpByOldName(node.name);
          node.name = op.name
          node.inlets = op.inlets;
        }
        return node;
      });

            return Promise.resolve(correctedNodes);
    }



  /** scan through nodes and return all that our valid */
  async validateNodes() : Promise<boolean>{


    const err_ops: Array<Node> = this.nodes
            .filter(el => el.type === "op")
            .filter(el => this.ops.getOp((<OpNode> el).name) === undefined)

    //console.error("found invalid op nodes", err_ops);


    err_ops.forEach(node => {
      this.removeOperationNode(node.id);
    });

    ///also check to see that all connections exist
    const cxns = this.getUnusuedConnections();

   // console.log("unusued connections found", cxns);
    cxns.forEach(el => this.removeNode(el));
  

    return (err_ops.length === 0);

  }


  setOpParams(id: number, params: Array<any>, inlets: Array<any>){
    this.getOpNode(id).params = params.slice();
    this.getOpNode(id).inlets = inlets.slice();
  }

  /**
   * this is called when a dynamic operation's parameter updates and therefore, must change inlet values
   * @param node_id an object containing the id of hte parameter that has changed
   * @param param_id the id of the parameter that changed
   * @param value the value at that parameter
   * @returns a list of inlet values to add.
   */
   onDynanmicOperationParamChange(name: string, inlets: Array<any>, param_id: number, param_val: any) : Array<any>{


    const op = this.ops.getOp(name);

      let param_type = op.params[param_id].type;

      //check to see if we should add or remove draft inputs
      if(param_id === (<DynamicOperation>op).dynamic_param_id){
        const type = (<DynamicOperation>op).dynamic_param_type;

        let static_inputs = op.inlets.filter(el => el.type === 'static');
        let num_dynamic_inlets = inlets.length - static_inputs.length;

        switch(type){

          case 'notation':
            const matches = utilInstance.parseRegex(param_val, (<StringParam>op.params[0]).regex);
            inlets = inlets.slice(0,static_inputs.length);
            matches.forEach(el => {
              inlets.push(el);
            })
          break;

          case 'draft':
            if(param_val !== -1){
              const draftNode = <DraftNode> this.getNode(param_val);
              const uniqueVals = utilInstance.filterToUniqueValues(draftNode.loom.threading);
              const inlet_nums = uniqueVals.length;
              console.log("loom is ", draftNode.loom)
              inlets = inlets.slice(0,static_inputs.length);
              for(let i = 0; i < inlet_nums; i++){
                inlets.push(i+1);
              }
            }
          break;

          
          case 'number':

          if(param_type === 'number'){
            if(param_val > num_dynamic_inlets){
              for(let i = num_dynamic_inlets; i < param_val; i++){
                  inlets.push(i+1);
              }
            }else if(param_val < num_dynamic_inlets){
              const delete_num = num_dynamic_inlets - param_val;
              inlets = inlets.slice(0, -delete_num);
            }
          }else if(param_type == 'string'){
            const all_inputs = param_val.split(' ');
            const unique_values = utilInstance.filterToUniqueValues(all_inputs);
            inlets = inlets.slice(0,static_inputs.length);
            unique_values.forEach(el => {
              inlets.push(el);
            })
          }

          break;
          case 'system':
             static_inputs = op.inlets.filter(el => el.type === 'static');
             num_dynamic_inlets = inlets.length - static_inputs.length;

            if(param_val > num_dynamic_inlets){
              for(let i = num_dynamic_inlets; i < param_val; i++){
                  this.systemsservice.weft_systems[i].in_use = true;
                  inlets.push(i);  
              }
            }else if(param_val < num_dynamic_inlets){
              inlets = inlets.slice(0, param_val+static_inputs);
            }
          break;

            

        }
      }
    return inlets;
  }



  /**
   * loads data into an operation node from a file load, or when an operation is first instantiated,  or undo/redo event
   * @param entry the upload entry associated with this node or null if there was no upload associated
   * @param name the name of the operation
   * @param params the parameters to input
   * @param inlets an array containing the paramteres that get mapped to inputs at each inlets
   * @returns the node and the entry
   */
   loadOpData(entry: {prev_id: number, cur_id: number}, name: string, params:Array<any>, inlets: Array<any>) : Promise<{on: OpNode, entry:{prev_id: number, cur_id: number}}>{
    

    const nodes = this.nodes.filter(el => el.id === entry.cur_id);
    let op = this.ops.getOp(name);

    if(nodes.length !== 1){
      return Promise.reject("found 0 or more than 1 nodes at id "+entry.cur_id);
    } 

    const node = nodes[0];

    if(op === undefined || op === null){
       return Promise.reject("no op of name:"+name+" exists");

    }  



    if(params === undefined){
      params = [];
    }

    if(params === undefined){
      inlets = [];
    }

    const param_types = op.params.map(el => el.type);


      const formatted_params = param_types.map((type, ndx) => {
        switch(type){
          case "boolean":
            return (params[ndx]) ? 1 : 0;
          
            case "file":
              return params[ndx];
        
            default:
              return params[ndx];
        }
      });
  
      const default_param_values = this.ops.getOp(name).params.map(el => el.value);
  
      //this gets teh default values for the opration
      //this overwrites some of those with any value that has been previous added
      const params_out = default_param_values.map((p, ndx) => {
        if(ndx < params.length) return formatted_params[ndx];
        else return p;
      });

      const default_inlet_values = this.ops.getOp(name).inlets.map(el => el.value);

      if(inlets === undefined || inlets.length == 0){
        inlets = default_inlet_values.slice();
        if(this.ops.isDynamic(name)){
          const op = <DynamicOperation> this.ops.getOp(name);
          let dynamic_inlets = this.onDynanmicOperationParamChange(name, inlets, op.dynamic_param_id, op.params[op.dynamic_param_id].value);
          inlets = dynamic_inlets.slice();
        }
      }

       inlets = inlets.map(el => (el === null) ? 0 : el); 

  
      node.dirty = false;
      (<OpNode> node).name = name;
      (<OpNode> node).params = params_out.slice();
      (<OpNode> node).inlets = inlets.slice();
  
     return Promise.resolve({on:<OpNode> nodes[0], entry});
  


  
  }


  /**
   * call to update all local looms by the global loom setting
   */
  updateLooms(){

    this.getDraftNodes().forEach(dn => {
      dn.loom.overloadType(this.ws.type);
      dn.loom.overloadUnits(<"in" | "cm"> this.ws.units);
      dn.loom.setMinFrames(this.ws.min_frames);
      dn.loom.setMinTreadles(this.ws.min_treadles);
      dn.loom.recomputeLoom(dn.draft);
    });

  }


  setPreview(sd: any, draft: Draft) : Promise<DraftNode>{
    this.preview = {
      id: -1,
      type: "draft",
      ref: sd.hostView,
      component: <SubdraftComponent> sd.instance,
      dirty: true, 
      draft: cloneDeep(draft),
      loom: null
    }

    sd.dirty = true;

    return Promise.resolve(this.preview);
  
  }

  setPreviewDraft(draft: Draft) : Promise<DraftNode>{
    if(this.preview === undefined) return Promise.reject("preview undefined");
      this.preview.draft = cloneDeep(draft);
      this.preview.dirty = true;
      (<SubdraftComponent> this.preview.component).draft = draft;
      return Promise.resolve(this.preview);
  }



  unsetPreview(){
    this.preview = undefined;
  }

  hasPreview():boolean{
      if(this.preview === undefined) return false;
      return true;
  }


  getPreview() : DraftNode{
    return this.preview;
  }

  getPreviewComponent() : SubdraftComponent{
    return <SubdraftComponent> this.preview.component;
  }

  /**
   * returns a list of all the node ids of drafts that are dirty (including preview)
   */
  getDirtyDrafts() : Array<number> {

    return this.nodes.filter(el => el.type === "draft")
      .concat(this.preview)
      .filter(el => el.dirty)
      .map(el => el.id);
  }


 /**
  * load the data into the draft node
  * @param entry the map entry associated with this node, null if not supplied
  * @param id the id of this node, which should match the component
  * @param draft the draft to associate with this node
  * @param loom the loom to associate with this node
  * @returns the created draft node and the entry associated with this
  */
  loadDraftData(entry: {prev_id: number, cur_id: number}, draft: Draft, loom: Loom) : Promise<{dn: DraftNode, entry:{prev_id: number, cur_id: number}}>{

    const nodes = this.nodes.filter(el => el.id === entry.cur_id);

    if(nodes.length !== 1) return Promise.reject("found 0 or more than 1 nodes at id "+entry.cur_id);

    nodes[0].dirty = true;

    draft.overloadId(entry.cur_id);
   (<DraftNode> nodes[0]).draft = cloneDeep(draft);


   if(loom === null){
   (<DraftNode> nodes[0]).loom = new Loom(draft, this.ws.type, this.ws.min_frames, this.ws.min_treadles);

   (<DraftNode> nodes[0]).loom.recomputeLoom(draft);
   }else{
    (<DraftNode> nodes[0]).loom = loom;
   }



   return Promise.resolve({dn: <DraftNode> nodes[0], entry});

  }


  /**
   * loads in data to the nodes, from undo/redo or new file additions.
   * when loading new files or states, the tree will have been previously cleared. \
   * when loading new nodes from a file into an existing workspace,new ids must be assigned to ensure they are unique
   * nodes are loaded before the view has been inititialized 
   * when new data is loaded, it makes sure each of the ids generated is unique
   * @param type the type of node to create
   * @param id the current id of the 
   * @returns a map representating any id changes
   */
  loadNode(type: 'draft'|'op'|'cxn', id: number):{prev_id: number, cur_id: number}{

    let node: Node;

  
    switch(type){
      case 'draft':
        node = <DraftNode> {
          type: type,
          ref: null,
          id: this.getUniqueId(),
          component: null,
          dirty: false,
          draft: null,
          loom:null
        }
        break;
      case 'op': 

      node = <OpNode> {
        type: type,
        ref: null,
        id: this.getUniqueId(),
        component: null,
        dirty: false,
        params: [],
        inlets: [],
        name: ''
      }
      break;
      default: 
       node = {
        type: type,
        ref: null,
        id: this.getUniqueId(),
        component: null,
        dirty: false,
      }
      break;
    }


    this.nodes.push(node);

      this.tree.push({
        node: node,
        parent: null,
        outputs: [],
        inputs: []
      });


  
    return {prev_id: id, cur_id: node.id};
  }




  getConnectionsInvolving(node_id: number) : {from: number, to: number}{

    const tn = this.getTreeNode(node_id);
    if(tn.outputs.length !== 1) console.error("connection node has more than one to");
    if(tn.inputs.length !== 1) console.error("connection node has more than one from");

    return {from: tn.inputs[0].tn.node.id, to: tn.outputs[0].tn.node.id};


  }


  /**
   * given an operation and a connection, return the inlet to which this connection inserts 
   * @param op_id 
   * @param cxn_id 
   * @param returns the position index of the cxn or -1 if not found
   */
  getInletOfCxn(op_id: number, cxn_id) : number {
    const inputs = this.getInputsWithNdx(op_id);
    const ndx:Array<number> = inputs
      .filter(el => el.tn.node.id === cxn_id)
      .map(el => el.ndx);

    if(ndx.length === 0 ) return -1;
    if(ndx.length === 1) return ndx[0];

    console.error("connection found at more than one inlet");
    return -1;
      
  }

  /**
   * before performing a dynamic op, make sure that their are no connections that are pointing to an inlet that nolonger exists
   * @param id - the object id we are checking
   * @returns an array of viewRefs for Connections to remove.
   */
  sweepInlets(id: number) : Promise<Array<ViewRef>>{

     const opnode: OpNode = this.getOpNode(id);
     const op: Operation = this.ops.getOp(opnode.name);
     const inputs_to_op:Array<IOTuple> = this.getInputsWithNdx(id);

    const num_constant_inlets = op.inlets.length;

    //filter out inputs that are matched to an index highter than what we offer
    const missing_inlets: Array<IOTuple> = inputs_to_op
      .filter((el) => el.ndx >= opnode.inlets.length)

    const viewRefs = missing_inlets.map(el => el.tn.node.ref);

    
    missing_inlets.forEach(el => {
        this.removeConnectionNode(el.tn.inputs[0].tn.node.id, el.tn.outputs[0].tn.node.id, el.ndx);
    });

    return Promise.resolve(viewRefs);

  }
    

  /**
   * sets the open connection
   * @param id the value to set the open connection to
   * @returns  true if the id maps to a subdraft
   */
  setOpenConnection(id: number) : boolean {
    if(this.getType(id) !== 'draft') return false;
    this.open_connection = id; 
    console.log("set open connection", id)
    return true;
  }

  hasOpenConnection():boolean{
    return this.open_connection !== -1;
  }

  getOpenConnection(): SubdraftComponent{
    return <SubdraftComponent> this.getComponent(this.open_connection);
  }

  /**
   * TEMP DISABLE DUE TO CAUSING PROBLEMS 
   * unsets the open connection
   * @returns  true if it indeed changed the value
   */
  unsetOpenConnection() : boolean{
    // console.log("unsetting open cxn")
    // const b = this.open_connection !== -1;
    // this.open_connection = -1;
      return true;
  }

  setNodeComponent(id: number, c: SubdraftComponent | OperationComponent | ConnectionComponent){
    const node: Node = this.getNode(id);
    node.component = c;
  }

  setNodeViewRef(id: number, v: ViewRef){
    const node: Node = this.getNode(id);
    node.ref = v;
  }

  /** clears all the data associated with this tree */
  clear(){
    this.tree = [];
    this.nodes = [];
  }


  /** depends on having nodes created first so that all tree nodes are present */


  /**
   * this function is called from the mixer when processing file data. It depends on having all nodes created first. 
   * @param id_map this is a map created on upload that maps uploaded ids to the current ids. 
   * @param node_id the current node_id
   * @param parent_id the current treenode id of the parent node
   * @param inputs the current treenode ids for all inputs
   * @param outputs the current treenode ids for all outputs
   * @returns an object that holds the tree node as well as its associated map entry
   */
  async loadTreeNodeData(id_map: any, node_id: number, parent_id: number, inputs:Array<{tn: number, ndx: number}>,  outputs:Array<{tn: number, ndx: number}>): Promise<{tn: TreeNode, entry: {prev_id: number, cur_id: number}}>{

    const entry = id_map.find(el => el.cur_id === node_id);
  
    const tn: TreeNode = this.getTreeNode(node_id);
    tn.parent = (parent_id === -1) ? null : this.getTreeNode(parent_id);
    tn.inputs = inputs.map(input => {return {tn: this.getTreeNode(input.tn), ndx: input.ndx}});
    tn.outputs = outputs.map(output => {return {tn: this.getTreeNode(output.tn), ndx: output.ndx}});
    return Promise.resolve({tn, entry});


  }



  /**
   * create an node and add it to the tree (without relationships)
   * @param id a unique id for this component, ideally created by the viewCompomentRef 
   * @param type the type of component
   * @param component the compoenent instance
   * @returns the id assigned
   */
  createNode(type: 'draft'|'op'|'cxn', component: SubdraftComponent | OperationComponent | ConnectionComponent, ref: ViewRef):number{


    let node: Node;

    switch(type){
      case 'draft':
        node = <DraftNode> {
          type: type,
          ref: ref,
          id: this.getUniqueId(),
          component: component,
          dirty: false,
          draft: null
        }
        break;
      case 'op': 
      node = <OpNode> {
        type: type,
        ref: ref,
        id: this.getUniqueId(),
        component: component,
        inlets: [],
        dirty: false,
        params: [],
        name: ''
      }


      break;
      default: 
       node = {
        type: type,
        ref: ref,
        id: this.getUniqueId(),
        component: component,
        dirty: false,
      }
      break;
    }

    this.nodes.push(node);

      this.tree.push({
        node: node,
        parent: null,
        outputs: [],
        inputs: []
      });
    

    return node.id;
  }

  getComponent(id:number): SubdraftComponent | ConnectionComponent | OperationComponent{
    const node: Node = this.getNode(id);
    return node.component; 
  }

  getComponents():Array<any>{
    return this.nodes.map(node => node.component);
  }

  getNode(id:number):Node{
    const ndx: number = this.getNodeIndex(id);
    if(ndx === -1) return null;
    return this.nodes[ndx]; 
  }

  getNodeIdList() : Array<number> {
    return this.nodes.map(node => node.id);
  }

  getNodeIndex(id:number):number{
    return this.nodes.findIndex(el => (el.id == id));
  }

  getType(id:number):string{
    const node: Node = this.getNode(id);
    return node.type;
  }

  getViewRef(id:number):ViewRef{
    const node: Node = this.getNode(id);
    return node.ref;
  }


  /**
   * get's this subdraft's parent
   * @param sd_id 
   * @returns the parent's id, or -1 if it has no parent
   */
  getSubdraftParent(sd_id: number):number{
    const tn: TreeNode = this.getTreeNode(sd_id);
    if(tn.parent === null || tn.parent === undefined) return -1;
    else return tn.parent.node.id;
  }

  hasParent(sd_id: number) : boolean{
    return (this.getSubdraftParent(sd_id) === -1) ? false : true;
  }

  /**
   * return the connection objects that are immediately attached to this object
   * @param id - the node id
   * @returns an array of id's for the immediatly connected connections
   */
  getNodeConnections(id: number):Array<number>{
    const tn: TreeNode = this.getTreeNode(id);
    const out_node: Array<Node> = tn.outputs.map(el => el.tn.node);
    const out_cxn: Array<Node> = out_node.filter(el => el.type === 'cxn');
    const in_node: Array<Node> = tn.inputs.map(el => el.tn.node);
    const in_cxn: Array<Node> = in_node.filter(el => el.type === 'cxn');
    const join: Array<Node> = out_cxn.concat(in_cxn);
    return join.map(el => el.id);
  }

  /**
   * gets a list of non-connection nodes that need to be updated if this node moves. 
   * this takes into acccount that some nodes have a parent that will move with them.
   * @param id 
   * @returns 
   */
  getNodesToUpdateOnMove(id: number){

    const tn: TreeNode = this.getTreeNode(id);
    let to_check: Array<number> = [id];

    if(this.isMultipleParent(id) || this.isSibling(id)) return to_check;
    
    //the parent if there is one
    if(tn.parent !== null) to_check.push(tn.parent.node.id);

    //add the child this node generated if there is one. 
    const outputs: Array<TreeNode> = this.getNonCxnOutputs(id).map(el => this.getTreeNode(el));


    const has_parents: Array<TreeNode> = outputs.filter(el => (el.parent !== null));
    const is_child: Array<number> = has_parents.filter(el => (el.parent.node.id === id)).map(el => el.node.id);

    if(is_child.length > 0) to_check = to_check.concat(is_child);

    

    return to_check;

  }

  /**
   * called on an operation to check if it can accept connections from a given subdraft
   * @param id - the id of the operation in question
   * @param inlet - the inlet id we are looking at
   */
  canAcceptConnections(id: number, inlet: number) : boolean {

    if(this.open_connection === -1) {
    console.error("no open connection");
    return false;    //there is no open connection
    }
  
    const parent_op = this.getSubdraftParent(this.open_connection);
    
    if(parent_op === id){
      return false; //can't be an input to your parent
    } 

    const is_already_connected = this.getInputsAtNdx(id, inlet).length > 0 && this.getInputs(id).find(el => el === this.open_connection) !== undefined;
    if(is_already_connected){
     // console.error("already connected, draft=", this.open_connection, " opid=", id);
      return false; //these two things are already directly connected
    } 

    

    const has_room = (this.getInputs(id).length < (<OperationComponent> this.getComponent(id)).op.inlets[inlet].num_drafts || (<OperationComponent> this.getComponent(id)).op.inlets[inlet].num_drafts == -1);
    if(!has_room) return false;

    if(parent_op === -1 && has_room) return true; //if you don't have a parent and there is room, go for it

    const upstream  = this.getUpstreamOperations(parent_op);
    const no_circles = upstream.length == 0 || upstream.find(el => el === parent_op) == -1;

    return has_room && no_circles;
  }

  /**
   * test if this node has children, as opposed to just zero
   * @param id 
   * @returns a boolean 
   */
   isParent(id: number):boolean{
    const tn: TreeNode = this.getTreeNode(id);
    return (tn.outputs.length > 0);
  }

  /**
   * test if this node is a seed (e.g. has no inputs)
   * @param id 
   * @returns a boolean 
   */
    isSeedDraft(id: number):boolean{
      const tn: TreeNode = this.getTreeNode(id);
      return (this.getType(id) === "draft" && tn.inputs.length === 0);
    }

    /**
   * test if this node has just one child. 
   * @param id 
   * @returns a boolean 
   */
    hasSingleChild(id: number):boolean{
        const tn: TreeNode = this.getTreeNode(id);
        return (tn.outputs.length === 1);
    }


    /**
     * test if this node has just one child and that child subdraft is currently hidden 
     * @param id 
     * @returns a boolean 
     */
      opHasHiddenChild(id: number):boolean{
          const tn: TreeNode = this.getTreeNode(id);
          const outs = this.getNonCxnOutputs(id);

          if(outs.length === 0) return false;

          const child_id = outs.shift();
          const sd = <SubdraftComponent> this.getComponent(child_id);
          return !sd.draft_visible;
      }
  
    


  /**
   * test if this node has many children, as opposed to just one
   * @param id 
   * @returns a boolean 
   */
  isMultipleParent(id: number):boolean{
    const tn: TreeNode = this.getTreeNode(id);
    return (tn.outputs.length > 1);
  }

  /**
   * test if two components are siblings (e.g. they have the same parent). 
   * if we pass the same id in for both, it will return false
   * @param id 
   * @returns a boolean 
   */
   areSiblings(a_id: number, b_id: number):boolean{

    if(a_id === b_id) return false; 

    const atn: TreeNode = this.getTreeNode(a_id);
    const btn: TreeNode = this.getTreeNode(b_id);
    if(atn.parent == null || btn.parent == null) return false;
    return (atn.parent.node.id === btn.parent.node.id);
  }

    /**
   * test if this node is a sibling of the one provided
   * @param id 
   * @returns a boolean 
   */
    isSibling(id: number):boolean{
    const tn: TreeNode = this.getTreeNode(id);
    if(tn.parent == null) return false;
    return (this.getTreeNode(tn.parent.node.id).outputs.length > 1);
  }
  


  /**
   * given a node, recusively walks the tree and returns a list of all the operations that are affected
   * @param id 
   * @returns an array of operation ids for nodes that need recalculating
   */
  getDownstreamOperations(id: number):Array<number>{

    let ops: Array<number> = [];
    const tn: TreeNode = this.getTreeNode(id);
    if(tn.outputs.length > 0){

      tn.outputs.forEach(el => {
        if(el.tn.node.type == 'op'){
          ops.push(el.tn.node.id);  
        }
        ops = ops.concat(this.getDownstreamOperations(el.tn.node.id));
      });
    }
    return ops;
  }

    /**
   * given a node, recusively walks the tree and returns a list of all the operations that are linked up the chain to this component
   * @param id 
   * @returns an array of operation ids that influence this draft
   */
     getUpstreamOperations(id: number):Array<number>{

      let ops: Array<number> = [];
      const tn: TreeNode = this.getTreeNode(id);

      if(tn.inputs.length > 0){
        tn.inputs.forEach(el => {
          if(el.tn.node.type === 'op'){
            ops.push(el.tn.node.id);  
          }
          ops = ops.concat(this.getUpstreamOperations(el.tn.node.id));
        });
      }
      return ops;
    }


    /**
   * given a node, recusively walks the tree and returns a list of all the drafts that are linked up the chain to this component
   * @param id 
   * @returns an array of draft ids that influence this draft
   */
     getUpstreamDrafts(id: number):Array<number>{
      let ops: Array<number> = [];
      const tn: TreeNode = this.getTreeNode(id);
      
      if(tn.inputs.length > 0){
        tn.inputs.forEach(el => {
          if(el.tn.node.type == 'draft'){
            ops.push(el.tn.node.id);  
          }
          ops = ops.concat(this.getUpstreamDrafts(el.tn.node.id));
        });
      }
      return ops;
    }

/**
   * removes a subdraft and all associated connections from the tree, returns the nodes
   * @param id {number}  

   */
 removeSubdraftNode(id: number) : Array<Node>{


  const deleted:Array<Node> = []; 
  if(id === undefined) return;




  //get any input ops and connections
  const ops_in: Array<number> = this.getNonCxnInputs(id);
  const cxns_in: Array<number> = this.getInputs(id);

  //get output connections and subdrafts
  const cxns_out: Array<number> = this.getOutputs(id); //the connection between the op and child subdrafts
  const ops_out: Array<number> = this.getNonCxnOutputs(id); //get all 
  
  //get all the output connections of those subdrafts
  const op_in_cxns: Array<number> = ops_in.reduce((acc, el) => {
    return acc.concat(this.getInputs(el))
  }, []);

  // console.log("Ops in", ops_in);
  // console.log("CXNs in", cxns_in);
  // console.log("CXNs out", cxns_out);
  // console.log("OPSs out", ops_out);
  // console.log("op connections in", op_in_cxns);

  deleted.push(this.removeNode(id));

  cxns_in.forEach(el => {
    deleted.push( this.removeNode(el));
  });

  cxns_out.forEach(el => {
    deleted.push( this.removeNode(el));
  });


  ops_in.forEach(el => {
    deleted.push( this.removeNode(el));
  });


  op_in_cxns.forEach(el => {
    deleted.push( this.removeNode(el));
  });
 // deleted.concat(sds_in.map(el => this.removeNode(el)));
 // deleted.concat(cxns_in.map(el => {return this.removeNode(el)}));
 // deleted.concat(cxns_out.map(el => {return this.removeNode(el)}));
  //deleted.concat(sds_out.map(el => {return this.removeNode(el)}));
  //deleted.concat(sds_out_cxns.map(el => {return this.removeNode(el)}));
  
  return deleted;

}

/**
 * deletes an operation node and any associated subdrafts and connections
 * @param id - the operation to remove
 * @returns a list of all nodes removed as a result of this action
 */
removeOperationNode(id:number) : Array<Node>{


  const deleted:Array<Node> = []; 
  if(id === undefined) return;


  //get any input subdrafts and connections
  const sds_in: Array<number> = this.getNonCxnInputs(id);
  
  const cxns_in: Array<number> = this.getInputs(id);

  //get output connections and subdrafts
  const cxns_out: Array<number> = this.getOutputs(id); //the connection between the op and child subdrafts
  const sds_out: Array<number> = this.getNonCxnOutputs(id); //get all 
  
  //get all the output connections of those subdrafts
  const sds_out_cxns: Array<number> = sds_out.reduce((acc, el) => {
    return acc.concat(this.getOutputs(el))
  }, []);

  // console.log("SDs in", sds_in);
  // console.log("CXNs in", cxns_in);
  // console.log("CXNs out", cxns_out);
  // console.log("SDs out", sds_out);
  // console.log("sd connections out", sds_out_cxns);

  deleted.push(this.removeNode(id));

  cxns_in.forEach(el => {
    deleted.push( this.removeNode(el));
  });

  cxns_out.forEach(el => {
    deleted.push( this.removeNode(el));
  });


  sds_out.forEach(el => {
    deleted.push( this.removeNode(el));
  });


  sds_out_cxns.forEach(el => {
    deleted.push( this.removeNode(el));
  });
  return deleted;
    
}

/**
 * deletes a connection
 * @param id - the connection to remove
 * @returns a list of all nodes removed as a result of this action
 */
 removeConnectionNode(from:number, to:number, inletid: number) : Array<Node>{


  const cxn_id:number = this.getConnectionAtInlet(from, to, inletid);
  console.log("got connection ", cxn_id);

  const deleted:Array<Node> = []; 
  if(cxn_id === undefined) return;

  console.log("removeing node in connection")
  deleted.push(this.removeNode(cxn_id));

  return deleted;
    
}


/**
 * this removes a node from the list and tree
 * @param id the id of the node to be removed
 * @returns the node it removed
 */
  removeNode(id: number) : Node{

    console.log("REMOVE NODE CALLED ON ", id);

    const deleted: Array<Node> = [];

    const node: Node = this.getNode(id);
    deleted.push(node);
    if(node === undefined) return;


    this.removeNodeTreeAssociations(node.id);
   
    //remove all connections connecting to and from this node
    const ndx: number = this.getNodeIndex(id);
    const i: number = this.tree.findIndex(el => (el.node.id == id));
    this.tree.splice(i, 1);
    this.nodes.splice(ndx, 1);

    return node;
  
  }




  /**
   * searches within the downstream ops for all opnodes and when a "dirty" node has all possible inputs fulfilled
   * @returns return a list of those nodes
   */
  getNodesWithDependenciesSatisfied() : Array<OpNode>{

    const dependency_nodes: Array<OpNode> = this.nodes
    .filter(el => el.dirty && el.type === "op")
    .map(el => <OpNode> el);

    // const dependency_nodes: Array<OpNode> = ds
    // .map(el => <OpNode> this.getNode(el))
    // .filter(el => el.dirty);

    const ready: Array<OpNode> = dependency_nodes.filter((el, ndx) => {
      const depends_on: Array<number> = this.getUpstreamOperations(el.id);
      const needs = depends_on.map(id => this.getNode(id).dirty);
      const find_true = needs.findIndex(el => el === true);
      if(find_true === -1) return el;
    });
  
    return ready;
  }


/**
   * given the results of an operation, updates any associated drafts, creating or adding null drafts to no longer needed drafts
   * since this function cannot delete nodes, it makes nodes that no longer need to exist as null for later collection
   * @param res the list of results from perform op
   * @returns a list of the draft nodes touched. 
   */
 async updateDraftsFromResults(parent: number, res: Array<Draft>) : Promise<Array<number>>{

  const out = this.getNonCxnOutputs(parent);
  const touched: Array<number> = [];



  //console.log("updating drafts, there are currently: ", out.length, "existing ouputs and ", res.length, "new outputs");

  if(out.length === res.length){
    out.forEach((output, ndx) => {
      this.setDraft(output, res[ndx],null);
      touched.push(output);
    });
    return Promise.resolve(touched);

  }else if(out.length > res.length){
    for(let i = res.length; i < out.length; i++){
      const dn = <DraftNode> this.getNode(out[i]);
      dn.draft = new Draft({wefts:1, warps:1, pattern:[[new Cell(false)]]});
      dn.loom = new Loom(dn.draft, this.ws.type, this.ws.min_frames, this.ws.min_treadles);
      dn.dirty = true;
      touched.push(out[i]);
    }
    return Promise.resolve(touched);
  }else{
    const fns:Array<any> = [];
    for(let i = out.length; i < res.length; i++){
      const id = this.createNode('draft', null, null);
      const cxn = this.createNode('cxn', null, null);
      this.addConnection(parent, 0,  id, 0,  cxn);
      fns.push(this.loadDraftData({prev_id: -1, cur_id: id}, res[i], null)); //add loom as null for now as it assumes that downstream drafts do not have custom loom settings (e.g. they can be generated from drawdown)
    }

    return Promise.all(fns)
    .then(drafts_loaded => {
     const ids = drafts_loaded.map(el => el.entry.cur_id);
     return Promise.resolve(ids);
    });
    
  

  }

}






/**
 * deteremines which ops are "top level" meaning there is no op above them 
 * @returns 
 */
  async performTopLevelOps(): Promise<any> {



    //mark all ops as dirty to start
    this.nodes.forEach(el => {
      if(el.type === "op") el.dirty = true;
    })

    const top_level_nodes = 
      this.nodes
      .filter(el => el.type === 'op')
      .filter(el => this.getUpstreamOperations(el.id).length === 0)
      .map(el => el.id);


    return this.performGenerationOps(top_level_nodes);

  }

  /**
   * given a list of operations to perform, recursively performs all on nodes that have dependencies satisified
   * only after entire generation has been calculated
   * @param op_fn_list 
   * @returns //need a way to get this to return any drafts that it touched along the way
   */
  performGenerationOps(op_node_list: Array<number>) : Promise<any> {


    const needs_computing = op_node_list.filter(el => this.getOpNode(el).dirty);

    if(needs_computing.length == 0) return Promise.resolve([]);

    const op_fn_list = needs_computing.map(el => this.performOp(el));
   
    
    return Promise.all(op_fn_list).then( out => {
      const flat:Array<number> = out.reduce((acc, el, ndx)=>{
        return acc.concat(el);
      }, []);

      return this.getNodesWithDependenciesSatisfied();

    }).then(needs_performing => {
      const fns = needs_performing.filter(el => el.dirty).map(el => el.id);
      if(needs_performing.length === 0) return [];
      return  this.performGenerationOps(fns);    
    });

    
  }


 /**
  * takes a draft as input, and flips the order of the rows, used 
  * @param draft 
  */ 
flipDraft(draft: Draft) : Promise<Draft>{

  const nd: Draft = new Draft(draft);
  const reversed_pattern:Array<Array<Cell>> = [];
  const reversed_row_shut:Array<number> = [];
  const reversed_row_sys:Array<number> = [];
  for(let i = draft.pattern.length -1; i >= 0; i--){
    reversed_pattern.push(draft.pattern[i]);
    reversed_row_shut.push(draft.rowShuttleMapping[i]);
    reversed_row_sys.push(draft.rowSystemMapping[i]);
  }
  nd.pattern = reversed_pattern;
  nd.rowShuttleMapping = reversed_row_shut;
  nd.rowSystemMapping = reversed_row_sys;
  nd.overloadId(draft.id);
  return Promise.resolve(nd);
}


isValidIOTuple(io: IOTuple) : boolean {
  if(io === null || io === undefined) return false;
  const draft_tn = io.tn.inputs[0].tn;
  const cxn_tn = io.tn;
  const type = draft_tn.node.type;  
  const draft: Draft = (<DraftNode>draft_tn.node).draft;
  if(draft === null || draft === undefined) return false;
  if(draft.wefts == 0 || draft.warps == 0) return false;
  return true;
}



/**
 * performs the given operation
 * returns the list of draft ids affected by this calculation
 * @param op_id the operation triggering this series of update
 */
 async performOp(id:number) : Promise<Array<number>> {

  const opnode = <OpNode> this.getNode(id);
  const op = this.ops.getOp(opnode.name);

  const drafts_in = this.getNonCxnInputs(id);
  const all_inputs = this.getInputsWithNdx(id);
  

  let inputs: Array<OpInput> = [];

  //if(this.ops.isDynamic(opnode.name)){
    
    //first push the parent params

    inputs.push({op_name: op.name, drafts: [], inlet: -1, params: opnode.params});

    const flip_fns = [];
    const draft_id_to_ndx = [];
    all_inputs.filter(el => this.isValidIOTuple(el))
    .forEach((el) => {
      
      const draft_tn = el.tn.inputs[0].tn;
      const cxn_tn = el.tn;
      const type = draft_tn.node.type;
      if(type === 'draft'){
        draft_id_to_ndx.push({ndx: el.ndx, draft_id: draft_tn.node.id, cxn: cxn_tn.node.id})
        flip_fns.push(this.flipDraft((<DraftNode>draft_tn.node).draft));
      }
    });


   
    return Promise.all(flip_fns)
    .then(flipped_drafts => {
       
      const paraminputs = draft_id_to_ndx.map(el => {
          const draft = flipped_drafts.find(draft => draft.id === el.draft_id);
          if(draft === undefined) return undefined;
          else return {op_name:'child', drafts: [draft], inlet: el.ndx, params: [opnode.inlets[el.ndx]]}
        })
      
      const cleaned_inputs = paraminputs.filter(el => el != undefined);

      inputs = inputs.concat(cleaned_inputs);
      return op.perform(inputs);

    })
    .then(res => {
          return Promise.all(res.map(el => this.flipDraft(el)));
      })
    .then(flipped => {
        opnode.dirty = false;
        return this.updateDraftsFromResults(id, flipped);
      });
          

    // }else{
    //   const drafts_coming_in: Array<any> =  drafts_in
    //   .map(input => (<DraftNode> this.getNode(input)))
    //   .filter(el => el !== null && el !== undefined)
    //   .map(input_node => input_node.draft)
    //   .filter(el => el !== null && el !== undefined)
    //   .map(el => this.flipDraft(el));

    //   return Promise.all(drafts_coming_in).then(drafts =>{
    //       inputs.push({op_name: '', drafts: drafts, inlet: 0, params: opnode.params});
    //       return op.perform(inputs)
    //       .then(res => {
    //         return Promise.all(res.map(el => this.flipDraft(el)))
    //       }).then(flipped => {
    //         opnode.dirty = false;
    //         return this.updateDraftsFromResults(id, flipped)
    //       })
            
    //     });
    // }

  

  }




  getDraftNodes():Array<DraftNode>{
    return this.nodes.filter(el => el.type === 'draft').map(el => <DraftNode> el);
  }

  getDrafts():Array<SubdraftComponent>{
    const draft_nodes: Array<Node> = this.nodes.filter(el => el.type == 'draft');
    const draft_comps: Array<SubdraftComponent> = draft_nodes.map(el => <SubdraftComponent>el.component);
    return draft_comps;
  }

  getLoom(id: number):Loom{
    if(id === -1) return null;
    const dn: DraftNode = <DraftNode> this.getNode(id);
    if(dn === null || dn === undefined) return null;
    return dn.loom;
  }

  getLooms():Array<Loom>{
    const dns = this.getDraftNodes();
    return dns.map(el => el.loom);
  }

  getDraft(id: number):Draft{
    if(id === -1) return this.preview.draft;
    const dn: DraftNode = <DraftNode> this.getNode(id);
    if(dn === null || dn === undefined) return null;
    return dn.draft;
  }

  getDraftName(id: number):string{
    if(id === -1) return this.preview.draft.ud_name;
    const dn: DraftNode = <DraftNode> this.getNode(id);
    if(dn === null || dn === undefined || dn.draft === null) return "null draft";
    return (dn.draft.ud_name === "") ?  dn.draft.gen_name : dn.draft.ud_name; 
  }


  getConnections():Array<ConnectionComponent>{
    const draft_nodes: Array<Node> = this.nodes.filter(el => el.type === 'cxn');
    const draft_comps: Array<ConnectionComponent> = draft_nodes.map(el => <ConnectionComponent>el.component);
    return draft_comps;
  }

  getOperations():Array<OperationComponent>{
    const draft_nodes: Array<Node> = this.nodes.filter(el => el.type === 'op');
    const draft_comps: Array<OperationComponent> = draft_nodes.map(el => <OperationComponent>el.component);
    return draft_comps;
  }

  getOpNodes():Array<OpNode>{
    return this.nodes.filter(el => el.type === 'op').map(el => (<OpNode> el));
  }

  /**
   * @todo update this to handle clear nodes whole input indexes no longer exist
   * scans the connections and checks that the to and from nodes AND INDEXES still exist
   * @returns an array of connections to delete
   */

  getUnusuedConnections():Array<number>{
    const comps: Array<Node> = this.nodes.filter(el => el.type === 'cxn');
    const nodes: Array<TreeNode> = comps.map(el => this.getTreeNode(el.id));
    const to_delete: Array<TreeNode> = [];
    

    nodes.forEach(el =>{
      if(el.inputs.length === 0 || el.outputs.length === 0){
        to_delete.push(el);
        return;
      } 
      
      const null_inputs = el.inputs.filter(el => el.tn.node === null || el.tn.node === undefined);
      null_inputs.forEach(el => {
        to_delete.push(el.tn);
      })

      const null_outputs = el.outputs.filter(el => el.tn.node === null || el.tn.node === undefined);
      null_outputs.forEach(el => {
        to_delete.push(el.tn);
      })
    });

    return to_delete.map(el => el.node.id);
  }


  getTreeNode(id:number): TreeNode{
    const found =  this.tree.find(el => el.node.id === id);
    if(found === undefined){
      console.error("Tree node for ", id, "not found");
      return undefined;
    }
    return found;
  }

  /**
   * adds a connection from subddraft to operation. connections can be of the type 
   * subdraft -> op (input to op)
   * op -> subdraft (output generatedd by op)
   * @returns an array of the ids of the elements connected to this op

   */
  addConnection(from:number, from_ndx: number, to:number, to_ndx: number, cxn:number): Array<number>{


    let from_tn: TreeNode = this.getTreeNode(from);
    let to_tn: TreeNode = this.getTreeNode(to);
    const cxn_tn: TreeNode = this.getTreeNode(cxn);

    from_tn.outputs.push({tn:cxn_tn, ndx: from_ndx});
    cxn_tn.inputs = [{tn: from_tn, ndx: 0}];
    cxn_tn.outputs = [{tn: to_tn, ndx: 0}];
    to_tn.inputs.push({tn: cxn_tn, ndx: to_ndx});

    if(from_tn.node.type === 'op') to_tn.parent = from_tn;
    return this.getNonCxnInputs(to);

  }

  /**
   * this sets the parent of a subdraft to the operation that created iit
   * @returns an array of the subdraft ids connected to this operation
   */
   setSubdraftParent(sd:number, op:number){
    const sd_tn: TreeNode = this.getTreeNode(sd);
    const op_tn: TreeNode = this.getTreeNode(op);
    sd_tn.parent = op_tn;

  }



  /**
   * this removes the given id from the tree
   * given the structure of the code, this will never be called on a connection node, as only ops and subdrafts can be 
   * explicitly deleted.
   * @param id the id to delete 
   */
  private removeNodeTreeAssociations(id:number){
    const tn:TreeNode = this.getTreeNode(id);
    if(tn === undefined) return;

    //travel to all the trreenode's inputs, and erase this from their output
    tn.inputs.forEach(el => {
      const cxn_ndx_output:number = el.tn.outputs.findIndex(out => (out.tn.node.id == id)); 
      el.tn.outputs.splice(cxn_ndx_output, 1);
    });

    tn.outputs.forEach(el => {
      const cxn_ndx_input:number = el.tn.inputs.findIndex(i => (i.tn.node.id == id)); 
      el.tn.inputs.splice(cxn_ndx_input, 1);
    });

    tn.outputs = [];
    tn.inputs = [];
  }

  //finds the connection compoment associated with the subdraft sd
  getConnectionComponentFromSubdraft(sd_id: number): ConnectionComponent{
    
    const sd_node:TreeNode = this.getTreeNode(sd_id);
    if(sd_node.outputs.length == 0){
      console.log("Error: subdraft node did not have outputs");
      return null;
    } else if(sd_node.outputs.length > 1){
      console.log("Error: subdraft node had more than one output");
      return null;
    } 

    const cxn_node = sd_node.outputs[0].tn.node;
    return <ConnectionComponent> cxn_node.component;

  }

   /**
   * given a from, to, and inlet index, return the connection id 
   * @param from
   * @returns the node id of the connection, or -1 if that connection is not found
   */
  getConnectionAtInlet(from: number, to:number, ndx: number) : number{
    let found = -1;

    const inputs:Array<IOTuple> = this.getInputsWithNdx(to);
    const connection: Array<IOTuple> = inputs.filter(el => el.ndx == ndx);
    if(connection === undefined) return -1;

    if(connection.length == 1) return connection[0].tn.node.id;
    else{
      connection.forEach(connectionAtInlet => {
        const non_cnx_inputs = this.getInputs(connectionAtInlet.tn.node.id);
        const match_from = non_cnx_inputs.find(el => el === from);
        if(match_from !== undefined) found =  connectionAtInlet.tn.node.id;
      });
    }

    return found;
   
   }

  /**
   * given two nodes, returns the id of the connection node connecting them
   * @param a one node
   * @param b the otehr node node
   * @returns the node id of the connection, or -1 if that connection is not found
   */
  getConnection(a: number, b:number) : number{


     const set_a = this.nodes
     .filter(el => el.type === 'cxn')
     .filter(el => (this.getOutputs(el.id).find(treenode_id => this.getTreeNode(treenode_id).node.id === a)))
     .filter(el => (this.getInputsWithNdx(el.id).find(ip => ip.tn.node.id === b )));

     const set_b = this.nodes
     .filter(el => el.type === 'cxn')
     .filter(el => (this.getOutputs(el.id).find(treenode_id => this.getTreeNode(treenode_id).node.id === b)))
     .filter(el => (this.getInputsWithNdx(el.id).find(ip => ip.tn.node.id === a )));

     const combined = set_a.concat(set_b);

    if(combined.length === 0){
      console.error("No connection found between", a, b);
      return -1;
    } 

    if(combined.length > 1){
      console.error("more than one connection found");
    }

    return combined[0].id;
  
  }

  /**
   * checks if this node receives any input values
   * @param id the node id
   * @returns a boolean describing if an input exists
   */
  hasInput(id: number) : boolean {
    const tn: TreeNode = this.getTreeNode(id);
    return (tn.inputs.length > 0)
  }

/**
 * returns the ids of all nodes connected to the input node that are not connection nodes
 * @param op_id 
 */
 getNonCxnInputs(id: number):Array<number>{
    const inputs: Array<number> = this.getInputs(id);
    const id_list:Array<number> = inputs
    .map(id => (this.getNode(id)))
    .filter(node => node.type === 'cxn')
    .map(node => this.getConnectionInput(node.id))
   // const id_list:Array<number> = node_list.map(node => (node.type === 'cxn') ? this.getConnectionInput(node.id): -1);
    return id_list;
  }


  hasNdx(stored_input: number, input_to_function: number){
    if(input_to_function === -1) return false;
    if(stored_input === -1) return false;
    else return true;
  }

  /**
 * returns the ids of all nodes connected to the input node that are not connection nodes
 * in the case of dynamic ops, also provide the input index
 * @param op_id 
 */
 getOpComponentInputs(op_id: number, ndx: number):Array<number>{
  const inputs: Array<IOTuple> = this.getInputsWithNdx(op_id);
  const id_list:Array<number> = inputs
  .filter(param => param.ndx === ndx)
  .map(param => (param.tn.node))
  .filter(node => node.type === 'cxn')
  .map(node => this.getConnectionInput(node.id));
 // const id_list:Array<number> = node_list.map(node => (node.type === 'cxn') ? this.getConnectionInput(node.id): -1);
  return id_list;
}

/**
 * returns the ids of all nodes connected to the input node that are op nodes
 * @param op_id 
 */
 getOpInputs(id: number):Array<number>{
  const inputs: Array<number> = this.getInputs(id);
  const node_list:Array<Node> = inputs.map(id => (this.getNode(id)));
  //const id_list:Array<number> = node_list.map(node => (node.type === 'cxn') ? this.getConnectionInput(node.id): node.id);
  const id_list: Array<number> = node_list
      .filter(node => node.type === 'cxn')
      .map(node => this.getNode(this.getConnectionInput(node.id)))
      .filter(node => node.type === 'op')
      .map(node => node.id)
  return id_list;
}

/**
 * returns the ids of all nodes connected to the input node that are draft nodes
 * @param op_id 
 */
 getDraftInputs(id: number):Array<number>{
  const inputs: Array<number> = this.getInputs(id);
  const node_list:Array<Node> = inputs.map(id => (this.getNode(id)));
  //const id_list:Array<number> = node_list.map(node => (node.type === 'cxn') ? this.getConnectionInput(node.id): node.id);
  const id_list: Array<number> = node_list
      .filter(node => node.type === 'cxn')
      .map(node => this.getNode(this.getConnectionInput(node.id)))
      .filter(node => node.type === 'draft')
      .map(node => node.id)
  return id_list;
}

  /**
 * returns the ids of all nodes connected to the output node that are not connection nodes
 * @param op_id 
 */
 getNonCxnOutputs(id: number):Array<number>{
  const outputs: Array<number> = this.getOutputs(id);
  const node_list:Array<Node> = outputs.map(id => (this.getNode(id)));
  const id_list:Array<number> = node_list
    .map(node => (this.getNode(node.id)))
    .filter(node => node.type === 'cxn')
    .map(node => this.getConnectionOutput(node.id))
    return id_list;
}

  /**
 * returns the ids of all nodes connected to the output node that are not connection nodes
 * @param op_id 
 */
   getDraftOutputs(id: number):Array<number>{
    const outputs: Array<number> = this.getOutputs(id);
    const node_list:Array<Node> = outputs.map(id => (this.getNode(id)));
    const id_list:Array<number> = node_list
      .map(node => (this.getNode(node.id)))
      .filter(node => node.type === 'cxn')
      .map(node => this.getConnectionOutput(node.id))
      .filter(node => this.getType(node) === 'draft');
      return id_list;
  }
  

  getInputs(node_id: number):Array<number>{
    const tn = this.getTreeNode(node_id);
    if(tn === undefined) return [];
    const input_ids: Array<number> = tn.inputs.map(child => child.tn.node.id);
    return input_ids;
  }

  getInputsWithNdx(node_id: number):Array<IOTuple>{
    const tn = this.getTreeNode(node_id);
    if(tn === undefined) return [];
    return tn.inputs;
  }

  getInputsAtNdx(node_id: number, inlet_ndx: number):Array<IOTuple>{
    const tn = this.getTreeNode(node_id);
    if(tn === undefined) return [];
    return tn.inputs.filter(el => el.ndx == inlet_ndx);
  }

  getConnectionInput(node_id: number):number{
    const tn = this.getTreeNode(node_id);
    const input_ids: Array<number> = tn.inputs.map(child => child.tn.node.id);
    if(input_ids.length  > 1) console.log("Error: more than one input");
    return input_ids[0];
  }

  getOutputs(node_id: number):Array<number>{
    const tn = this.getTreeNode(node_id);
    if(tn === undefined) return [];
    const ids: Array<number> = tn.outputs.map(child => child.tn.node.id);
    return ids;
  }


  getConnectionOutput(node_id: number):number{
    const tn = this.getTreeNode(node_id);
    const output_ids: Array<number> = tn.outputs.map(child => child.tn.node.id);
    if(output_ids.length  > 1) console.log("Error: more than one output");
    return output_ids.pop();
  }


  /**
   * returns the ids of the total set of operations that, when performed, will chain down to the other operations
   */
  getTopLevelOps() : Array<number> {

    return this.nodes
    .filter(el => el.type === "op")
    .filter(el => this.getUpstreamOperations(el.id).length === 0)
    .map(el => el.id);
  }

  /**
   * returns a list of any drafts that have no parents
   */
  getTopLevelDrafts() : Array<number>{
    
    return this.nodes
    .filter(el => el.type === "draft")
    .map(el => this.getTreeNode(el.id))
    .filter(el => el.parent === null)
    .map(el => el.node.id);

    

  }


  

  getGenerationChildren(parents: Array<number>) : Array<number> {

    let children: Array<number> = [];
    parents.forEach(parent => {
      const tn: TreeNode =  this.getTreeNode(parent);
      children = children.concat(tn.outputs.map(io => io.tn.node.id));
    });

    return children;
  }

  /**
   * for degugging, this "prints" a list of the tree by generations
   */
  print(){
    const gens: Array<Array<number>> = this.convertTreeToGenerations();
    gens.forEach((el,ndx) =>{
      console.log("****  geneation ", ndx, "****");
      el.forEach(subel => {
        const type = this.getType(subel);
        console.log("(", subel, ',',type,')');
      });
    });

    console.log("tree: ", this.tree);


  }

  /**
   * converts the tree into an array where each element belongs to a similar "generation" meaning the first generation had no parents/inputs, and the subsequent generations are descending from that. 
   * returns a list of ids referencing the element ids belonging to each generation
   * should return an array that has the same number of elements as the tree overall
   */
  convertTreeToGenerations() : Array<Array<number>>{

    const gens: Array<Array<number>> = [];
    let parents: Array<number> = this.tree.filter(tn => tn.inputs.length == 0).map(tn => tn.node.id);

    
    while(parents.length > 0){
      gens.push(parents);
      parents = this.getGenerationChildren(parents);
    }

    return gens;
  }

  /**
   * converts all of the nodes in this tree for saving. 
   * @returns an array of objects that describe nodes
   */
  exportNodesForSaving(current_scale: number) : Array<NodeComponentProxy> {

    const objs: Array<any> = []; 

    this.nodes.forEach(node => {
      const savable: NodeComponentProxy = {
        node_id: node.id,
        type: node.type,
        bounds: (node.component !== null) ? node.component.bounds : {topleft: {x: 0, y: 0}, width: 0 ,height: 0},
        draft_id: (node.type === 'draft') ? (<DraftNode>node).draft.id : -1,
        draft_name: (node.type === 'draft') ? (<DraftNode>node).draft.ud_name : '',
        draft_visible: ((node.type === 'draft' && node.component !== null) ? (<SubdraftComponent>node.component).draft_visible : true) 
      }
      objs.push(savable);

    })

    return objs;

  }

  /**
   * this function is used when the file loader needs to create a template for an object that doesn't yet exist in the tree
   * but will be loaded into the tree.
   * @param draft : the draft that will be loaded into this node
   * @param preloaded : a list of preloaded node ids to factor in when creating this new id.  
   */
  getNewDraftProxies(draft: Draft, preloaded: Array<number>){
    const node: NodeComponentProxy = {
      node_id: this.getUniqueId(),
      draft_id: draft.id,
      draft_visible: true,
      type: "draft",
      draft_name: draft.ud_name,
      bounds: null
    };
    const treenode: TreeNodeProxy = {
      node: node.node_id,
      parent: -1, 
      inputs:[],
      outputs:[]
    };

    return {node, treenode}
  }

  setNodesClear(){
    this.nodes.forEach(node => node.dirty = false);
  }

  setDirty(id: number){
    this.getNode(id).dirty = true;

  }

  setDraftClean(id: number){
    if(id === -1){
      this.preview.dirty = false;
      return;
    } 

    const node = this.getNode(id);
    if(node === undefined){
      console.error("no node found at ", id);
      return;
    } 
    node.dirty = false;
  }

/**
 * sets a new draft and loom at node specified by id. 
 * @param id the node to update
 * @param temp the draft to add
 * @param loom  the loom to add (or null if a loom should be generated)
 */
  setDraft(id: number, temp: Draft, loom: Loom) {

    const dn = <DraftNode> this.getNode(id);

    let ud_name = temp.getName();

    if(dn.draft === null){
      dn.draft = temp;
    } 
    else{
      ud_name = dn.draft.ud_name;
      dn.draft.reload(temp);
    } 

    

    dn.draft.overloadId(id);
    if(ud_name !== '') dn.draft.overloadName(ud_name);

    if(loom === null){
      dn.loom = new Loom(temp,this.ws.type, this.ws.min_frames, this.ws.min_treadles);
      //dn.loom.recomputeLoom(temp); //this is too expensive to do synchronously
    } 
    else dn.loom = loom;
    dn.loom.draft_id = id;

    dn.dirty = true;
    if(dn.component !== null) (<SubdraftComponent> dn.component).draft = temp;


  }


  /**
   * sets a new draft
   * @param temp the draft to set this component to
   */
  setDraftPattern(id: number, pattern: Array<Array<Cell>>) {

    const dn = <DraftNode> this.getNode(id);
    dn.draft.pattern = cloneDeep(pattern);
    (<SubdraftComponent> dn.component).draft = dn.draft;
    dn.dirty = true;    
  }


       /**
 * exports ALL drafts associated with this tree
 * @returns an array of Drafts
 */
        // exportDraftsForSaving() : Array<Draft> {

        //   const drafts: Array<SubdraftComponent> = this.getDrafts();
        //   const out: Array<Draft> = drafts.map(c => c.draft);
        //   return out;
        // }



  getOpNode(id: number) : OpNode{
    return <OpNode> this.getNode(id);
  }

  /**
   * exports all operation nodes with information that can be reloaded
   * @returns 
   */
  exportOpMetaForSaving() : Array<OpComponentProxy> {
    const objs: Array<any> = []; 

    this.getOpNodes().forEach(op_node => {

      const savable:OpComponentProxy = {
        node_id: op_node.id,
        name: op_node.name,
        params: op_node.params,
        inlets: op_node.inlets
      }

      
      objs.push(savable);
    })

    return objs;

  }


  exportTreeForSaving() : Array<TreeNodeProxy> {

    const objs: Array<any> = []; 


    this.tree.forEach(treenode => {

      const savable:TreeNodeProxy = {
        node: treenode.node.id,
        parent: (treenode.parent !== null && treenode.parent !== undefined) ?  treenode.parent.node.id : -1,
        inputs: treenode.inputs.map(el => {return {tn:el.tn.node.id, ndx: el.ndx}}),
        outputs: treenode.outputs.map(el => {return {tn:el.tn.node.id, ndx: el.ndx}})
      }
      objs.push(savable);
    })

    return objs;

  }

   /**
 * exports only the drafts that have not been generated by other values
 * @returns an array of objects that describe nodes
 */
  // exportSeedDraftsForSaving() : Array<DraftNode> {

  //     const objs: Array<any> = []; 
  //     const gens: Array<Array<number>> = this.convertTreeToGenerations(); 
  
  //     if(gens.length == 0) return objs;
  
  //     const seeds: Array<number> = gens.shift();
  
  //     return seeds.map(seed => this.getDraftNode(seed));
  
  
  //   }
  
     /**
   * exports TopLevel drafts associated with this tree
   * @returns an array of Drafts
   */
    exportDraftsForSaving() : Array<Draft> {
  
      //make sure the name values are not undefined
      this.getDraftNodes().forEach(node => {
        if(node.draft.ud_name === undefined) node.draft.ud_name = '';
      });

      return this.getDraftNodes()
      .filter(el => this.getSubdraftParent(el.id) === -1)
      .map(el => el.draft);
  
    }

         /**
   * exports TopLevel looms associated with this tree
   * @returns an array of Drafts
   */
    exportLoomsForSaving() : Array<Loom> {

      return this.getDraftNodes()
      .filter(el => this.getSubdraftParent(el.id) === -1)
      .map(el => el.loom);
  
    }


 
}
