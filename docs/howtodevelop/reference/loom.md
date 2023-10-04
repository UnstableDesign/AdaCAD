---
sidebar_position: 4
---
# Loom 

A loom simply holds information about the threading, tieup and treadling that can be used to generate a particular drawdown. `threading` is an array the same size as there are numbers of warps. Each value in the array is a number, corresponding to the frame upon which this warp will be threaded through. The indexing for the threading begins at 0 and increases to support the total number of frames required. `treadling` is an array the same size as there are numbers of wefts. Each value in the array is a number, corresponding to the treadle to press. The indexing for the threading begins at 0 and increases to support the total treadles of frames required. The `tieup` is a 2D array of boolean values representing if the treadle in the column is tied to the row corresponding to the frame. 

```jsx title="src/app/core/model/datatypes.js"
export type Loom = {
  threading: Array<number>,
  tieup: Array<Array<boolean>>,
  treadling: Array<Array<number>>
}

```
There are a number of helper features to assist in easily getting, setting, and reading loom values in a file located at: [src/app/core/model/loom.js](https://github.com/UnstableDesign/AdaCAD/blob/main/src/app/core/model/loom.ts)


# LoomUtil
The loom util stores specific functions that can translate a drawdown to a loom, or vice versa. Different types of looms have different functions and methods for recomputing. 


```jsx title="src/app/core/model/datatypes.js"
export type LoomUtil = {
  type: 'jacquard' | 'frame' | 'direct',
  displayname: string,
  dx: string,
  computeLoomFromDrawdown: (d:Drawdown, loom_settings: LoomSettings, origin: number) => Promise<Loom>,
  computeDrawdownFromLoom: (l:Loom, origin: number) => Promise<Drawdown>,
  recomputeLoomFromThreadingAndDrawdown:(l:Loom, loom_settings: LoomSettings, d: Drawdown, origin: number) => Promise<Loom>,
  updateThreading: (l: Loom, ndx: InterlacementVal) => Loom,
  updateTreadling: (l: Loom, ndx: InterlacementVal) => Loom,
  updateTieup: (l: Loom, ndx: InterlacementVal)=> Loom,
  insertIntoThreading: (l: Loom, j: number, val: number) => Loom,
  insertIntoTreadling: (l: Loom, i: number, val: Array<number>) => Loom,
  deleteFromThreading: (l: Loom, j: number) => Loom,
  deleteFromTreadling: (l: Loom, i: number) => Loom,
  pasteThreading: (l: Loom, drawdown: Drawdown, ndx: InterlacementVal, width:number, height: number) => Loom,
  pasteTreadling: (l: Loom, drawdown: Drawdown, ndx: InterlacementVal, width:number, height: number) => Loom,
  pasteTieup: (l: Loom, drawdown: Drawdown, ndx: InterlacementVal, width:number, height: number)=> Loom
}


```
# LoomSettings
This type stores the particular user-defined settings associated with any given loom. This includes the type of loom that this set of settings is associated with. The `epi` or density of the loom. The `units` by which densite is computed. It also holds the number of  `frames` and  `treadles` that the user describes their loom having. 


```jsx title="src/app/core/model/datatypes.js"

 export type LoomSettings = {
  type: string,
  epi: number,
  units: 'cm' | 'in',
  frames: number,
  treadles: number,
}
```
