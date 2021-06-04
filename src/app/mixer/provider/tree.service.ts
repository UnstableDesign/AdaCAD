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

  //permanently removes this from the structure
  //and decrements the view indexes 
  removeNode(id: number){
    const view_ndx: number = this.getViewId(id);
    const ndx: number = this.getNodeIndex(id);
    this.nodes.splice(ndx, 1);

    this.nodes.forEach(node => {
      if(node.view_id > view_ndx) node.view_id--;
    });

    //TO DO - remove it from the tree
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

  addNode(type: string){

  }

  getTreeNode(id:number): TreeNode{
    //only searches top level - though all should be in one level
    return this.tree.find(el => el.node.id == id);
  }

  /**
   * adds a connection to the tree
   * @param from the id 
   * @param to the id 
   * @returns an array of all the direct children of this node
   */
  addConnection(from:number, to:number): Array<number>{
    
  
    //add validation step here to make sure we don't end up in a loop
    const from_tn: TreeNode = this.getTreeNode(from);
    const to_tn: TreeNode = this.getTreeNode(to);
   
    to_tn.inputs.push(from_tn);
    from_tn.outputs.push(to_tn);

    const input_ids: Array<number> = to_tn.inputs.map(child => child.node.id);
    return input_ids;

  }

  setParent(node_id: number, parent_id: number){
    const tn = this.getTreeNode(node_id);
    tn.parent = this.getTreeNode(parent_id);
  }


 
}
