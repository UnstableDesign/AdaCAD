# copyDraft

Copies a draft to a new draft object while retaining the old draft id. Functionally, this creates a deep copy of the input draft. 


## Parameters
The [Draft](./draft.md) you would like to copy

## Returns
[Draft](./draft.md)



## Implementation

```
const draft_copy: Draft = copyDraft(d: Draft);
```

