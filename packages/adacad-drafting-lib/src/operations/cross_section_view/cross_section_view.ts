import { initDraftFromDrawdown } from "../../draft";
import { OpParamVal, OpInput, Operation, OperationInlet, CanvasParam, OpMeta, OpOutput } from "../types";
import { getInputDraft, getOpParamValById } from "../../operations";
import { Sequence } from "../../sequence";
import { clothOp } from "../categories";
import { createP5Sketch } from './p5_canvas_sketch';
import { computeStrokeWeights, computeDotSizes } from './defaults';

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

const seed_draft_inlet: OperationInlet = {
    name: 'seed draft',
    type: 'static',
    value: null,
    uses: 'draft',
    dx: 'optional seed draft providing warp/weft system counts and colors',
    num_drafts: 1
};

const params = [canvasParam];
const paramIds = { canvasState: 0 };

const inlets: OperationInlet[] = [seed_draft_inlet];

// Derive effective warp/weft system counts and warp count from seed draft or canvas state
function deriveEffectiveConfig(canvasState: any, seedDraft: any) {
    const numWarps = canvasState?.manualNumWarps || 8;
    let warpSystems: number;
    let weftSystems: number;

    if (seedDraft) {
        warpSystems = new Set(seedDraft.colSystemMapping).size || 1;
        weftSystems = new Set(seedDraft.rowSystemMapping).size || 1;
    } else {
        warpSystems = canvasState?.manualWarpSystems || 2;
        weftSystems = canvasState?.manualWeftSystems || 5;
    }
    return { numWarps, warpSystems, weftSystems };
}

const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<OpOutput>> => {
    // perform() converts the p5 draft to an AdaCAD Draft object

    const canvasStateOpParam = getOpParamValById(paramIds.canvasState, op_params) as any;
    const seedDraft = getInputDraft(op_inputs);

    const { numWarps: numWarpsVal, warpSystems: warpSystemsVal } = deriveEffectiveConfig(canvasStateOpParam, seedDraft);

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
        const numWarpsForBlank = numWarpsVal > 0 ? numWarpsVal : 1;
        const emptyPattern = new Sequence.TwoD();
        emptyPattern.pushWeftSequence(new Sequence.OneD(Array(numWarpsForBlank).fill(0)).val());
        let d = initDraftFromDrawdown(emptyPattern.export());

        d.colSystemMapping = [];
        const warpSysForBlank = warpSystemsVal > 0 ? warpSystemsVal : 1;
        for (let i = 0; i < numWarpsForBlank; i++) {
            d.colSystemMapping.push(i % warpSysForBlank);
        }
        d.rowSystemMapping = [0];
        d.colShuttleMapping = seedDraft
            ? Array(numWarpsForBlank).fill(0).map((_, i) =>
                seedDraft.colShuttleMapping[i % seedDraft.colShuttleMapping.length] || 0)
            : Array(numWarpsForBlank).fill(0);
        d.rowShuttleMapping = [0];

        return Promise.resolve([{draft: d}]);
    }

    genericDraftData = canvasStateOpParam.generatedDraft;

    // Create Draft object using genericDraftData
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
        const numWarpsForEmptyRow = numWarpsVal > 0 ? numWarpsVal : 1;
        pattern.pushWeftSequence(new Sequence.OneD(Array(numWarpsForEmptyRow).fill(0)).val());
        rowSystemMappingArray.push(0); // Default weftId for the blank row
    }

    const finalPatternExport = pattern.export();
    let d = initDraftFromDrawdown(finalPatternExport);

    // Populate System Mappings from genericDraftData
    d.colSystemMapping = genericDraftData.colSystemMapping;
    if (d.colSystemMapping.length === 0 && numWarpsVal > 0) {
        const warpSysForBlankFallback = warpSystemsVal > 0 ? warpSystemsVal : 1;
        for (let i = 0; i < numWarpsVal; i++) {
            d.colSystemMapping.push(i % warpSysForBlankFallback);
        }
    }
    if (d.colSystemMapping.length === 0 && numWarpsVal <= 0) {
        d.colSystemMapping = [0]; // Default for 0 warps
    }

    d.rowSystemMapping = rowSystemMappingArray.length > 0 ? rowSystemMappingArray : [0];

    // Populate Shuttle Mappings
    const numColsInDraft = d.drawdown[0] ? d.drawdown[0].length : (numWarpsVal > 0 ? numWarpsVal : 1);
    if (seedDraft) {
        d.colShuttleMapping = Array(numColsInDraft).fill(0).map((_, i) => {
            return seedDraft.colShuttleMapping[i % seedDraft.colShuttleMapping.length] || 0;
        });
    } else {
        d.colShuttleMapping = Array(numColsInDraft).fill(0);
    }
    d.rowShuttleMapping = rowShuttleMappingArray.length > 0 ? rowShuttleMappingArray : [0];

    return Promise.resolve([{draft: d}]);
};

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
    const canvasState = getOpParamValById(paramIds.canvasState, param_vals) as any;
    const numWarpsVal = canvasState?.manualNumWarps || 8;

    let numRows = 1;
    if (canvasState?.generatedDraft?.rows?.length > 0) {
        numRows = canvasState.generatedDraft.rows.length;
    }

    return 'cross section ' + numWarpsVal + 'x' + numRows;
};

const sizeCheck = (op_settings: Array<OpParamVal>, op_inputs: Array<OpInput>): boolean => {
    return true;
};

const createSketch = (op_params: Array<OpParamVal>, updateCallback: Function, context?: {isParameterChange: boolean, weftColors?: string[], weftMaterialIds?: number[], warpColors?: string[], weftDiameters?: number[], warpDiameters?: number[]}, op_inputs?: Array<OpInput>) => {
    const canvasStateOpParam = getOpParamValById(paramIds.canvasState, op_params) as any;
    const seedDraft = op_inputs ? getInputDraft(op_inputs) : null;
    const hasSeedDraft = seedDraft !== null;

    const { numWarps: effectiveNumWarps, warpSystems: effectiveWarpSystems, weftSystems: effectiveWeftSystems } = deriveEffectiveConfig(canvasStateOpParam, seedDraft);

    // Colors and diameters resolved at the UI boundary
    const weftColors = context?.weftColors ?? [];
    const weftMaterialIds = context?.weftMaterialIds ?? [];
    const warpColors = context?.warpColors ?? [];
    const weftDiameters = context?.weftDiameters ?? [];
    const warpDiameters = context?.warpDiameters ?? [];

    // Compute visual sizes from raw diameters
    const weftStrokeWeights = computeStrokeWeights(weftDiameters);
    const warpDotSizes = computeDotSizes(warpDiameters);

    const isParameterChange = context?.isParameterChange || false;
    const isNewOperation = !canvasStateOpParam || canvasStateOpParam === "" || (typeof canvasStateOpParam === 'object' && Object.keys(canvasStateOpParam).length === 0);

    function loadCanvasState(DEFAULT_CANVAS_STATE: object) {
        let canvasState: any;
        let needsReset: boolean;

        if (isParameterChange || isNewOperation) {
            canvasState = JSON.parse(JSON.stringify(DEFAULT_CANVAS_STATE));
            needsReset = true;
        } else {
            // Compare what the design was built for vs current effective values.
            // Catches: seed draft system changes, connect, disconnect, manual stepper.
            const builtWarp = canvasStateOpParam?.builtForWarpSystems;
            const builtWeft = canvasStateOpParam?.builtForWeftSystems;
            const structureChanged =
                (builtWarp !== undefined && builtWarp !== effectiveWarpSystems) ||
                (builtWeft !== undefined && builtWeft !== effectiveWeftSystems);

            if (structureChanged) {
                canvasState = JSON.parse(JSON.stringify(DEFAULT_CANVAS_STATE));
                needsReset = true;
            } else {
                canvasState = canvasStateOpParam;
                needsReset = false;
            }
        }
        return { canvasState, needsReset };
    }

    const config = {
        warpSystems: effectiveWarpSystems,
        weftSystems: effectiveWeftSystems,
        numWarps: effectiveNumWarps,
        hasSeedDraft,
        weftColors,
        weftMaterialIds,
        warpColors,
        weftStrokeWeights,
        warpDotSizes,
        seedColSystemMapping: seedDraft?.colSystemMapping,
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
