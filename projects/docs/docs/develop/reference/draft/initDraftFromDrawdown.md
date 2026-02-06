# initDraftFromDrawdown
In many operations, you'll design the drawdown first, and then want to create a draft based on the data in that drawdown. 



## Parameters

[Drawdown](../drawdown/drawdown.md)


## Returns
[Draft](./draft.md)



## Implementation

```
const d: Drawdown = [[createCell(false)]];
const draft:Draft = initDraftFromDrawdown(d)
```

This function will generate a draft with warp and weft values equal to the size of the drawdown. In this case, we've made a drawdown that is composed of just one cell (false). So, this function will generate a draft with 1 ends and 1 pick. It will also create arrays of the appropriate size, and filled with default values, in `rowSystemMapping`, `colSystemMapping`, `rowShuttleMapping` and `colShuttleMapping`.


:::note

The same task can be achieved using the [initDraftWithParams](initDraftWithParams) function as follows:
```
const d: Drawdown = [[createCell(false)]];
const draft:Draft = initDraftWithParams({drawdown: d})
```

We added this function to support just a bit less typing! 


