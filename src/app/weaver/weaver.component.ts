import { Component, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';

import { PatternService } from '../core/provider/pattern.service';
import { WeaveDirective } from '../core/directives/weave.directive';
import { Draft } from '../core/model/draft';
import { Shuttle } from '../core/model/shuttle';
import { Pattern } from '../core/model/pattern';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ConnectionModal } from './modal/connection/connection.modal';
import { InitModal } from './modal/init/init.modal';
import { LabelModal } from './modal/label/label.modal';
import {RedoAction, UndoAction} from '../history/actions';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {getRedoAction, getUndoAction} from '../history/selectors';
import {AppState} from '../ngrx/app.state';
import {select, Store} from '@ngrx/store';
/**
 * Controller of the Weaver component.
 * @class
 */
@Component({
  selector: 'app-weaver',
  templateUrl: './weaver.component.html',
  styleUrls: ['./weaver.component.scss']
})
export class WeaverComponent implements OnInit {
  /**
   * The reference to the weave directive.
   * @property {WeaveDirective}
   */
  @ViewChild(WeaveDirective, {static: false}) weaveRef;
  @ViewChild('bitmapImage', {static: false}) bitmap;

  /**
   * The name of the current selected brush.
   * @property {string}
   */
  brush = 'point';
  
  /**
   * The weave Draft object.
   * @property {Draft}
   */
  draft: Draft;

  /**
   * The list of all patterns saved. Provided by pattern service.
   * @property {Array<Pattern>}
   */
  //patterns;

  /**
   * The name of the current view being shown.
   * @property {string}
   */
  view: string = 'pattern';

  selected;

  private unsubscribe$ = new Subject();
  private undoItem;
  private redoItem;

  /// ANGULAR FUNCTIONS
  /**
   * @constructor
   * ps - pattern service (variable name is initials). Subscribes to the patterns and used
   * to get and update stitches.
   * history - undo history service, used to control the state of the woven pattern
   * dialog - Anglar Material dialog module. Used to control the popup modals.
   */
  constructor(private ps: PatternService, private dialog: MatDialog, 
              private store: Store<AppState>) {
    
    const dialogRef = this.dialog.open(InitModal);

    dialogRef.afterClosed().subscribe(result => {


      if (result) {
        this.draft = new Draft(result);
        if (result.type != "update"){
            this.draft.shuttles[0].setColor('#3d3d3d');

            //only retreives default patterns when its not a .ada upload
            this.ps.getPatterns().subscribe((res) => {
               for(var i in res.body){
                  this.draft.patterns.push(res.body[i])
               }
            });

        } 
      } 
       else if (result.type === "update") {
         this.draft = result.draft;
         this.weaveRef.redraw();
       }

       console.log("on init closed ", this.draft)

    });

  }





  ngOnInit() {
    this.store.pipe(select(getUndoAction), takeUntil(this.unsubscribe$)).subscribe(undoItem => {
      this.undoItem = undoItem;
      console.log(undoItem);
    });
    this.store.pipe(select(getRedoAction), takeUntil(this.unsubscribe$)).subscribe(redoItem => {
      this.redoItem = redoItem;
      console.log(redoItem);
    });
    
    
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  undo() {
    this.store.dispatch(new UndoAction());
    this.weaveRef.onUndoRedo();
  }

  redo() {
    this.store.dispatch(new RedoAction());
    this.weaveRef.onUndoRedo();
  }

  /// EVENTS
  /**
   * Sets brush to erase on key control + e.
   * @extends WeaveComponent
   * @param {Event} e - Press Control + e
   * @returns {void}
   */
  @HostListener('window:keydown.Control.e', ['$event'])
  private keyEventErase(e) {
    this.brush = 'erase';
  }

  /**
   * Sets brush to point on key control + d.
   * @extends WeaveComponent
   * @param {Event} e - Press Control + d
   * @returns {void}
   */
  @HostListener('window:keydown.Control.d', ['$event'])
  private keyEventPoint(e) {
    this.brush = 'point';
  }

  /**
   * Sets brush to select on key control + s
   * @extends WeaveComponent
   * @param {Event} e - Press Control + s
   * @returns {void}
   */
  @HostListener('window:keydown.Control.s', ['$event'])
  private keyEventSelect(e) {
    this.brush = 'select';
  }

  /**
   * Sets key control to invert on control + x
   * @extends WeaveComponent
   * @param {Event} e - Press Control + x
   * @returns {void}
   */
  @HostListener('window:keydown.Control.x', ['$event'])
  private keyEventInvert(e) {
    this.brush = 'invert';
  }

  /**
   * Updates the canvas based on the weave view.
   * @extends WeaveComponent
   * @param {Event} e - view change event from design component.
   * @returns {void}
   */
  public onViewChange(e: any) {
    this.view = e.view;

    switch (e.view) {
      case 'visual':
        this.weaveRef.simulate();
        break;
      case 'yarn':
        this.weaveRef.functional();
        break;
      default:
        this.weaveRef.updateSize();
        break;
    }
  }

  /**
   * Change the name of the brush to reflect selected brush.
   * @extends WeaveComponent
   * @param {Event} e - brush change event from design component.
   * @returns {void}
   */
  public onBrushChange(e:any) {
    this.brush = e.name;
  }

  /**
   * Tell the weave directive to fill selection with pattern.
   * @extends WeaveComponent
   * @param {Event} e - fill event from design component.
   * @returns {void}
   */
  public onFill(e) {
    var p = this.draft.patterns[e.id].pattern;
    console.log("fill", p)
    this.weaveRef.fillArea(this.weaveRef.selection, p, 'original');
  }

  /**
   * Tell weave reference to clear selection.
   * @extends WeaveComponent
   * @param {Event} e - clear event from design component.
   * @returns {void}
   */
  public onClear() {
    this.weaveRef.fillArea(this.weaveRef.selection, [[null]], 'original')
  }

  /**
   * Weave reference masks pattern over selected area.
   * @extends WeaveComponent
   * @param {Event} e - mask event from design component.
   * @returns {void}
   */
  public onMask(e) {
    console.log(e);
    var p = this.draft.patterns[e.id].pattern;
    this.weaveRef.fillArea(this.weaveRef.selection, p, 'mask');
  }

  /**
   * Tells weave reference to paste copied pattern.
   * @extends WeaveComponent
   * @param {Event} e - paste event from design component.
   * @returns {void}
   */
  public onPaste(e) {
    var p = this.weaveRef.copy;
    var type = e.type;
    this.weaveRef.fillArea(this.weaveRef.selection, p, type);
  }

  /**
   * Creates the copied pattern within the weave reference
   * @extends WeaveComponent
   * @param {Event} e - copy event from design component.
   * @returns {void}
   */
  public onCopy() {
    this.weaveRef.copyArea();
  }

  /**
   *
   *
   */
  public onSave(e: any) {

    e.bitmap = this.bitmap;
    if (e.type === "bmp") this.weaveRef.saveBMP("weave_draft", e);
    else if (e.type === "ada") this.weaveRef.saveADA("weave_draft", e);
    
  }

  /**
   * Open the connection modal.
   * @extends WeaveComponent
   * @returns {void}
   */
  public openConnectionDialog() {

    const dialogRef = this.dialog.open(ConnectionModal, {data: {shuttles: this.draft.shuttles}});

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.draft.connections.push(result);
      }
    });
  }


  /**
   * Open the label modal.
   * @extends WeaveComponent
   * @returns {void}
   */
  public openLabelDialog() {

    const dialogRef = this.dialog.open(LabelModal);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
      }
    });
  }

  /**
   * Change shuttle of row to next in list.
   * @extends WeaveComponent
   * @param {number} shuttle - ID of previous shuttle
   * @param {number} the index of row within the pattern.
   * @returns {void}
   */
  public rowShuttleChange(row, index) {

    const len = this.draft.shuttles.length;
    var shuttle = this.draft.rowShuttleMapping[row];

    var newShuttle = (shuttle + 1) % len;
    while (!this.draft.shuttles[newShuttle].visible) {
      var newShuttle = (newShuttle + 1) % len;
    }

    this.draft.rowShuttleMapping[row] = newShuttle;

    this.weaveRef.redrawRow(index * 20, index);
  }

  /// PUBLIC FUNCTIONS
  /**
   * 
   * @extends WeaveComponent
   * @returns {void}
   */
  public print(e) {
    console.log(e);
  }

  /**
   * In
   * @extends WeaveComponent
   * @returns {void}
   */
  public insertRow(i, shuttle) {
    this.draft.insertRow(i, shuttle);
    this.draft.updateConnections(i, 1);
    this.weaveRef.updateSize();
  }

  public cloneRow(i, c, shuttle) {
    this.draft.cloneRow(i, c, shuttle);
    this.draft.updateConnections(i, 1);
    this.weaveRef.updateSize();
  }

  public deleteRow(i) {
    this.draft.deleteRow(i);
    this.draft.updateConnections(i, -1);
    this.weaveRef.updateSize();
  }

  public updatePatterns(e: any) {
    // this.patterns = e.patterns;
    // this.draft.patterns = this.patterns;
    this.draft.patterns = e.patterns;

  }

  public createShuttle(e: any) {
    this.draft.addShuttle(e.shuttle);
    if (e.shuttle.image) {
      this.weaveRef.updateSize();
    }
  }

  public hideShuttle(e:any) {
    this.draft.updateVisible();
    this.weaveRef.updateSize();
  }

  public showShuttle(e:any) {
    this.draft.updateVisible();
    this.weaveRef.updateSize();
  }

  public createPattern(e: any) {
    // e.pattern.id = this.patterns.length;
    // this.patterns.push(e.pattern);
    // this.draft.patterns = this.patterns;
    e.pattern.id = this.draft.patterns.length;
    this.draft.patterns.push(e.pattern);
  }


//should this just hide the pattern or fully remove it, could create problems with undo/redo
   public removePattern(e: any) {
    this.draft.patterns = this.draft.patterns.filter(pattern => pattern !== e.pattern);
  }



  public redraw() {
    this.weaveRef.redraw();
  }

}
