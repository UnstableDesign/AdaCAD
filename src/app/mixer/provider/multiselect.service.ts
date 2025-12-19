import { Injectable, inject } from '@angular/core';
import { MixerStateMove, Node, Point, SaveObj } from '../../core/model/datatypes';
import { FileService } from '../../core/provider/file.service';
import { StateService } from '../../core/provider/state.service';
import { TreeService } from '../../core/provider/tree.service';
import { ZoomService } from '../../core/provider/zoom.service';

@Injectable({
  providedIn: 'root'
})
export class MultiselectService {
  private tree = inject(TreeService);
  private fs = inject(FileService);
  private zs = inject(ZoomService);
  private ss = inject(StateService);

  selected: Array<{ id: number, topleft: Point }> = [];
  relative_position: Point = { x: 0, y: 0 };
  relative_position_before: Point = { x: 0, y: 0 };
  copy: SaveObj;
  moving_id: number = -1;



  private selected_before: Array<{ id: number, topleft: Point }> = [];

  /**
   * when drag starts, we need to store a copy of the current state so we can undo it later
   */
  dragStart(id: number) {

    this.moving_id = id;
    this.selected_before = [];
    this.selected.forEach(el => {
      this.selected_before.push({ id: el.id, topleft: { x: el.topleft.x, y: el.topleft.y } });
    });
    this.relative_position_before = { x: this.relative_position.x, y: this.relative_position.y };
  }

  /**
   * when drag ends, we need to apply the changes to the state
   */
  dragEnd() {
    const change: MixerStateMove = {
      originator: 'MIXER',
      type: 'MOVE',
      moving_id: this.moving_id,
      relative_position_before: this.relative_position_before,
      relative_position_after: this.relative_position,
      selected_before: this.selected_before,
      selected_after: this.selected
    }
    this.ss.addStateChange(change);
    this.moving_id = -1;
    this.selected_before = [];
    this.relative_position = { x: 0, y: 0 };
  }

  updateSelectedStyles(comp_id: number) {

  }

  setRelativePosition(point: Point) {
    this.relative_position = point;
  }

  getRelativePosition(): Point {
    return { x: this.relative_position.x, y: this.relative_position.y };
  }

  setPosition(id: number, tl: Point) {
    const el = this.selected.find(el => el.id === id);
    if (el !== undefined) {
      el.topleft = { x: tl.x, y: tl.y };
    }
  }

  /**
   * toggle selection will add a selected element, and if its an op, all the child subdrafts, to the selected list
   * @param id the id of the element you are toggling
   * @param topleft the topleft point of this element, used to update position if one selected element moves
   */
  toggleSelection(id: number, topleft: Point): boolean {

    const type = this.tree.getType(id);
    let container: HTMLElement;

    if (this.selected.find(el => el.id == id) !== undefined) {

      this.selected = this.selected.filter(el => el.id != id);

      container = <HTMLElement>document.getElementById("scale-" + id);
      container.classList.remove('multiselected');

      //remove the children as well 
      if (type === 'op') {
        const cxn_outs = this.tree.getOutputs(id);
        cxn_outs.forEach(o => {
          this.selected = this.selected.filter(el => el.id != o);
          const child = this.tree.getConnectionOutput(o);
          container = <HTMLElement>document.getElementById("scale-" + child);
          if (container !== null) container.classList.remove('multiselected');
          this.selected = this.selected.filter(el => el.id != child);
        });
      }

      return false;
    } else {

      this.selected.push({ id, topleft });
      container = <HTMLElement>document.getElementById("scale-" + id);
      if (container !== null) container.classList.add('multiselected');
      //remove the children as well 
      if (type == 'op') {
        // const cxn_outs = this.tree.getOutputs(id);
        // cxn_outs.forEach(o => {
        // let tl = this.tree.getComponent(o).topleft;
        // this.selected.push({id: o, topleft: tl });
        // const child = this.tree.getConnectionOutput(o);
        // tl = this.tree.getComponent(child).topleft;
        // this.selected.push({id: child, topleft: tl });
        // container = <HTMLElement> document.getElementById("scale-"+child);
        // if(container !== null)  container.classList.add('multiselected');
        // } );
      } else if (type == 'draft') {
        const parent = this.tree.getSubdraftParent(id);
        if (parent !== -1) {
          let tl = this.tree.getComponent(parent).topleft;
          this.selected.push({ id: parent, topleft: tl });
          container = <HTMLElement>document.getElementById("scale-" + parent);
          if (container !== null) container.classList.add('multiselected');

        }
      }
      return true;
    }
  }

  clearAllStyles() {
    this.selected.forEach(sel => {
      const container = <HTMLElement>document.getElementById("scale-" + sel.id);
      if (container !== null) container.classList.remove('multiselected');
    })
  }



  clearSelections() {
    console.log("CLEAR SELECTIONS: multiselect.service.ts - clearing", this.selected.length, "selections");
    //clear all styles
    this.clearAllStyles();
    this.selected = [];
    this.copy = null;
  }

  isSelected(id: number): boolean {
    const f = this.selected.find(el => el.id == id);
    if (f === undefined) return false;
    else return true;
  }

  getSelections(): Array<number> {
    return this.selected.map(el => el.id);
  }

  getNewPosition(id: number, diff: Point) {
    const f = this.selected.find(el => el.id == id);
    return { x: f.topleft.x + diff.x, y: f.topleft.y + diff.y }
  }


  /**
   * creates a copy of each of the elements (and their positions, for pasting into this file or another file)
   * @returns 
   */
  copySelections(): Promise<SaveObj> {

    let selected_nodes: Array<Node> = this.selected
      .map(el => this.tree.getNode(el.id))
      .filter(el => el.type !== 'cxn') //filter out connections because we will add these in later

    let node_mirror: Array<Node> = selected_nodes.slice();

    let relevant_connection_ids = [];
    let relevant_connection_nodes = [];

    selected_nodes.forEach(node => {

      node_mirror = node_mirror.filter(el => el.id !== node.id);

      node_mirror.forEach(mirror => {
        let cxns = this.tree.getConnectionsBetween(node.id, mirror.id);

        cxns.forEach(cxn => {
          if (cxn !== -1 && relevant_connection_ids.find(el => el == cxn) === undefined) relevant_connection_ids.push(cxn)
        })
      });

    });

    relevant_connection_nodes = relevant_connection_ids.map(el => this.tree.getNode(el));
    let all_nodes = selected_nodes.concat(relevant_connection_nodes);


    return this.fs.saver.copy(all_nodes.map(el => el.id))
      .then(ada => {
        this.copy = ada;
        return Promise.resolve(ada);
      });



  }






}
