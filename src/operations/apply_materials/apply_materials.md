
## Parameters
- `warp colors shift` - can be used to shift the starting point of the repeating color pattern along the warp
- `weft colors shift` - can be used to shift the starting point of the repeating color pattern along the weft
- `warp systems shift` - can be used to shift the starting point of the repeating warp-system pattern
- `weft systems shift` - can be used to shift the starting point of the repeating weft-system pattern

## Inlets
- `draft` - the draft to which colors and systems information should be applied
- `systems & materials` - the draft from which color and system information should be copied.  

:::info
The `systems & materials` draft does not need to be the same size as the draft it is being copied to. Instead, the pattern indicated by the `systems & materials` draft will be repeated across the draft to which colors are being assigned. 
:::

## Application
Complex weavers often generate structures that consider each warp and weft as a logical system that will behave differently in different regions of the cloth. Thus, some operations, like <OpLink="notation"/>, require systems to be specified in order to compute complex structures that obey the systems of warps and wefts over the cloth. Applying materials allows one to visualize the relationship between the draft and the color effects visible on the cloth's surface.

## Additional Reading
If you'd like to learn more about how to add/edit system and material information to drafts, you can find instructions on the [materials](../../glossary/material.md) and [system](../../glossary/system.md) glossary pages. 

## Developer
adacad id: `apply materials`
