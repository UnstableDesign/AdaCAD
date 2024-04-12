import { Cell, NumParam, Operation, OpInput, OpParamVal, StringParam } from "../../model/datatypes";
import { initDraftFromDrawdown } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import Hydra from 'hydra-synth'


const name = "hydra";
const old_names = [];

//PARAMS
const code_to_run: StringParam =
{
name: 'code',
type: 'jslib',
value: 'shape(20,0.2,0.3).out(o0)',
dx: 'hydra code to run',
regex: /(.*)/,
error: ''

};


const params = [code_to_run];

//INLETS
const inlets = [];

const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {
  const code: number = getOpParamValById(0, param_vals);

    //render on a hidden canvas, 
    //grab the string, keep drawing. 
    const h = new Hydra({ makeGlobal: false, detectAudio: false }).synth
    h.osc().diff(h.shape()).out()
    h.gradient().out(h.o1)
    h.render()
    


  let draft = initDraftFromDrawdown(seq_grid.export());

  return Promise.resolve([draft]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  return 'hydra';
}

export const hydra: Operation = { name, old_names, params, inlets, perform, generateName };


