import {createEntityAdapter, EntityAdapter} from '@ngrx/entity';
import {DraftSegment} from './segment';
import {DraftState} from './state';
import {DraftActions, DraftActionTypes} from './actions';


export const draftAdapter: EntityAdapter<DraftSegment> = createEntityAdapter<DraftSegment>();

const initialState: DraftState = draftAdapter.getInitialState({
  ids: [],
  entities: {},
});


export const draftReducer = (state: DraftState = initialState, action: DraftActions) => {
  switch (action.type) {
    case DraftActionTypes.ADD:
      return draftAdapter.addOne(action.segment, state);
  }
  return state;
};

