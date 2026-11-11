---
title: cellular automata
sidebar_label: cellular automata
sidebar_class_name: transformation opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/cellular_automata/cellular_automata.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='cellular_automata' />

A cellular automaton is a rule applied to a grid over a period of time. The same grid can be read as both a weaving drawdown and as the automata's state on a certain timestep. Each cell in the grid has one of two possible states, represented by a binary value of 0 or 1. These values correspond to both a weaving interlacement and to the two states used in cellular automata. In cellular automata terminology, these two states are conventionally called dead and alive. The operation uses these binary values to determine how each cell changes over successive iterations.

|**Drawdown cell**|**Weaving structure**|**Cellular automata state**|**Binary value**|
|---|---|---|---|
|White|Warp lowered; weft passes over warp|Dead|0|
|Black|Warp raised; weft passes under warp|Alive|1|

The automaton rule describes how the grid changes on successive iterations. For each cell, the rule looks at the states of a set of surrounding cells called the neighborhood. For this implementation, we use the Moore neighborhood - that is to say, the rule calculates the state of a cell on its next iteration by looking at the values of the cells immediately adjacent and immediately diagonal. 

<!--\<INSERT DIAGRAM OF WHAT THE MOORE NEIGHBORHOOD LOOKS LIKE HERE\>-->

## Automata Rules
A rule could involve many different ways of parsing the values of neighboring cells, but here we simply sum up all of their values. A white or dead cell is a zero, and a black or live cell is a one, so the sum is the number of living cells in the neighborhood. 

The rulestring describes the rule and is separated into two sections delineated by a slash; the first starts with a 'B', which stands for 'born', and the second starts with 'S', which stands for 'survive'. The list of numbers following the 'B' indicates which sum values are required for a cell to be born, and the list of numbers following the 'S' indicates which sum values are required for a cell to survive. For example, consider the following rulestring, 'B3/S23', more commonly called Conway's Game of Life. If the cell is currently white, or dead, then the sum must be 3 for the cell to be born or come alive on the next iteration. Likewise, if the cell is currently black, or alive, then the sum must be 2 or 3 for the cell to survive to the next iteration. 

<!--\<INSERT VISUAL EXAMPLE OF RULE APPLICATION FOR CGOL HERE\>-->

### Sample Rulesets
| **Rule name**          | **B/S rulestring** |
| ------------------ | -------------- |
| 2×2                | B36/S125       |
| 34 Life            | B34/S34        |
| Amoeba             | B357/S1358     |
| Assimilation       | B4567/S345     |
| Bacteria           | B34/S456       |
| Blinkers           | B345/S2        |
| Bugs               | B3567/S15678   |
| Coagulations       | B378/S235678   |
| Coral              | B3/S45678      |
| Day and Night      | B3678/S34678   |
| Diamoeba           | B35678/S5678   |
| Flakes             | B3/S12345678   |
| Game of Life       | B3/S23         |
| Gnarl              | B1/S1          |
| HighLife           | B36/S23        |
| Holstein           | B4678/S35678   |
| H-trees            | B12345678/S1   |
| Iceballs           | B5678/S25678   |
| Land Rush          | B234578/S36    |
| Life Without Death | B12345678/S3   |
| Long Life          | B345/S5        |
| Majority           | B5678/S45678   |
| Maze               | B12345/S3      |
| Mazectric          | B3/S1234       |
| Move               | B368/S245      |
| Pseudo Life        | B357/S238      |
| Replicator         | B1357/S1357    |
| Seeds              | B2/S           |
| Serviettes         | B/S234         |
| Slow Blob          | B367/S125678   |
| Stains             | B3678/S235678  |
| Walled Cities      | B45678/S2345   |

## Problem Solving Guide
1. **Automata feature produced a blank draft (immediately killed)** - Some rules and starting configurations cause all cells in a draft to become dead after one or more iterations. This can happen when the rule does not allow enough cells to be born or survive, or when the starting draft lacks clusters of live cells that can sustain one another. Smaller grid sizes can also limit the room patterns have to develop. Try starting with larger clusters of black cells or choosing a rulestring with more opportunities for cells to be born or survive.

2. **Automata feature has resulted in a repeating pattern** - Some cellular automata rules produce patterns that eventually settle into a stable state or begin repeating after a certain number of iterations. This is expected behavior and does not necessarily mean the automata has stopped working. Try introducing more variation into the starting draft, such as breaking up symmetrical clusters or adding and removing a few cells, or experiment with a different rulestring.

3. **Automata feature has failed to result in any interesting patterns** - The patterns produced by cellular automata depend on both the starting draft and the rulestring being used. A very uniform or densely filled starting draft may limit variation, while rules with restrictive birth or survival conditions may produce little change or cause patterns to die out. Try using a starting draft with a mixture of live and dead cells, varied cluster sizes, and irregular gaps. You can also adjust the rulestring based on what you observe: if there are too few live cells, try allowing birth with fewer live neighbors; if patterns disappear quickly, try allowing cells to survive under a wider range of neighborhood conditions. The example rulestrings can be a useful starting point for exploring different behaviors.

## Parameters
- `timestep`: the number of iterations that the rule defined by the rulestring is applied.
- `edge wrapping mode`: determines what value is used for cells that are outside the draft, the edge-cases, when calculating the next iteration. Wrapped will use the cell value on the opposite side of the grid, fixed live will always use a live value (1), and fixed dead will always use a dead value (0).
- `rulestring`: the rule that is applied to the grid on each timestep to calculate the next generation. The rule should be in birth/survival notation using the Moore neighborhood, eg listed values of no more than 9. 


## Application
No specific application but can be used to generate new structures from or different variations of an input draft. Can form intricate geometric patterns that have lifelike behavior over time.

## Developer
adacad id: `cellular_automata`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/cellular_automata/cellular_automata.ts
```
