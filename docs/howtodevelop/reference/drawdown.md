---
sidebar_position: 3
---
# Drawdown

A drawdown is a type that just simply refers to the 2D array used to store the pattern that will be translated to the loom. The drawdown is used as the primary representation within a draft in AdaCAD. Different [Loom](./loom.md) objects can take a drawdown as input and create the corresponding threading, tieup and treadling required to produce that drawdown. 

The drawdown is indexed with (0,0) representing the origin of the draft. The origin is always translated to the top left before any function on the drawdown in computed, and then rotated back after the compuation. This means that when you are indexing into the Array (0,0) or drawdown[0][0] you are referencing the first pic on the end. 


```jsx title="src/app/core/model/datatypes.js"
export type Drawdown = Array<Array<Cell>>;

```
