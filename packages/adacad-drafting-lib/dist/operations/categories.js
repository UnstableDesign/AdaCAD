"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.draftingStylesOp = exports.colorEffectsOp = exports.helperOp = exports.computeOp = exports.dissectOp = exports.compoundOp = exports.clothOp = exports.transformationOp = exports.structureOp = void 0;
/**
 * Operations can be categorized in the interface based on their function.
 * each object below contains the information about possible categories for operations
 */
exports.structureOp = {
    name: 'structure',
    displayname: 'structure',
    color: '#ef7a31',
    desc: "A weave structure is the order or pattern of interlacement between the warp and weft threads. There are different families of woven structure that share core properties, such as plain weave, twill, and satin. Each of the operations is capable of generating structures that obey the rules of a given family",
};
exports.transformationOp = {
    name: 'transformation',
    displayname: 'transformation',
    color: '#ac9a72',
    desc: "Takes an input structure or draft and transforms it in some way.",
};
exports.clothOp = {
    name: 'cloth',
    displayname: 'cloth',
    color: '#5bb433',
    desc: "Describes the arrangements of pattern regions in an overall draft or cloth. Regions defined by the cloth design parameters can be filled with input drafts. ",
};
exports.compoundOp = {
    name: 'compound',
    displayname: 'compound',
    color: '#38c178',
    desc: "Describes operations that support joining different structural elements together compound weave structures characterized by the use of multiple weft and warp systems and/or layers.",
};
exports.dissectOp = {
    name: 'dissect',
    displayname: 'dissect',
    color: '#32b1cf',
    desc: "Describes operations that split apart a single input draft into multiple outputs according to some criteria. ",
};
exports.computeOp = {
    name: 'compute',
    displayname: 'compute',
    color: '#9393d6',
    desc: "Applies different forms of computational, binary, and/or mathematical functions to the production and modification of drafts."
};
exports.helperOp = {
    name: 'helper',
    displayname: 'helper',
    color: '#ba6bc7',
    desc: "Describes common drafting techniques to ensure good woven and cloth structure."
};
exports.colorEffectsOp = {
    name: 'color',
    displayname: 'color effects',
    color: '#e56397',
    desc: "Supports the specification of materials in order to describe different color effects on the woven cloth"
};
exports.draftingStylesOp = {
    name: 'style',
    displayname: 'drafting style',
    color: '#b88282',
    desc: "Supports the conversion of one style of drafting to another, based on the requirements of specific equipment"
};
//# sourceMappingURL=categories.js.map