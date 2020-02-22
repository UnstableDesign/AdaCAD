import {UndoredoState} from './state';
import {createSelector} from '@ngrx/store';

const selectUndoredoState = (state: any) => state.undoredo;

export const getUndoAction = createSelector(
  selectUndoredoState,
  (state: UndoredoState) => state.undoActions.length > 0
    && state.undoActions[state.undoActions.length - 1]
);
export const getRedoAction = createSelector(
  selectUndoredoState,
  (state: UndoredoState) => state.redoActions.length > 0
    && state.redoActions[0]
);