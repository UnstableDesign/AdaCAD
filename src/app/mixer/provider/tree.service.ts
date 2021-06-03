import { Injectable } from '@angular/core';
import { ConnectionComponent } from '../palette/connection/connection.component';
import { OperationComponent } from '../palette/operation/operation.component';
import { SubdraftComponent } from '../palette/subdraft/subdraft.component';
/**
 * this class registers the relationships between subdrafts, operations, and connections
 */

interface Node{
  type: 'draft' | 'op' | 'cxn';
  view_id: number,
  id: number, //this will be unique for every instance
  component: SubdraftComponent | OperationComponent | ConnectionComponent,
  active: boolean
}

interface TreeNode{
  node: Node,
  children: Array<number>
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
   * each time a new component is made, it is registered here 
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
      children: []
    })

    console.log("creating node at id", node.id);
    return node.id;
  }

  getComponent(id:number): SubdraftComponent | ConnectionComponent | OperationComponent{
    const node: Node = this.getNode(id);
    return node.component; 
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

 
}
