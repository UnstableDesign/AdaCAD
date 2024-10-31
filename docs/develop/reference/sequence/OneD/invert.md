# invert

This function will invert the values of the sequence. This assumes that the numbers in the sequence correspond with 0 meaning heddle lowered and 1 meaning heddle lifted. So, this function flips 0 values to 1 and vice versa. It will leave values of 2 unchanged. 

## Parameters
- none


## Returns
the current Sequence.OneD object

## Implementation

```tsx
let seq = new Sequence.OneD([0,0,1,1])
seq.invert()
```

After calling this operation, the sequence is [1, 1, 0, 0]. 


```tsx
let seq = new Sequence.OneD([0,0,1,1, 2, 2])
seq.invert
```
After calling this operation, the sequence is [1, 1, 0, 0, 2, 2]. 


In the unlikely event you are storing other number in the sequence object (say, just to organize a sequence of any number), this function will convert any number that isn't 2 to 1 (if the value was 0), and 0, if the value was anything else. 
