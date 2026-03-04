import { initDraftFromDrawdown } from "../../draft";
import { NumParam, OpParamVal, OpInput, Operation, OperationInlet, CanvasParam, OpMeta, OpOutput } from "../types";
import { getOpParamValById } from "../../operations";
import { Sequence } from "../../sequence";
import { clothOp } from "../categories";
import { createP5Sketch } from './p5_canvas_sketch';

const name = "cross_section_view";

const meta: OpMeta = {
    displayname: 'cross section view',
    desc: 'Design a draft from cross section view. Explore multilayer structures through cross section drafting.',
    advanced: true,
    categories: [clothOp],
    old_names: []
};

const canvasParam: CanvasParam = {
    name: 'cross_section_canvas',
    type: 'p5-canvas',
    value: {} as any, // canvasState
    dx: 'Interactive canvas for drawing cross-section paths.'
};

const warp_systems_param: NumParam = {
    name: 'Warp Systems',
    type: 'number',
    min: 1,
    max: 10,
    value: 2,
    dx: "Number of distinct warp systems or layers for interaction."
};

const weft_systems_param: NumParam = {
    name: 'Weft Systems',
    type: 'number',
    min: 1,
    max: 10,
    value: 5,
    dx: "Number of weft systems/colors available for drawing paths."
};

const num_warps_param: NumParam = {
    name: 'Number of Warps',
    type: 'number',
    min: 1,
    max: 24,
    value: 8,
    dx: "Number of warps (width) in the cross section draft"
};

const params = [canvasParam, warp_systems_param, weft_systems_param, num_warps_param];
const paramIds = { canvasState: 0, warpSystems: 1, weftSystems: 2, numWarps: 3 };

const inlets: OperationInlet[] = [];

const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<OpOutput>> => {
    // perform() converts the p5 draft to an AdaCAD Draft object
    // No draft generation logic, only this type conversion

    const canvasStateOpParam = getOpParamValById(paramIds.canvasState, op_params) as any;
    const warpSystemsOpParam = getOpParamValById(paramIds.warpSystems, op_params) as number;
    const numWarpsOpParam = getOpParamValById(paramIds.numWarps, op_params) as number;

    // Validate Input Params
    let genericDraftData;
    if (
        !canvasStateOpParam ||
        typeof canvasStateOpParam !== 'object' ||
        Array.isArray(canvasStateOpParam) ||
        !canvasStateOpParam.generatedDraft ||
        typeof canvasStateOpParam.generatedDraft !== 'object' ||
        !Array.isArray(canvasStateOpParam.generatedDraft.rows) ||
        !Array.isArray(canvasStateOpParam.generatedDraft.colSystemMapping)
    ) {
        // Return a default blank draft (handles first run before createSketch populates)
        const numWarpsForBlank = numWarpsOpParam > 0 ? numWarpsOpParam : 1;
        const emptyPattern = new Sequence.TwoD();
        emptyPattern.pushWeftSequence(new Sequence.OneD(Array(numWarpsForBlank).fill(0)).val());
        let d = initDraftFromDrawdown(emptyPattern.export());

        d.colSystemMapping = [];
        const warpSysForBlank = warpSystemsOpParam > 0 ? warpSystemsOpParam : 1;
        for (let i = 0; i < numWarpsForBlank; i++) {
            d.colSystemMapping.push(i % warpSysForBlank);
        }
        d.rowSystemMapping = [0];
        d.colShuttleMapping = Array(numWarpsForBlank).fill(0);
        d.rowShuttleMapping = [0];
        return Promise.resolve([{draft: d}]);
    }

    genericDraftData = canvasStateOpParam.generatedDraft;

    // Step 2: Create Draft object using genericDraftData
    const pattern = new Sequence.TwoD();
    const rowSystemMappingArray: Array<number> = [];
    const rowShuttleMappingArray: Array<number> = [];

    if (genericDraftData.rows.length > 0) {
        const resolvedMaterialIds = genericDraftData.resolvedSketchMaterialIds || [];
        genericDraftData.rows.forEach((genericRow: any) => {
            pattern.pushWeftSequence(new Sequence.OneD(genericRow.cells).val());
            rowSystemMappingArray.push(genericRow.weftId);

            let materialId = 0; // Default material ID
            if (typeof genericRow.weftId === 'number' && genericRow.weftId < resolvedMaterialIds.length) {
                materialId = resolvedMaterialIds[genericRow.weftId];
            }
            rowShuttleMappingArray.push(materialId);
        });
    } else {
        // Create a single blank row when genericDraftData.rows is empty
        const numWarpsForEmptyRow = numWarpsOpParam > 0 ? numWarpsOpParam : 1;
        pattern.pushWeftSequence(new Sequence.OneD(Array(numWarpsForEmptyRow).fill(0)).val());
        rowSystemMappingArray.push(0); // Default weftId for the blank row
    }

    const finalPatternExport = pattern.export();
    let d = initDraftFromDrawdown(finalPatternExport);

    // Populate System Mappings from genericDraftData
    d.colSystemMapping = genericDraftData.colSystemMapping;
    if (d.colSystemMapping.length === 0 && numWarpsOpParam > 0) {
        const warpSysForBlankFallback = warpSystemsOpParam > 0 ? warpSystemsOpParam : 1;
        for (let i = 0; i < numWarpsOpParam; i++) {
            d.colSystemMapping.push(i % warpSysForBlankFallback);
        }
    }
    if (d.colSystemMapping.length === 0 && numWarpsOpParam <= 0) {
        d.colSystemMapping = [0]; // Default for 0 warps
    }

    d.rowSystemMapping = rowSystemMappingArray.length > 0 ? rowSystemMappingArray : [0];

    // Populate Shuttle Mappings
    const numColsInDraft = d.drawdown[0] ? d.drawdown[0].length : (numWarpsOpParam > 0 ? numWarpsOpParam : 1);
    d.colShuttleMapping = Array(numColsInDraft).fill(0);
    d.rowShuttleMapping = rowShuttleMappingArray.length > 0 ? rowShuttleMappingArray : [0];

    return Promise.resolve([{draft: d}]);
};

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
    const num_warps_val = getOpParamValById(paramIds.numWarps, param_vals) as number;
    const canvasState = getOpParamValById(paramIds.canvasState, param_vals) as any;

    let numRows = 1;
    if (canvasState?.generatedDraft?.rows?.length > 0) {
        numRows = canvasState.generatedDraft.rows.length;
    }

    return 'cross section ' + num_warps_val + 'x' + numRows;
};

const sizeCheck = (op_settings: Array<OpParamVal>, op_inputs: Array<OpInput>): boolean => {
    return true;
};

const createSketch = (op_params: Array<OpParamVal>, updateCallback: Function, context?: {isParameterChange: boolean}) => {
    const canvasStateOpParam = getOpParamValById(paramIds.canvasState, op_params) as any;
    const warpSystemsOpParam = getOpParamValById(paramIds.warpSystems, op_params) as number;
    const weftSystemsOpParam = getOpParamValById(paramIds.weftSystems, op_params) as number;
    const numWarpsOpParam = getOpParamValById(paramIds.numWarps, op_params) as number;
    
    const isParameterChange = context?.isParameterChange || false;
    const isNewOperation = !canvasStateOpParam || canvasStateOpParam === "" || (typeof canvasStateOpParam === 'object' && Object.keys(canvasStateOpParam).length === 0);

    function loadCanvasState(DEFAULT_CANVAS_STATE: object) {
        let canvasState: any;
        let needsReset: boolean;
        
        if (isParameterChange || isNewOperation) {
            // Reset to default
            canvasState = JSON.parse(JSON.stringify(DEFAULT_CANVAS_STATE));
            needsReset = true;
        } else {
            // Restore from saved state
            canvasState = canvasStateOpParam;
            needsReset = false;
        }
        return { canvasState, needsReset };
    }

  const config = {
    warpSystems: warpSystemsOpParam,
    weftSystems: weftSystemsOpParam,
    numWarps: numWarpsOpParam,
    canvasState: canvasStateOpParam,
    updateCallback,
    loadCanvasState
  };
  const sketch = createP5Sketch(config);
  return sketch;
};

export const cross_section_view: Operation = {
    name,
    meta,
    params,
    inlets,
    perform,
    generateName,
    sizeCheck,
    createSketch
}