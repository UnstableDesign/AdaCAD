# setCellValue
Sets the cell value at a given index. 

## Parameters
- [Drawdown](drawdown): the drawdown to check 
- number: the weft pick number
- number: the warp end number
- boolean: the value to set the cell


## Returns
- [Drawdown](drawdown): the drawdown object after the cell has been set with the new value. 


## Implementation

```
d = setCellValue(d,1,1, false)
```

This function above checks sets the heddle at i=1, j=1 (i = weft pick, j = warp end) as false. 


```
d = setCellValue(d,1,1, null)
```

This function above checks sets the heddle at i=1, j=1 (i = weft pick, j = warp end) as unset. 

