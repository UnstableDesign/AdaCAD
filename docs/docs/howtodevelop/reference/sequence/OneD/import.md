# import

Replaces the current state of the sequence with the values passed to the function. This function can accept an array of Cells or numbers. If cells are provided, it will store the corresponding number value associated with the cell state (see: [Sequence](../sequence) for more information on this mapping). 

## Parameters
- the values to include in the sequence. These can either be an array of Cells or an array of numbers. If an array of cells is provided, teh cell values will be converted to numbers before being stored in the sequence. 


## Returns
the current Sequence.OneD object


## Implementation

```
let seq = new Sequence.OneD([0,0,1,1])
seq.import([2, 2])
```

After calling this operation, the resulting sequence is [2, 2]. 


This method becomes valuable because it allows one to import a row or column from a drawdown directly into the sequence, like so: 


```
let seq = new Sequence.OneD().import(drawdown[i]);
```

This makes it easier to move a weft pick or warp end into a sequence and manipulate it. 
