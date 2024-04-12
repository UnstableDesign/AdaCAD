import { Cell, CodeParam, NumParam, Operation, OpInput, OpParamVal, StringParam } from "../../model/datatypes";
import { createBlankDrawdown, initDraftFromDrawdown } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import * as Hydra from 'hydra-synth';


const name = "hydra";
const old_names = [];

//PARAMS
const code_to_run: CodeParam =
{
name: 'code',
type: 'code',
value: 'shape(20,0.2,0.3).out(o0)',
dx: 'hydra code to run',
docs: 'url'

};
const unique_name: StringParam =
{
name: 'id',
type: 'string',
value: 'blob',
dx: 'a unique name for this image',
regex: /(.*)/,
error: ''

};


const params = [code_to_run, unique_name];

//INLETS
const inlets = [];

const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {
  const code: number = getOpParamValById(0, param_vals);
  const unique_name: number = getOpParamValById(1, param_vals);


    let canvas = document.getElementById('testing123');

    //render on a hidden canvas, 
    //grab the string, keep drawing. 
    //const h = new Hydra({ canvas: canvas, makeGlobal: false, detectAudio: false }).synth
    // h.osc().diff(h.shape()).out()
    // h.gradient().out(h.o1)
    // h.render()


    


  let draft = initDraftFromDrawdown(createBlankDrawdown(5,5));

  return Promise.resolve([draft]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  return 'hydra';
}

export const hydra: Operation = { name, old_names, params, inlets, perform, generateName };


