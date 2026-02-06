# padTo

This function will add the numeric value representing the unset heddle (e.g. 2), to a sequence to make it a specified size. If the sequence is larger than the size specified, it will do nothing. 

## Parameters
- A number representing the size to make the sequence


## Returns
the current Sequence.OneD object

## Implementation

```tsx
let seq = new Sequence.OneD([0,0,1,1])
seq.padTo(10)
```

After calling this operation, the sequence is [0, 0, 1, 1, 2, 2, 2, 2, 2, 2]. 


```tsx
let seq = new Sequence.OneD([0,0,1,1])
seq.padTo(2)
```
In this case, the true is translated by the function as a 1 and then pushed to the back of the sequence, resulting in [0, 0, 1, 1]. 



