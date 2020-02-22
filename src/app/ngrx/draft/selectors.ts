import {draftAdapter} from './reducer';
import {createFeatureSelector, createSelector} from '@ngrx/store';
import {DraftState} from './state';


const getDraftState = createFeatureSelector<DraftState>('segments');

export const {selectAll} = draftAdapter.getSelectors(getDraftState);


const selectDraftState = (state: any) => state.segments;

export const getCurrentDraft = createSelector(
  selectDraftState,
  (state: DraftState) => state.ids.length > 0 ? 
  state.entities[state.ids.slice(-1)[0]] : null
);