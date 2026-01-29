# resize

repeats or cuts the current sequence so that it is of a specified length. 

## Parameters
- A number representing the size to make the sequence

## Returns
the current Sequence.OneD object


## Implementation

```tsx
let seq = new Sequence.OneD([0,0,1,1])
seq.resize(10)
```

After calling resize, the sequence would be [0, 0, 1, 1, 0, 0, 1, 1, 0, 0]. 


```tsx
let seq = new Sequence.OneD([0,0,1,1])
seq.resize(3)
```

After calling resize, the sequence would be [0, 0, 1]. 


