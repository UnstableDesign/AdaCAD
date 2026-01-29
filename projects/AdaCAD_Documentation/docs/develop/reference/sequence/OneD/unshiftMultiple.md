# unshiftMultiple

Pushes the value passed to the function to the front of the current sequence multiple times.


## Parameters
- A single number or a boolean (which is then translated to a number by the function)
- a number representing how many times this value should be added


## Returns
the current Sequence.OneD object


## Implementation

```tsx
let seq = new Sequence.OneD([0,0,1,1])
seq.unshiftMultiple(2, 4)
```

After calling this operation, the sequence is [2, 2, 2, 2 0, 0, 1, 1]. 


```tsx
let seq = new Sequence.OneD([0,0,1,1])
seq.unshift(true)
```
In this case, the true is translated by the function as a 1 and then pushed to the front of the sequence [1, 0, 0, 1, 1]. 





