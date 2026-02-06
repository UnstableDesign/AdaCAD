# Drawdown

The drawdown type refers to the 2D array used to store the cells that make up the draft pattern or drawdown. The drawdown is used as the primary representation of cloth structure within a draft in AdaCAD. 

The drawdown is indexed with (0,0) representing the origin of the draft. In many cases, such as when operations are performed, the origin is first translated to the top left, changes are made, and then it is rotated back after the computation. This means that when you are indexing into the Array (0,0) or drawdown[0][0] you are referencing the first weft pick on the first warp end. 


```jsx title="src/app/core/model/datatypes.js"
export type Drawdown = Array<Array<Cell>>;

```

## Related Functions

- [warps](./warps.md)
- [wefts](./wefts.md)
- [hasCell](./hasCell.md)
- [isUp](./isUp.md)
- [setCellValue](./setCellValue.md)