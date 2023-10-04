---
sidebar_position: 5
---
# Opeartion 
Operations perform computations upon a draft. They are the core of AdaCAD, as they can be combined and arranged to "grow" different kinds of drafts. Operations each contain a set of data, which the software can interpret into an on screen element the user can add to their data flow. Each operation has a `name` which must be a unique name that is only used internally to locate this specific operation. `old_names` is a field I made when the name changes or when you no longer want to support an old operation and want to load this operation instead.  

Operations can hold a series of parameters or `params` of type "OpParam" (below) which define that data that can be used when the draft is recomputed by the operation. In addition to the parameters, each operation can offer a set of `inlets`. Inlets are parameterized inputs to the operation and each inlet can accept one or more drafts. So, drafts come into an operation via the inlets, and then are computed according to the specified parameters. 

The `perform` field takes a function that contains the code to translate the inputs and parameters into new one or more new output drafts. `generateName` is a function that will automatically create a new name for the draft so that when a draft is created by a series of operations, it is reflected in the default name. 

```jsx title="src/app/core/model/datatypes.js"
export type Operation = {
    name: string,
    params: Array<OperationParam>,
    inlets: Array<OperationInlet>,
    old_names: Array<string>,
    perform: (op_settings: Array<OpParamVal>, op_inputs: Array<OpInput>) => Promise<Array<Draft>>,
    generateName: (op_settings: Array<OpParamVal>, op_inputs: Array<OpInput>, ...args) => string
 }
```

All implemented operations are stored in the folder: [src/app/core/operations/](https://github.com/UnstableDesign/AdaCAD/blob/main/src/app/core/operations)


# OperationParam
An operation param describes what kind of parameters someone will be able to provide to a particular operation. There is a generic OperationParam that stores the `name` to be deplayed next to this parameter on the operation, the `type` of parameter, a default `value` to be used when this paratermer is loaded and a description `dx` that explains how this parameter will be used. OperationParams of certain types need additional information to function. For this reason, when you define an operation, you can be more specific by defining the operation of a given type: `NumParam`, `dx`


```jsx title="src/app/core/model/datatypes.js"
export type OperationParam = {
  name: string,
  type: 'number' | 'boolean' | 'select' | 'file' | 'string' | 'draft' | 'notation_toggle';
  value: any,
  dx: string
}
/**
 * An extension of Param that handles extra requirements for numeric data inputs
 * @param min the minimum allowable value
 * @param max the maximum allowable value
 */
export type NumParam = OperationParam & {
  min: number,
  max: number
}


/**
 * An extension of Param that handles extra requirements for select list  inputs
 * @param seleclist an array of names and values from which the user can select
 */
export type SelectParam = OperationParam & {
  selectlist: Array<{name: string, value: number}>
}

/**
 * An extension of Param that handles extra requirements for select boolean inputs
 * @param falsestate a description for the user explaining what "false" means in this param
 * @param truestate a description for the user explaining what "false" means in this param
 */
export type BoolParam = OperationParam & {
  falsestate: string,
  truestate: string
}

/**
* An extension of Param that handles extra requirements for select file inputs
*/
export type FileParam = OperationParam & {
}


/**
* An extension of Param that in intended to shape how inlets parse layer notation to generate inlets
* @param id draft id at this parameter --- unusued currently 
*/
export type NotationTypeParam = OperationParam & {
  falsestate: string,
  truestate: string
}


/**
* An extension of Param that handles extra requirements for strings as inputs
* @param regex strings must come with a regex used to validate their structure
 * test and make regex using RegEx101 website
 * do not use global (g) flag, as it creates unpredictable results in test functions used to validate inputs
@param error the error message to show the user if the string is invalid 
*/
export type StringParam = OperationParam & {
  regex: RegExp,
  error: string

```
# OperationInlet
An OperationInlet describes what kind of inlets someone will be able to provide to a particular operation. Each inlet has a `name` which if not "draft" is written next to the inlet itself. It contains a `type`, which describes particular features of the inlet and the kind of information that can be tagged to this inlet. A `dx` provides a description of what should go in this inlet. `uses` describes the kind of information that will be used from drafts attached to this inlet. `num_drafts` describes how many drafts can be attached at this inlet. If -1, it means that this inlet can take an unlimited number of drafts. 


```jsx title="src/app/core/model/datatypes.js"

 export type OperationInlet = {
  name: string,
  type: 'number' | 'notation' | 'system' | 'color' | 'static' | 'draft' | 'profile' | 'null',
  dx: string,
  uses: 'draft' | 'weft-data' | 'warp-data' | 'warp-and-weft-data' ,
  value: number | string | null,
  num_drafts: number
}
```

# OperationInlet
An OperationInlet describes what kind of inlets someone will be able to provide to a particular operation. Each inlet has a `name` which if not "draft" is written next to the inlet itself. It contains a `type`, which describes particular features of the inlet and the kind of information that can be tagged to this inlet. A `dx` provides a description of what should go in this inlet. `uses` describes the kind of information that will be used from drafts attached to this inlet. `num_drafts` describes how many drafts can be attached at this inlet. If -1, it means that this inlet can take an unlimited number of drafts. 


```jsx title="src/app/core/model/datatypes.js"

 export type OperationInlet = {
  name: string,
  type: 'number' | 'notation' | 'system' | 'color' | 'static' | 'draft' | 'profile' | 'null',
  dx: string,
  uses: 'draft' | 'weft-data' | 'warp-data' | 'warp-and-weft-data' ,
  value: number | string | null,
  num_drafts: number
}
```


# OpParamVal & OpInput

Because of the way that AdaCAD is structured so that you can easily add and remove operations without touching the rest of the code, we have to use different types to provide the user specified inputs to the operation to perform. `OpParamVal` and `OpInput` hold all the data neccessary to perform the computation. OpParamVal includes all of the values that the user provided to the specified parameters. It consists of a reference to the parameter itself, as well as the value specified by the user. OpInput holds the drafts provided to the inlet, specified by inlet_id, as well as any parameters attached to this inlet. 

```jsx title="src/app/core/model/datatypes.js"

 export interface OpParamVal{
    param: OperationParam,
    val: any
 }

 export interface OpInput{
    drafts: Array<Draft>,
    params: Array<any>,
    inlet_id: number
 }
  
 ```

 
