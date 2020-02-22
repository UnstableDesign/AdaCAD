import {DraftActionTypes} from '../ngrx/draft/actions';

interface UndoableOperation {
  type: string;
  hint?: string;
}

export const UNDOABLE_OPERATIONS: UndoableOperation[] =
  [
    {hint: 'Update draft', type: DraftActionTypes.ADD},
    // {hint: 'Add todo', type: TodoActionTypes.ADD},
    // {hint: 'Remove todo', type: TodoActionTypes.DELETE},
    // {hint: 'Decrease font size', type: SettingsActionTypes.DEC_FONT},
    // {hint: 'Increase font size', type: SettingsActionTypes.INC_FONT},
  ];