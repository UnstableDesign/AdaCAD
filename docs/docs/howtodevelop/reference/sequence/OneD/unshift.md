# unshift

Unshift pushes the value in passed to the function to the front of the current sequence.


## Parameters
A single number or a boolean (which is then translated to a number by the function)


## Returns
the current Sequence.OneD object


## Implementation

```
let seq = new Sequence.OneD([0,0,1,1])
seq.unshift(2)
```

After calling this operation, the sequence is [2, 0, 0, 1, 1]. 


```
let seq = new Sequence.OneD([0,0,1,1])
seq.unshift(true)
```
In this case, the true is translated by the function as a 1 and then pushed to the front of the sequence [1, 0, 0, 1, 1]. 






