
## Parameters

- `pattern` - this sequence of text determines the inlets will be created, and thus, the drafts that can be assigned to different warp and weft systems on different layers. The format for this text should follow the format of [layer notation](../../glossary/layer-notation/).

## Inlets

- `systems draft` - the draft connected to this inlet serves as a template of your warp and weft systems. For example, if you want your draft to have two weft systems that alternate (say a and b) and two warp systems that alternate (say 1 and 2), you might create, and then connect, the following draft to this inlet. This inlet does not look at the drawdown, it only looks at the warp and weft system and materials. 

![file](./notation_systemsdraft.png)

You can define your warp and weft systems in any sequence or order that you like. 

## Dynamic Inlets
This operation will create an inlet for each layer / () group in the pattern sequence. By connecting a draft to that inlet, you can assign the draft to the layer. 


## Application
This is used to create different structures, with different layer relationships, across an entire cloth. It becomes especially powerful with one changes layer numbers. For example (a1b2)(c2) will place the first layer across two systems, and the second layer across one system. This means that one can arbitrary change both layer order, as well as the association of different warp and weft systems to different layers across different regions of the cloth.

## Developer
adacad id: `notation`
