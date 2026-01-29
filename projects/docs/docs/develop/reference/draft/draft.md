# Draft
In AdaCAD, a draft is a container for  a drawdown as well as information that can be used to interpret the drawdown. 

Each draft is assigned a unique ID `id`, and will automatically get a name based on the operations that produced the draft. The generated name is stored in the variable `gen_name`. If a user defines a custom name for the draft, it is stored in the variable `ud_draft`. The drawdown `drawdown` contains a [drawdown](../drawdown/drawdown.md) object (which contains all the information about heddle lifts and lowers that one would typically find in a drawdown). 

`rowShuttleMapping` and `colShuttleMapping` link each pick and end to a material id. The size of the array will be the same as the number or wefts and warps (respectively), and will store a number, corresponding to the ID of the shuttle (aka material) being used in that weft or warp. The materials (which are called shuttles, strangely, in the code) and their ids are stored in the MaterialsService: [/core/provider/materials.service.ts](https://github.com/UnstableDesign/AdaCAD/blob/main/src/app/core/provider/materials.service.ts)

`rowSystemMapping` and `colSystemMapping` refer to the systems assigned to each warp (col) and weft (row). The size of the array will be the same as the number or wefts and warps (respectively), and will store a number, corresponding to the ID of the system assigned to that weft or warp. The  list of systems and their ids can be found in the SystemsService: [/core/provider/systems.service.ts](https://github.com/UnstableDesign/AdaCAD/blob/main/src/app/core/provider/systems.service.ts)




```jsx title="src/app/core/model/datatypes.js"
export interface Draft{
  id: number,
  gen_name: string,
  ud_name: string,
  drawdown: Drawdown,
  rowShuttleMapping: Array<number>,
  rowSystemMapping: Array<number>,
  colShuttleMapping: Array<number>,
  colSystemMapping: Array<number>,
}

```

There are a number of helper features to assist in easily getting, setting, and reading cell values in a file located at: [/core/model/drafts.js](https://github.com/UnstableDesign/AdaCAD/blob/main/src/app/core/model/drafts.ts)


## Related Functions

- [initDraft](./initDraft.md)
- [initDraftWithParams](./initDraftWithParams.md)
- [initDraftFromDrawdown](./initDraftFromDrawdown.md)
- [copyDraft](./copyDraft.md)
- [updateWeftSystemsAndShuttles](./updateWeftSystemsAndShuttles.md)
- [updateWarpSystemsAndShuttles](./updateWarpSystemsAndShuttles.md)