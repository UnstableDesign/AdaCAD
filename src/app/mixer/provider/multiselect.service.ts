import { Injectable } from '@angular/core';
import { Node, Point, TreeNode } from '../../core/model/datatypes';
import { TreeService } from '../../core/provider/tree.service';

@Injectable({
  providedIn: 'root'
})
export class MultiselectService {

  selected: Array<{id: number, topleft: Point}> = [];
  relative_position: Point = {x: 0, y: 0}; 


  constructor(private tree: TreeService) { 

  }

  updateSelectedStyles(comp_id: number){
  
  }

  setRelativePosition(point: Point){
    this.relative_position = point;
  }

  getRelativePosition(): Point{
    return {x: this.relative_position.x, y: this.relative_position.y};
  }

  setPosition(id: number, tl: Point){
    const el = this.selected.find(el => el.id === id);
    if(el !== undefined){
      el.topleft = {x: tl.x, y: tl.y};
    }
  }

  /**
   * toggle selection will add a selected element, and if its an op, all the child subdrafts, to the selected list
   * @param id the id of the element you are toggling
   * @param topleft the topleft point of this element, used to update position if one selected element moves
   */
  toggleSelection(id: number, topleft: Point) : boolean{

    console.log("TOGGLING SELECTION ON ", id)
    const type = this.tree.getType(id);
    let container: HTMLElement;

    if(this.selected.find(el => el.id == id) !== undefined){
       
      this.selected = this.selected.filter(el => el.id != id);
       
      container = <HTMLElement> document.getElementById("scale-"+id);
      container.classList.remove('multiselected');

      //remove the children as well 
      if(type === 'op'){
        const cxn_outs = this.tree.getOutputs(id);
        cxn_outs.forEach(o => {
        this.selected = this.selected.filter(el => el.id != o);
         const child = this.tree.getConnectionOutput(o);
         container = <HTMLElement> document.getElementById("scale-"+child);
         if(container !== null) container.classList.remove('multiselected');
         this.selected = this.selected.filter(el => el.id != child);
      } );
     }

      return false;
    }else{

      this.selected.push({id, topleft});
      container = <HTMLElement> document.getElementById("scale-"+id);
      container.classList.add('multiselected');
        //remove the children as well 
        if(type == 'op'){
          const cxn_outs = this.tree.getOutputs(id);
          cxn_outs.forEach(o => {
          let tl = this.tree.getComponent(o).topleft;
          this.selected.push({id: o, topleft: tl });
          const child = this.tree.getConnectionOutput(o);
          tl = this.tree.getComponent(child).topleft;
          this.selected.push({id: child, topleft: tl });
          container = <HTMLElement> document.getElementById("scale-"+child);
          if(container !== null)  container.classList.add('multiselected');
          } );
        }
      return true;
    }
  }

  clearAllStyles(){
    this.selected.forEach(sel => {
      const container = <HTMLElement> document.getElementById("scale-"+sel.id);
      if(container !== null)container.classList.remove('multiselected');
    })
  }



  clearSelections(){
    //clear all styles
    this.clearAllStyles();
    this.selected = [];
  }

  isSelected(id: number):boolean {
    const f = this.selected.find(el => el.id == id);
    if(f === undefined) return false;
    else return true;
  }

  getSelections() : Array<number> {
    return this.selected.map(el => el.id);
  }

  getNewPosition(id: number, diff: Point){
    const f = this.selected.find(el => el.id == id);
    return {x: f.topleft.x + diff.x, y: f.topleft.y + diff.y}
  }

  /**
   * creates a copy of each of the elements (and their positions, for pasting into this file or another file)
   * @returns 
   */
  copySelections() : {all_nodes: Array<Node>, treenodes: Array<TreeNode>} {

    let selected_nodes:Array<Node> = this.selected
    .map(el => this.tree.getNode(el.id))
    .filter(el => el.type !== 'cxn')
    .filter(el => !(el.type == 'draft' && this.tree.hasParent(el.id)));
   
    let node_mirror:Array<Node> =selected_nodes.slice();


    let relevant_connection_ids = [];
    let relevant_connection_nodes = [];

    selected_nodes.forEach(node => {

      node_mirror = node_mirror.filter( el => el.id !== node.id);

      node_mirror.forEach(mirror => {
        let cxn = this.tree.getConnection(node.id, mirror.id);
        if(cxn !== -1 && relevant_connection_ids.find(el => el == cxn) === undefined) relevant_connection_ids.push(cxn);
      });

    });

    relevant_connection_nodes = relevant_connection_ids.map(el => this.tree.getNode(el));
    let all_nodes = selected_nodes.concat(relevant_connection_nodes);
    let treenodes = all_nodes.map(el => this.tree.getTreeNode(el.id));

    return {all_nodes, treenodes};

  }



}
