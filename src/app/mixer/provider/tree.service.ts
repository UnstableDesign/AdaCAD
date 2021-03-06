import { Injectable, ViewChild, ViewChildren, ViewRef } from '@angular/core';
import { element } from 'protractor';
import { Draft } from '../../core/model/draft';
import { NodeComponentProxy, OpComponentProxy, TreeNodeProxy } from '../../core/provider/file.service';
import { ConnectionComponent } from '../palette/connection/connection.component';
import { OperationComponent } from '../palette/operation/operation.component';
import { SubdraftComponent } from '../palette/subdraft/subdraft.component';
/**
 * this class registers the relationships between subdrafts, operations, and connections
 */

/**
 * this stores a reference to a component on the palette with its id and some
 * @param type is the type of component'
 * @param view_id is ndx to reference to this object in the ViewComponentRef (for deleting)
 * @param id is a unique id linked forever to this component 
 * @param component is a reference to the component object
 * @param active describes if is on the screen or hidden. 
 */
interface Node{
  type: 'draft' | 'op' | 'cxn';
  ref: ViewRef,
  id: number, //this will be unique for every instance
  component: SubdraftComponent | OperationComponent | ConnectionComponent,
  active: boolean
}

/**
 * A tree node stores relationships between the components created by operations
  * @param node: is a reference to the node object stored in the tree. 
  * @param parent links to the treenode that "created" this node or null if it was created by the user 
  * @param inputs a list of TreeNodes that are used as input to this TreeNode.
  * @param outputs a list of TreeNodes created by this node or specified by the user
  * Rules: 
  *   Operations can have many inputs and many outputs 
  *   Subdrafts can only have one input and one output (for now)
  *   
*/

interface TreeNode{
  node: Node,
  parent: TreeNode,
  inputs: Array<TreeNode>,
  outputs: Array<TreeNode>
}

@Injectable({
  providedIn: 'root'
})
export class TreeService {

  nodes: Array<Node> = []; //an unordered list of all the nodes
  tree: Array<TreeNode> = []; //a representation of the node relationships
  num_created: number = 0;

  constructor() { 
  }

  /**called from the file loader before a compoment has been initalized */
  loadNode(type: 'draft'|'op'|'cxn', id: number, active:boolean): number{
    const node: Node = {
      type: type,
      ref: null,
      id: id,
      component: null,
      active: active
    }

    this.nodes.push(node);

      this.tree.push({
        node: node,
        parent: null,
        outputs: [],
        inputs: []
      });

    this.num_created++;

    

    return node.id;
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
    this.num_created = 0;
  }


  /**called from the file loader before a compoment has been initalized */
  /** depends on having nodes created first so that all tree nodes are present */
  loadTreeNodeData(node_id: number, parent_id: number, inputs:Array<number>, outputs:Array<number>){
    const tn: TreeNode = this.getTreeNode(node_id);
    tn.parent = (parent_id === -1) ? null : this.getTreeNode(parent_id);
    tn.inputs = inputs.map(id => this.getTreeNode(id));
    tn.outputs = outputs.map(id => this.getTreeNode(id));
  }



  /**
   * create an node and add it to the tree (without relationships)
   * @param id a unique id for this component, ideally created by the viewCompomentRef 
   * @param type the type of component
   * @param component the compoenent instance
   * @returns the id assigned
   */
  createNode(type: 'draft'|'op'|'cxn', component: SubdraftComponent | OperationComponent | ConnectionComponent, ref: ViewRef):number{

    const node: Node = {
      type: type,
      ref: ref,
      id: this.num_created++,
      component: component,
      active: true
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
    if(tn.parent !== null) return tn.parent.node.id;
    else return -1;
  }

  /**
   * return the connection objects that are immediately attached to this object
   * @param id - the node id
   * @returns an array of id's for the immediatly connected connections
   */
  getNodeConnections(id: number):Array<number>{
    const tn: TreeNode = this.getTreeNode(id);
    const out_node: Array<Node> = tn.outputs.map(el => el.node);
    const out_cxn: Array<Node> = out_node.filter(el => el.type === 'cxn');
    const in_node: Array<Node> = tn.inputs.map(el => el.node);
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
   * test if this node has generated many children, as opposed to just one
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
        if(el.node.type == 'op'){
          ops.push(el.node.id);  
        }
        ops = ops.concat(this.getDownstreamOperations(el.node.id));
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
          if(el.node.type == 'op'){
            ops.push(el.node.id);  
          }
          ops = ops.concat(this.getUpstreamOperations(el.node.id));
        });
      }
      return ops;
    }

/**
 * this removes a node from the list and tree
 * @param id the id of the node to be removed
 */
  removeNode(id: number){
    console.log("removing node ", id);

    const node: Node = this.getNode(id);

    let unusued: Array<number> = [];


    this.removeNodeTreeAssociations(node.id);

    switch(node.type){
      case 'draft':
      case 'op':
       unusued = this.getUnusuedConnections();
      break;
    }

    //remove all connections connecting to and from this node
    const ndx: number = this.getNodeIndex(id);
    const i: number = this.tree.findIndex(el => (el.node.id == id));
    this.tree.splice(i, 1);
    this.nodes.splice(ndx, 1);

  }

  getDrafts():Array<SubdraftComponent>{
    const draft_nodes: Array<Node> = this.nodes.filter(el => el.type == 'draft');
    const draft_comps: Array<SubdraftComponent> = draft_nodes.map(el => <SubdraftComponent>el.component);
    return draft_comps;
  }

  getConnections():Array<ConnectionComponent>{
    const draft_nodes: Array<Node> = this.nodes.filter(el => el.type == 'cxn');
    const draft_comps: Array<ConnectionComponent> = draft_nodes.map(el => <ConnectionComponent>el.component);
    return draft_comps;
  }

  getOperations():Array<OperationComponent>{
    const draft_nodes: Array<Node> = this.nodes.filter(el => el.type == 'op');
    const draft_comps: Array<OperationComponent> = draft_nodes.map(el => <OperationComponent>el.component);
    return draft_comps;
  }

  /**
   * scans the connections and marks any missing a to or from to delete
   * @returns an array of connections to delete
   */

  getUnusuedConnections():Array<number>{
    const comps: Array<ConnectionComponent> = this.getConnections();
    const nodes: Array<TreeNode> = comps.map(el => this.getTreeNode(el.id));
    const to_delete: Array<TreeNode> = nodes.filter(el => (el.inputs.length == 0 || el.outputs.length == 0));
    return to_delete.map(el => el.node.id);
  }

  addNode(type: string){

  }

  getTreeNode(id:number): TreeNode{
    //only searches top level - though all should be in one level
    return this.tree.find(el => el.node.id == id);
  }

  /**
   * adds a connection from subddraft to operation. connections can be of the type 
   * subdraft -> op (input to op)
   * op -> subdraft (output generatedd by op)
   * @returns an array of the ids of the elements connected to this op
   * @todo add validation step here to make sure we don't end up in a loop

   */
  addConnection(from:number, to:number, cxn:number): Array<number>{
    
    let from_tn: TreeNode = this.getTreeNode(from);
    let to_tn: TreeNode = this.getTreeNode(to);;
    const cxn_tn: TreeNode = this.getTreeNode(cxn);

    from_tn.outputs.push(cxn_tn);
    cxn_tn.inputs.push(from_tn);
    cxn_tn.outputs.push(to_tn);
    to_tn.inputs.push(cxn_tn);

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
   * updates inputs and outputs of this node and delete this node from the list
   * @param cxn_id 
   */
  private removeNodeTreeAssociations(id:number){
    const tn:TreeNode = this.getTreeNode(id);

    //travel to all the trreenode's inputs, and erase this from their output
    tn.inputs.forEach(el => {
      const cxn_ndx_output:number = el.outputs.findIndex(out => (out.node.id == id)); 
      el.outputs.splice(cxn_ndx_output, 1);
    });

    tn.outputs.forEach(el => {
      const cxn_ndx_input:number = el.inputs.findIndex(i => (i.node.id == id)); 
      el.inputs.splice(cxn_ndx_input, 1);
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

    const cxn_node = sd_node.outputs[0].node;
    return <ConnectionComponent> cxn_node.component;

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
    const node_list:Array<Node> = inputs.map(id => (this.getNode(id)));
    const id_list:Array<number> = node_list.map(node => (node.type === 'cxn') ? this.getConnectionInput(node.id): node.id);
    return id_list;
  }

  /**
 * returns the ids of all nodes connected to the output node that are not connection nodes
 * @param op_id 
 */
 getNonCxnOutputs(id: number):Array<number>{
  const outputs: Array<number> = this.getOutputs(id);
  const node_list:Array<Node> = outputs.map(id => (this.getNode(id)));
  const id_list:Array<number> = node_list.map(node => (node.type === 'cxn') ? this.getConnectionOutput(node.id): node.id);
  return id_list;
}

  getInputs(node_id: number):Array<number>{
    const tn = this.getTreeNode(node_id);
    const input_ids: Array<number> = tn.inputs.map(child => child.node.id);
    return input_ids;
  }

  getConnectionInput(node_id: number):number{
    const tn = this.getTreeNode(node_id);
    const input_ids: Array<number> = tn.inputs.map(child => child.node.id);
    if(input_ids.length  > 1) console.log("Error: more than one input");
    return input_ids[0];
  }

  getOutputs(node_id: number):Array<number>{
    const tn = this.getTreeNode(node_id);
    const ids: Array<number> = tn.outputs.map(child => child.node.id);
    return ids;
  }


  getConnectionOutput(node_id: number):number{
    const tn = this.getTreeNode(node_id);
    const output_ids: Array<number> = tn.outputs.map(child => child.node.id);
    if(output_ids.length  > 1) console.log("Error: more than one output");
    return output_ids.pop();
  }


  

  getGenerationChildren(parents: Array<number>) : Array<number> {

    let children: Array<number> = [];
    parents.forEach(parent => {
      const tn: TreeNode =  this.getTreeNode(parent);
      children = children.concat(tn.outputs.map(tn => tn.node.id));
    });

    return children;
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
  exportNodesForSaving() : Array<NodeComponentProxy> {

    const objs: Array<any> = []; 

    this.nodes.forEach(node => {

      const savable: NodeComponentProxy = {
        active: node.active,
        node_id: node.id,
        type: node.type,
        bounds: node.component.bounds,
        draft_id: ((node.type === 'draft') ? (<SubdraftComponent>node.component).draft.id : -1) 
      }
      objs.push(savable);
    })

    return objs;

  }

  /**
 * exports only the drafts that have not been generated by other values
 * @returns an array of objects that describe nodes
 */
  exportSeedDraftsForSaving() : Array<any> {

    const objs: Array<any> = []; 
    const gens: Array<Array<number>> = this.convertTreeToGenerations(); 

    if(gens.length == 0) return objs;

    const seeds: Array<number> = gens.shift();


    seeds.forEach(id => {

      const savable = {
        id: id,
        draft: (<SubdraftComponent>this.getComponent(id)).draft
      }
      objs.push(savable);
    })

    return objs;

  }

   /**
 * exports ALL drafts associated with this tree
 * @returns an array of Drafts
 */
    exportDraftsForSaving() : Array<Draft> {

      const drafts: Array<SubdraftComponent> = this.getDrafts();
      const out: Array<Draft> = drafts.map(c => c.draft);
      return out;
    }

  /**
   * exports all operation nodes with information that can be reloaded
   * @returns 
   */
  exportOpMetaForSaving() : Array<OpComponentProxy> {

    const objs: Array<any> = []; 

    this.getOperations().forEach(op_node => {

      const savable:OpComponentProxy = {
        node_id: op_node.id,
        name: op_node.op.name,
        params: op_node.op_inputs.map(el => el.value)
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
        parent: (treenode.parent !== null) ?  treenode.parent.node.id : -1,
        inputs: treenode.inputs.map(el => el.node.id),
        outputs: treenode.outputs.map(el => el.node.id)
      }
      objs.push(savable);
    })

    return objs;

  }



 
}
