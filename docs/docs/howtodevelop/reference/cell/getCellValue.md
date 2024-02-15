# getCellValue
Returns a boolean value describing the value of this heddle as true, false, or unset. 


## Parameters
[Cell](cell)

## Returns
boolean (corresponding to heddle up or down) or null (meaning heddle is unset)


| returns  | meaning | `is_set` | `is_up` |
| ----------- | ----------- |----------|----------|
| true | heddle is up / lifted |true | true | 
| false | heddle is down / lowered|true| false | 
| null |heddle is unset| false | false |


## Implementation
```
if(getCellValue(c) == null){
    c = setCellValue(true);
}
```

This function checks if Cell c is unset and, if so, it changes it to be true. 

