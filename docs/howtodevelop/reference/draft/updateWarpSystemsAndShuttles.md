# updateWarpSystemsAndShuttles
This function takes the `colShuttleMapping` and `colSystemMapping` from one draft, and copies it into another draft. As it does so, it trims or repeats the array to match the size of the destination draft.  

## Parameters

- to: [Draft](draft)
- from: [Draft](draft)


## Returns
[Draft](draft)



## Implementation

```
d = updateWarpSystemsAndShuttles(d_to, d_from);
```

This function will copy the information from d_from into d_to and then return the modified d_to draft. 

