/**
 * Definition of System object.
* a system describes a structural relationship between rows and wefts. Used in overshot, mutipic structures, or adding conductive rows
 * @class
 */
export class System {
  id: number;
  name: string;
  notes: string;
  visible: boolean;

  constructor(systemDict = null) {

    //defaults
    this.id = -1;
    this.name = "weft system"
    this.notes = "";
    this.visible = true;

    if (systemDict) this.updateVariables(systemDict);
  }

  updateVariables({id, name, notes, visible}) {
    this.id = id;
    this.name = name;
    this.notes = notes;
    this.visible = visible;
  }

  setID(id: number) {
    this.id = id;
    if (!this.name) {
      this.name = 'System ' + (id + 1);
    }
  }

  isVisible(){
    return this.visible;
  }

  setVisible(bool: boolean) {
    this.visible = bool;
  }

  getChar(){
    return String.fromCharCode(97 + this.id)
  }


}