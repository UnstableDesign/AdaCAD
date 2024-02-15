# computeFilter

This function performs boolean algebra on the sequence in relationship to a second sequence. The specific boolean algebra operation is determined by an input string. To perform the algebra, it compares the values at each index of the array, and updates the sequence at that index with the resulting value. [matchSize](matchSize) is called within this function to ensure the two sequences are always the same size. 

| filter name  | boolean operation |
| ----------- | ----------- |
| neq |  XOR  |
| and | AND |
| cut |  NAND |
| or |  OR |

## Parameters
- a string indicating the filter to use
- a Sequence.OneD whose values will be computed against the current sequence.


## Returns
the current Sequence.OneD object

## Implementation

```
let seq_a = new Sequence.OneD([0,0,1,1,0,0])
let seq_b = new Sequence.OneD([0,0,1,1,1,1])
seq_a.computerFilter('neq', seq_b)
```

After calling this operation, the seq_a would be [0, 0, 0, 0, 1, 1]. Seq_b would be unchanged. 
