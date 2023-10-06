# createCell
Creates a cell object with a specific value:





## Parameters
a boolean to describe the value of this cell according to the following inputs: 

| input  | meaning | `is_set` | `is_up` |
| ----------- | ----------- |----------|----------|
| true | heddle is up / lifted |true | true | 
| false | heddle is down / lowered|true| false | 
| null |heddle is unset| false | false |


## Returns
[Cell](cell)



## Implementation
```
const c: Cell = createCell(false);
```



