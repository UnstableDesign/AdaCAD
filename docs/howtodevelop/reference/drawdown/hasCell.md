# hasCell
Returns true if a given index exists within a drawdown. 


## Parameters
- [Drawdown](../drawdown/drawdown.md): the drawdown to check 
- number: the weft pick number
- number: the warp end number


## Returns
boolean: true if the pick and end are within valid indexes in the drawdown. False if not.  


## Implementation

```jsx

if(hasCell(drawdown, i, j)){
    drawdown[i][j] = createCell(true);
}

```

This function checks to make sure the index i, j (i = weft pick, j = warp end) exists in the drawdown object. If it does, it adds a cell to that location. 


