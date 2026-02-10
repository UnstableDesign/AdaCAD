---
sidebar_position: 2
---
# How to Make an Operation

To make an operation, you need to make create or make changes to four files:

| Type | Path | Status |
| --- | --- | --- |
| An operation | ```packages/adacad-drafting-lib/src/operations/<operation-name>/<operation-name.ts> ```| Create |
| An export line | ```packages/adacad-drafting-lib/src/operations/operation_list.ts``` | Update |
| Documentation | ```projects/docs/docs/reference/operations/<operation-category>/<operation-name>/index.md``` | Create |
| Example File | ```projects/docs/docs/reference/operations/<operation-category>/<operation-name>/<operation-name>.ada``` | Create |


# Tutorial: Creating the "All Up" Operation
This is a walkthrough of the simplest operation: an `all up` operation that lifts all the warps of the draft provided. If no draft is provided, it creates a draft of a user defined size. It starts with the minimum elements to make a component. Note the customized areas that create the behavior for `all up` .




## 1. Create the Operation File
To start, we navigate to  the `operations` folder, and create this file, named file `allup.ts`, within a folder called `allup`. 



```tsx
import { initDraftWithParams, wefts, warps, createCell, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { getInputDraft, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { transformationOp } from "../categories";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";

const name = "allup";

const meta: OpMeta = {
  displayname: 'allup',
  advanced: false,
  categories: [transformationOp],
  desc: "Converts all the interlacements to be raised.",
  img: 'allup.png'
}


//PARAMS
const warps:NumParam =  
    {name: 'ends',  
    type: 'number',       
    min: 1,               
    max: 100,             
    value: 12,             
    dx: "default width"
};

const wefts:NumParam =  
    {name: 'picks',  
    type: 'number',       
    min: 1,               
    max: 100,             
    value: 12,             
    dx: "default height"
};


const params: Array<OperationParam> = [warps, wefts];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'input draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft you would like to transform',
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const input_draft = getInputDraft(op_inputs);
  const num_warps: number = getOpParamValById(0, param_vals) as number;
  const num_wefts: number = getOpParamValById(1, param_vals) as number;

  if (input_draft == null){
    const d = initDraftWIthParams({wefts: num_wefts, warps: num_warps, drawdown[[createCell(true)]]})
     return Promise.resolve([{ draft: d }]);
  } 

  let d = initDraftWithParams({
    wefts: wefts(input_draft.drawdown),
    warps: warps(input_draft.drawdown),
    drawdown: [[createCell(true)]]
  });

  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([{ draft: d }]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'allup(' + parseDraftNames(drafts) + ")";
}

const sizeCheck = (param_vals: Array<OpParamVal>): boolean => {
  const ends: number = <number>getOpParamValById(0, param_vals);
  const pics: number = <number>getOpParamValById(1, param_vals);
  return (ends * pics <= defaults.max_area) ? true : false;
}


export const allup: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };
```

### Understanding this File

The imports to this file bring in custom defined types and helpers that allow us to define our operation and manipulate the cells in a draft. 

```tsx
import { initDraftWithParams, wefts, warps, createCell, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { getInputDraft, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { transformationOp } from "../categories";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";
```

Next, we assign this an internal name. This won't be the name shown to the user, just a unique name that we can use to refer to this operation within the code. The old names field is only used if there is an existing operation that you would like to replace with this operation.  

```tsx
const name = "allup";
```

Then, we need to give this operation some meta data, which will be used to organize and explain the operation to a user.

```tsx
const meta: OpMeta = {
  displayname: 'all up', //the name for this interface to display to the user
  advanced: false, //a classification as advanced (true), or not (false)
  categories: [transformationOp], //a category, or list of categories to which this operation belongs
  desc: "Converts all the interlacements to be raised.", //a description for this operation
  authors: ['yourname', 'your collaborators name'] //optional, but can be used to say who was involved in making this operation
}
```

You can find a full list of the current categories and their descriptions at  [packages/adacad-drafting-lib/src/operations/categories.ts](https://github.com/UnstableDesign/AdaCAD/blob/401929e938e1f6da30a114fe32e401ddb43cbeb1/packages/adacad-drafting-lib/src/operations/categories.ts) Try to pick only one category that most closely fits the function of your operation. 

Now we get to define the [parameters](../reference/glossary/parameter) that this operation will use to generate or modify a draft. These fields are used to create user-inputs on screen and can take on several types outlined in the [operation](../reference/glossary/operation.md) reference section. Here we are going to have our `all up` operation take on input parameter, a number, that is used to describe the number of warps in the structure.

```tsx
//PARAMS
const warps:NumParam =  
    {name: 'ends',        //this name that will be visible to the user
    type: 'number',       //this describes the kind of parameter 
    min: 1,               //the minimum value for this parameter
    max: 100,              //the maximum value for this parameter
    value: 12,             //the default value 
    dx: "default width" // a description of this parameter to be shown on the ui
};

const wefts:NumParam =  
    {name: 'picks',  
    type: 'number',       
    min: 1,               
    max: 100,             
    value: 12,             
    dx: "default height"
};


const params: Array<OperationParam> = [warps, wefts];///push all the parameters to an array called params.

```
Next, we describe the kind and number of inputs that a user can add to this operation.  

```tsx
const draft_inlet: OperationInlet = {
  name: 'input draft',  //a name to display on this inlet
  type: 'static',       //pre-defined inlets will always be 'static'.
  value: null,          //if you need to access a value or identifier with this inlet, specify that here, will mostly be null
  uses: "draft",       //describes what element of the draft this operation will use. Some operations only use materials information
  dx: 'the draft you would like to transform', //a description to display on this inlet
  num_drafts: 1 // the maximum number of drafts this inlet can accept. Use -1 for no limit
}

const inlets = [draft_inlet]; //push all the parameters to an array called params.

```

Now the most important part: the code that runs anytime someone adds, changes or performs this operation. This function will be called anytime AdaCAD detects the need for the drafts to recompute.  

To ensure interoperability, this function must take and produce inputs and outputs the same time. Specifically, the perform operation is called with an array of `OpParamVal` objects. This array contains data about the parameters and values currently set on the operation. It also takes in an array of `OpInputs` objects. These hold every draft that has been connected to an inlet/input to the operation.

The perform function also returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) for an Array of OpOutputs. We use javascript's `Promise` because it allows us to ensure that one function completes before the next operation is performed. For this reason, you don't just return an array of drafts that you want this operation to create, but a `Promise.resolve()` that contains the array of drafts that you created. 

Internally, this perform function uses the helper class [Sequence](./reference/sequence/sequence.md) to generate and manipulate values that will be turned into a draft. You can think of a OneD sequence as a row in a draft, with 1 representing a lifted heddle and 0, a lowered heddle. A TwoD sequence is a collection of rows (e.g. multiple picks in a draft). The benefit of using Sequence, rather than a 2D array of numbers, is that the Sequence class supports sequential manipulations and also supports conversion from number sequence to AdaCAD's draft and cell objects. 

```tsx
const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

    const num_up: number = getOpParamValById(0, param_vals);

    let first_row = new Sequence.OneD();
    first_row.pushMultiple(1, num_up); //in num_up = 3, this pushes [1, 1, 1] to the sequence

    let pattern = new Sequence.TwoD();
    pattern.pushWeftSequence(first_row.val());  

    const d = initDraftFromDrawdown(pattern.export());
    return Promise.resolve([{draft:d}]); 
}
```

Each operation also has to have a "generateName" function that creates a name to be assigned to the draft created by this operation.

```tsx
const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    const num_up: number = getOpParamValById(0, param_vals);
    return num_up + '/all-up';
}
```

Each operation also has to have a "sizeCheck" function that ensures that the operation won't allocate too much memory. The limit for any given draft size is stored in `defaults.max_area`

```tsx
const sizeCheck = (param_vals: Array<OpParamVal>): boolean => {
  const ends: number = <number>getOpParamValById(0, param_vals);
  const pics: number = <number>getOpParamValById(1, param_vals);
  return (ends * pics <= defaults.max_area) ? true : false;
}
```

Lastly, and most important, you package all the functions and variables you defined above into an [`Operation`](./reference/operation/operation.md) object. 

```tsx
export const allup: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };
```

## 2. Export the Operation
Now we have to make the operation we just wrote "discoverable" to outside projects by adding to the list of exports in ```packages/adacad-drafting-lib/src/operations/operation_list.ts```

For the operation above, we'd add: 

```
export * from './allup/allup'
```

**if you want to just play with a custom operation on your own, you can end here. If you want to release it to the public, keep going**

## 3. Write an Markdown File as Documentation
Now, provide some information for the public about what you have made. If you are 
  ```projects/docs/docs/reference/operations/<operation-category>/<operation-name>/index.md```

Your file should mimic the structure below:

```tsx
---
title: all up //replace with your display name
sidebar_label: all up //replace with your display name
sidebar_class_name: transformation opItem //use your category name here, and keep opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/allup/allup.ts'  //path to the operation in the library
---

import {OperationHeader} from '@site/src/components/OperationPage'; //heep this line ot include an automatically generated header from the information in the library. 

<OperationHeader name='allup' /> //for name, include the name of your new operation

//add any additional information about the parameters and inlets here. 
## Parameters
- `ends`: the number of ends in the structure
- `pics`: the number of pics in the structure


//write an example of how someone could apply this operation
## Application
Often used when masking one draft with another, this defines an entire region as black cells, allowing them to function as a masking region

## Developer
adacad id: `allup`    //replace with your internal name

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/allup/allup.ts
```

## 4. Create an AdaCAD File for the Screenshot Generator
Open adacad.org locally and add your operation to the workspace. Try to show various ways that it can be configured. then, save the workspace and name it `allup.ada` and drop it into the same directory as your .md file. When the screenshot generator runs, it will load this ada workspace take a screenshot, and drop the .png file into the directory. 
