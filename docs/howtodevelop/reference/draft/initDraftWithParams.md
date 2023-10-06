# initDraftWithParams
Given any partial set of parameters, this function will initialize a new draft that maintains any parameters specified and fills all other values with defaults.  




## Parameters
An object that contains any of the following fields: 

| parameter      | description | default |
| ----------- | ----------- |----------|
| id | a number to use as the id for this draft | a unique 8 digit number
| warps | number describing the total amount of warp ends in the draft  | 1 or (if drawdown is specified) the number of warps in drawdown
| wefts      | number describing the total amount of weft picks in the draft       | 1 or (if drawdown is specified) the number of wefts in drawdown
| gen_name   | a string representing a generated name        | "drafty"
| ud_name | a string representing a user defined name | ""
| drawdown | a Drawdown object or a two-d array of cells.  | [[createCell(false)]]
| colShuttleMapping | an array of numbers that correspond to material ids  | [0]
| rowShuttleMapping | an array of numbers that correspond to material ids  | [1]
| colSystemMapping | an array of numbers that correspond to system ids  | [0]
| rowSystemMapping | an array of numbers that correspond to system ids  | [0]


## Returns
[Draft](draft)



## Implementation



```
initDraftWithParams({wefts: 10, warps: 10})
```
Will generate a drawdown with 10 ends and 10 picks with every cell value being "false" / "warp-lowered". It will also create default values for 10 ends and 10 picks in `rowSystemMapping`, `colSystemMapping`, `rowShuttleMapping` and `colShuttleMapping`. If a parameter isn't explicitly specified, the default value is used. 


```
initDraftWithParams({wefts: 10, warps: 10, drawdown: d})
```
Will generate a drawdown with 10 ends and 10 picks filled with the drawdown "d". It will also create default values for 10 ends and 10 picks in `rowSystemMapping`, `colSystemMapping`, `rowShuttleMapping` and `colShuttleMapping`. If a parameter isn't explicitly specified, the default value is used. 


```
initDraftWithParams({wefts: 10, warps: 10, drawdown: d, rowShuttleMapping: [0,1]})
```
Will generate a drawdown with 10 ends and 10 picks filled with the drawdown "d". It will also create default values for 10 ends and 10 picks in `rowSystemMapping`, `colSystemMapping` and `colShuttleMapping`. `rowShuttleMapping` will be filled with the repeating pattern





