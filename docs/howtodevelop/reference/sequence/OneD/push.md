# push

Pushes the value in passed to the function to the back of the current sequence.


## Parameters
A single number or a boolean (which is then translated to a number by the function)


## Returns
the current Sequence.OneD object

## Implementation

```
let seq = new Sequence.OneD([0,0,1,1])
seq.push(2)
```

After calling this operation, the sequence is [0, 0, 1, 1, 2]. 


```
let seq = new Sequence.OneD([0,0,1,1])
seq.push(true)
```
In this case, the true is translated by the function as a 1 and then pushed to the back of the sequence, resulting in [0, 0, 1, 1, 1]. 



