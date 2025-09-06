import {Cell} from '../../src/objects/datatypes.ts'

const createCell = require('../../src/objects/cell.ts').createCell;

const  unsetCella = {
    is_set: false, 
    is_up: false
  }

const  unsetCellb = {
    is_set: false, 
    is_up: true
  }

const  heddleUp = {
    is_set: true, 
    is_up: true
  }

const heddleDown = {
    is_set: true, 
    is_up: false
  }

test('create cell', () => {


  expect(createCell(true)).toEqual(heddleUp);
  expect(createCell(null)).toEqual(unsetCella);
  expect(createCell(false)).toEqual(heddleDown);
  
});