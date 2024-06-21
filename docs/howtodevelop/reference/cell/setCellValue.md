# setCellValue
Sets the variables of the cell object according to a boolean input.  


## Parameters
a boolean to describe the value of this cell according to the following inputs: 

| input  | meaning | `is_set` | `is_up` |
| ----------- | ----------- |----------|----------|
| true | heddle is up / lifted |true | true | 
| false | heddle is down / lowered|true| false | 
| null |heddle is unset| false | false |


## Returns
[Cell](./cell.md)


## Implementation
```
if(getCellValue(c) == null){
    c = setCellValue(true);
}
```

This function checks if Cell c is unset and, if so, it changes it to be true. 

