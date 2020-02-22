import {Action} from '@ngrx/store';

export enum UndoRedoActionTypes {
  UNDO = '[UndoRedo] Undo action',
  REDO = '[UndoRedo] Redo action',
  ADD = '[UndoRedo] Add action'

}

export class UndoAction implements Action {
  readonly type = UndoRedoActionTypes.UNDO;

  /**
   * If specifies undo to specific action(0 - first action that was done), otherwise undo to previous action
   * @param index index in the states array to undo to the specific state if specified
   */
  constructor(public index?: number) {

  }

}


export class RedoAction implements Action {
  readonly type = UndoRedoActionTypes.REDO;

  /**
   * If specifies redo to specific action(0 - first action that was undone), otherwise undo to next action
   * @param index index in the states array to redo to the specific state if specified
   */
  constructor(public index?: number) {

  }

}

export class AddAction implements Action {
  constructor(public payload: string) {
  }

  readonly type = UndoRedoActionTypes.ADD;

}

export type UndoredoActions =
  UndoAction |
  RedoAction |
  AddAction;