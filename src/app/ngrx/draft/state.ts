import {EntityState} from '@ngrx/entity';
import {DraftSegment} from './segment'

export interface DraftState extends EntityState<DraftSegment> {
  // additional entity state properties
}