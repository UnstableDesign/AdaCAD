import {Action} from '@ngrx/store';
import {DraftSegment} from './segment';
import {Update} from '@ngrx/entity';


export enum DraftActionTypes {
  ADD = '[Draft Segment] Update draft',
}


export class AddAction implements Action {
  readonly type = DraftActionTypes.ADD;

  constructor(public segment: DraftSegment) {

  }
}

export type DraftActions = AddAction;