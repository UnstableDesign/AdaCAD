[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/datatypes](../README.md) / YarnCell

# Type Alias: YarnCell

> **YarnCell** = `number`

Defined in: objects/datatypes.ts:603

a yarn cell holds a binary value representing the direction of the weft yarn through the cell. 
the binary is organized as NESW and has a 0 if no yarn is at that point, or 1 if there is a yarn at that point
for example. 0101 is a weft yarn that travels through the cell, 1100 is a weft yarn that comes in the east (right) size and curves, existing the bottom edge of teh cell
