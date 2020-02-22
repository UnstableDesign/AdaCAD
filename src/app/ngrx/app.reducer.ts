import {ActionReducerMap} from '@ngrx/store';
import {AppState} from './app.state';
import {draftReducer} from './draft/reducer';

export const appReducer: ActionReducerMap<AppState> = {
  segments: draftReducer,
};