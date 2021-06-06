import { P } from '@angular/cdk/keycodes';
import { Injectable } from '@angular/core';
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
  view_id: number,
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


  /**
   * create an node and add it to the tree (without relationships)
   * @param id a unique id for this component, ideally created by the viewCompomentRef 
   * @param type the type of component
   * @param component the compoenent instance
   * @returns the id assigned
   */
  createNode(type: 'draft'|'op'|'cxn', component: SubdraftComponent | OperationComponent | ConnectionComponent, view_id: number):number{

    const node: Node = {
      type: type,
      view_id: view_id,
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

  getNodeIndex(id:number):number{
    return this.nodes.findIndex(el => (el.id == id));
  }

  getViewId(id:number):number{
    const node: Node = this.getNode(id);
    return node.view_id;
  }

/**
 * this removes a node from the list and tree
 * @param id the id of the node to be removed
 * @returns a list of ids of connections that should also be deleted.
 */
  removeNode(id: number): Array<number>{
    const node: Node = this.getNode(id);
    const view_ndx: number = this.getViewId(id);
    let unusued: Array<number> = [];
    //decrement the view ids
    this.nodes.forEach(node => {
      if(node.view_id > view_ndx) node.view_id--;
    });

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

    return unusued;

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
   * remove the connection with this id
   * @param cxn_id 
   */
  private removeNodeTreeAssociations(id:number){
    const tn:TreeNode = this.getTreeNode(id);

    tn.inputs.forEach(el => {
      const cxn_ndx_output:number = tn.outputs.findIndex(el => (el.node.id == id)); 
      el.outputs.splice(cxn_ndx_output, 1);
    });

    tn.outputs.forEach(el => {
      const cxn_ndx_input:number = tn.inputs.findIndex(el => (el.node.id == id)); 
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
 * returns the ids of all nodes connected to the input node that are not connection nodes
 * @param op_id 
 */
 getNonCxnInputs(id: number):Array<number>{
    console.log("get non cxn inputs called on id", id);
    const inputs: Array<number> = this.getInputs(id);
    const node_list:Array<Node> = inputs.map(id => (this.getNode(id)));
    const id_list:Array<number> = node_list.map(node => (node.type === 'cxn') ? this.getConnectionInput(node.id): node.id);
    console.log("id_list is ", id_list);
    return id_list;
  }

  getInputs(node_id: number):Array<number>{
    const tn = this.getTreeNode(node_id);
    const input_ids: Array<number> = tn.inputs.map(child => child.node.id);
    return input_ids;
  }

  getConnectionInput(node_id: number):number{
    console.log("getting cconnection for ", node_id)
    const tn = this.getTreeNode(node_id);
    const input_ids: Array<number> = tn.inputs.map(child => child.node.id);
    if(input_ids.length  > 1) console.log("Error: more than one input");
    console.log("input ids", input_ids, "returning", input_ids[0]);
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


 
}
