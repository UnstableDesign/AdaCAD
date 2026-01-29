---
sidebar_position: 6
---
# DynamicOperation

A dynamic operation describes a special type of [operation](./operation.md) where one of the inputs to the parameters generates inlets that accept inputs. An example is the "Image Map" function, where uploading an image file generates inlets each assigned to a different color. The `dynamic_param_id` identifies which parameter (in the operations parameters array), triggers the generation of inlets.  `dynamic_param_type` describes the kind of dynamic action that will happen when this input is triggered.  `onParamChange` accepts a function that performs the computation to translate the dynamic parameter value into a series of inlets, returned only as value to be attached to the dynamic inlets.   

```jsx title="src/app/core/model/datatypes.js"
export type DynamicOperation = Operation &  {
  dynamic_param_id: number,
  dynamic_param_type: string,
  onParamChange: ( param_vals: Array<OpParamVal>, inlets: Array<OperationInlet>, inlet_vals: Array<any>, changed_param_id: number, param_val: any) => Array<any>;
}
```