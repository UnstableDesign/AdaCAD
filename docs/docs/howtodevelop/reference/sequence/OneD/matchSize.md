# matchSize

This function compares the size of the current sequence to the input sequence. If they are different lengths, it will update either the input sequence or the current sequence to match the longest length by adding unset values (e.g. 2) 

## Parameters
- a Sequence.OneD object of which to match the size

## Returns
the current Sequence.OneD object

## Implementation

```
let seq_a = new Sequence.OneD([0,0,1,1])
let seq_b = new Sequence.OneD([0,0,1,1,1,1])
seq_a.matchSize(seq_b)
```

After calling this operation, the seq_a would be [1, 1, 0, 0, 2, 2]. 


```
let seq_a = new Sequence.OneD([0,0,1,1, 1, 1])
let seq_b = new Sequence.OneD([0,0,1,1])
seq_a.matchSize(seq_b)
```
After calling this operation, the seq_a would be the same but sequence b would be modified to be [0, 0, 1, 1, 2, 2]. 


