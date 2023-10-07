# isUp
Given an index within the drawdown, it will return true or false to describe if this heddle is set and is up. 


## Parameters
- [Drawdown](drawdown): the drawdown to check 
- number: the weft pick number
- number: the warp end number


## Returns
boolean: true if the pick and end are within valid indexes in the drawdown and the heddle at this location is set to true (meaning heddle up or lifted). False if any of these conditions are not met.  


## Implementation

```

if(isUp(drawdown, i, j)){
    drawdown[i][j].is_up = false;
}

```

This function above checks checks the heddle value at i, j (i = weft pick, j = warp end) and if it does, it sets its value to false. 


