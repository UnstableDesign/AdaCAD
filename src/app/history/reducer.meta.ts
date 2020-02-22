import {ActionReducer} from '@ngrx/store';
import {AddAction, UndoRedoActionTypes} from './actions';
import {UndoableState} from './undoable';
import {cloneDeep, get, pick, set} from 'lodash';
import {UNDOABLE_OPERATIONS} from './operations';
import {AppState} from '../ngrx/app.state';

const PERSISTENT_KEYS = ['segments'];

export function undoredoMeta(reducer: ActionReducer<any>): ActionReducer<any> {
  let states: UndoableState = {
    past: [],
    present: reducer(undefined, {type: '__INIT__'}),
    future: []
  };

  return (state, action) => {
    const {past, present, future} = states;

    function onUndo() {
      if (past.length === 0) {
        return state;
      }
      // var id = state.segments.ids.slice(-1)[0];
      // console.log(id, state.undoredo);
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      states = {
        past: newPast,
        present: {...previous, undoredo: state.undoredo},
        future: [present, ...future]
      };
      console.log(reducer(mergeStates(state, states.present), action));
      return reducer(mergeStates(state, states.present), action);
    }

    function onRedo() {
      if (future.length === 0) {
        return state;
      }
      const next = future[0];
      const newFuture = future.slice(1);
      states = {
        past: [...past, present],
        present: {...next, undoredo: state.undoredo},
        future: newFuture
      };
      console.log(reducer(mergeStates(state, states.present), action));
      return reducer(mergeStates(state, states.present), action);
    }

    switch (action.type) {
      case UndoRedoActionTypes.UNDO:
        return onUndo();
      case UndoRedoActionTypes.REDO:
        return onRedo();
      default:
        // Delegate handling the action to the passed reducer
        const persistentAction = UNDOABLE_OPERATIONS.find(item => item.type === action.type);
        if (persistentAction) {
          const newPresent = reducer(state, action);
          if (present === newPresent) {
            return state;
          }
          states = {
            past: [...past, present],
            present: extractState(newPresent),
            future: []
          };
          return reducer(newPresent, new AddAction(persistentAction.hint || persistentAction.type));
        } else {
          const newState = reducer(state, action);
          states = {...states, present: extractState(newState)};
          return newState;
        }
    }
  };
}

/**
 * Retrieves persistable part of the state.
 * @param state application state
 */
function extractState(state: AppState) {
  // console.log(state);
  return pick(state, PERSISTENT_KEYS);
}

/**
 * Merge appstate with undoable part
 * @param state app state
 * @param undoablePart part of the state that was persisted
 */
function mergeStates(state: AppState, undoablePart) {
  const newState = cloneDeep(state);
  PERSISTENT_KEYS.forEach(key => set(newState, key, get(undoablePart, key)));
  return newState;
}