import {UndoredoState} from './state';
import {AddAction, RedoAction, UndoAction, UndoredoActions, UndoRedoActionTypes} from './actions';

const initialState: UndoredoState = {
  undoActions: [],
  redoActions: []
};


export function undoredoReducer(state = initialState, action: UndoredoActions): UndoredoState {
  switch (action.type) {
    case UndoRedoActionTypes.REDO:
      return redo(state, action);
    case UndoRedoActionTypes.UNDO:
      return undo(state, action);
    case UndoRedoActionTypes.ADD:
      return add(state, action);
    default:
      return state;
  }
}

function redo(state: UndoredoState, action: RedoAction) {
  if (state.redoActions.length === 0) {
    return state;
  }
  return {
    ...state, undoActions: [...state.undoActions, state.redoActions[0]],
    redoActions: state.redoActions.slice(1)
  };
}

function undo(state: UndoredoState, action: UndoAction) {
  if (state.undoActions.length === 0) {
    return state;
  }
  return {
    ...state, undoActions: state.undoActions.slice(0, state.undoActions.length - 1),
    redoActions: [state.undoActions[state.undoActions.length - 1], ...state.redoActions]
  };
}

function add(state: UndoredoState, action: AddAction) {
  return {
    ...state, undoActions: [...state.undoActions, action.payload], redoActions: []
  };
}