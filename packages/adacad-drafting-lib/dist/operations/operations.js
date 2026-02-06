"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDraftNames = exports.getOpParamValByName = exports.getOpParamValById = exports.flattenParamVals = exports.reduceToStaticInputs = exports.getAllDraftsAtInlet = exports.getAllDraftsAtInletByLabel = exports.getInputDraft = exports.operationHasInputs = exports.call = exports.getAllOps = exports.getOpList = exports.getOp = exports.opCategoryList = void 0;
const draft_1 = require("../draft");
const categories_1 = require("./categories");
const Operations = __importStar(require("../operations/operation_list"));
/**
 * generates a list of all the current categorization options for operations.
 * @returns
 */
const opCategoryList = () => {
    return [
        categories_1.structureOp,
        categories_1.transformationOp,
        categories_1.clothOp,
        categories_1.compoundOp,
        categories_1.dissectOp,
        categories_1.computeOp,
        categories_1.helperOp,
        categories_1.colorEffectsOp,
        categories_1.draftingStylesOp
    ];
};
exports.opCategoryList = opCategoryList;
const getOp = (name) => {
    const all_objs = Object.values(Operations);
    const published_ops = all_objs.filter(el => el.meta.draft === undefined);
    const op = published_ops.find(el => el.name == name);
    return op !== null && op !== void 0 ? op : null;
};
exports.getOp = getOp;
/**
 * returns a list of all the operations that are currently exported in op-list.
 * The operation must not be a draft but it returns it's entire object
 * @param category
 * @returns
 */
const getOpList = (category) => {
    const all_objs = Object.values(Operations);
    const published_ops = all_objs.filter(el => el.meta.draft === undefined);
    const category_ops = published_ops.filter(op => {
        const obj = op.meta.categories.find(cat => cat.name == category);
        return (obj !== undefined);
    }, []);
    return category_ops;
};
exports.getOpList = getOpList;
/**
 * returns a list of every operation that is currently exported in oplist.ts.
 * The operation must not be a draft but it returns it's entire object
 * @param category
 * @returns
 */
const getAllOps = () => {
    const all_objs = Object.values(Operations);
    const published_ops = all_objs.filter(el => el.meta.draft === undefined);
    return published_ops;
};
exports.getAllOps = getAllOps;
/**
 * a wrapper to simplify how operations are called from within the code.
 * @param op the operation you are calling
 * @param params the values to associate with each parameter (in the order they are defined). If you define less than what is required, or submit a parameter of the wrong type (e.g. a string instead of a number), it will automatically replace the param with the default value
 * @param inlets the drafts to use in the computation, any values associated with those inputs, as well as the cooresponding id to be associated with the drafts
 * @returns a promise containing an array of drafts
 */
const call = async (op, params, inlets) => {
    const formatted_params = op.params.map((el, ndx) => {
        if (params[ndx] === null || params[ndx] === undefined || typeof el.value != typeof params[ndx]) {
            return { param: el, val: el.value };
        }
        else {
            return { param: el, val: params[ndx] };
        }
    });
    return op.perform(formatted_params, inlets !== null && inlets !== void 0 ? inlets : []);
};
exports.call = call;
const operationHasInputs = (op_inputs) => {
    return op_inputs.length > 0;
};
exports.operationHasInputs = operationHasInputs;
const getInputDraft = (op_inputs) => {
    if (!(0, exports.operationHasInputs)(op_inputs))
        return null;
    else
        return op_inputs[0].drafts[0];
};
exports.getInputDraft = getInputDraft;
/**
 * in cases where the inlet id's may not directly correspond to values (e.g. layer notation), we may want to retreive all drafts associated with a given string
 * @param op_inputs
 * @param inlet_value
 * @returns
 */
const getAllDraftsAtInletByLabel = (op_inputs, inlet_value) => {
    if (!(0, exports.operationHasInputs)(op_inputs) || inlet_value === '')
        return [];
    else {
        let input_id = -1;
        op_inputs.forEach((input, ndx) => {
            //includes handles the case that occured between version where paranthesis were stripped
            const found = input.inlet_params.findIndex(p => inlet_value.includes(p));
            if (found !== -1)
                input_id = ndx;
        });
        if (input_id == -1)
            return [];
        return op_inputs[input_id].drafts;
    }
};
exports.getAllDraftsAtInletByLabel = getAllDraftsAtInletByLabel;
const getAllDraftsAtInlet = (op_inputs, inlet_id) => {
    if (!(0, exports.operationHasInputs)(op_inputs) || inlet_id < 0)
        return [];
    else {
        const req_inputs = op_inputs.filter(el => el.inlet_id == inlet_id);
        const drafts = req_inputs.reduce((acc, el) => {
            return acc.concat(el.drafts);
        }, []);
        return drafts;
    }
};
exports.getAllDraftsAtInlet = getAllDraftsAtInlet;
const returnDefaultValue = (p) => {
    switch (p.param.type) {
        case 'boolean':
            return false;
        case 'draft':
            return null;
        case 'file':
            return null;
        case 'number':
            return 0;
        case 'select':
            return null;
        case 'string':
            return '';
        default:
            return null;
    }
};
const reduceToStaticInputs = (inlets, inlet_vals) => {
    const static_inputs = inlets.filter(el => el.type === 'static');
    inlet_vals = inlet_vals.slice(0, static_inputs.length);
    return inlet_vals;
};
exports.reduceToStaticInputs = reduceToStaticInputs;
// export const getOpParamValByName = (name: string, params: Array<OpParamVal>): OpParamVal | null => {
//     if (params.length == 0) return null;
//     const item = params.find(el => el.param.name == 'name');
//     if (item == undefined) {
//         console.error("CANNOT FIND OPERATION PARAMETER WITH NAME ", name);
//         return returnDefaultValue(params[0])
//     }
//     return item;
// }
/**
 * given the current list of params for an operation, this function concatenates them into a comma separated string of values
 * @param params
 */
const flattenParamVals = (params) => {
    return params.map(p => p.val).join(',');
};
exports.flattenParamVals = flattenParamVals;
//TO DO, these are returning different values (one returns the val, and the other returns the type, see if /where this causes errors)
const getOpParamValById = (id, params) => {
    if (params.length == 0)
        return null;
    if (id < params.length) {
        return params[id].val;
    }
    else {
        console.error("PARAM ID ", id, " NOT FOUND IN PARAMS ", params);
        return returnDefaultValue(params[0]);
    }
};
exports.getOpParamValById = getOpParamValById;
const getOpParamValByName = (name, params) => {
    if (params.length == 0)
        return null;
    const item = params.find(el => el.param.name == 'name');
    if (item == undefined) {
        console.error("CANNOT FIND OPERATION PARAMETER WITH NAME ", name);
        return returnDefaultValue(params[0]);
    }
    return item.val;
};
exports.getOpParamValByName = getOpParamValByName;
const parseDraftNames = (drafts) => {
    if (drafts.length == 0)
        return '';
    const flat_names = drafts.reduce((acc, el) => {
        return acc + "+" + (0, draft_1.getDraftName)(el);
    }, '');
    return flat_names.substring(1);
};
exports.parseDraftNames = parseDraftNames;
//# sourceMappingURL=operations.js.map