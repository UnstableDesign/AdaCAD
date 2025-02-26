# Operations
<div class="emph">
AdaCAD offers over 50 [operations](../glossary/operation.md) that you can build into [dataflows](../glossary/dataflow.md) to generate drafts. This page groups operations by their function, previews their design, and links to the full details of each operation (which you can also find on the left sidebar).
</div>
<!-- consider sets: 
basic / advanced
synth
profile drafting
floor and shaft loom
imagery
sampling
compound/complex -->


## Structure 

A weave structure is the order or pattern of interlacement between the warp and weft threads. There are different families of woven structure that share core properties, such as plain weave, twill, and satin. Each of the operations is capable of generating structures that obey the rules of a given family. 

 | operation name  | examples |
 | ------- | ------- | 
| [all possible structures](./combos) | ![file](./img/combos.png) |  
| [complex twill](./complextwill) | ![file](./img/complextwill.png) | 
| [glitch satin](./glitchsatin) | ![file](./img/glitchsatin.png) |  
| [random](./random) | ![file](./img/random.png) |  
| [satin](./satin) |![file](./img/satin.png) |  
| [satin-ish](./satinish) | ![file](./img/satinish.png) |  
| [sawtooth](./sawtooth) | ![file](./img/sawtooth.png) |  
| [shaded_satin](./shaded_satin) | ![file](./img/shaded_satin.png) |  
| [sine wave sampler](./sine) | ![file](./img/sine.png) |  
| [tabby](./tabbyder) | ![file](./img/tabbyder.png) |  
| [twill](./twill) | ![file](./img/twill.png) |  
| [waffle](./waffle) | ![file](./img/waffle.png) |  
| [waffle-ish](./waffleish) | ![file](./img/waffleish.png)|  
| [undulating twill](./undulatingtwill) | ![file](./img/undulatingtwill.png) |  
| [upload draft](./bwimagemap) | ![file](./img/bwimagemap.png) |  


## Transformation 
Transformation operations take an input structure or draft and transforms it in some way.

| operation name  | examples |
 | -------- | ------- | 
| [invert](./invert) | ![file](./img/invert.png) |  
| [flip](./flip) | ![file](./img/flip.png) |  
| [shift](./shift) | ![file](./img/shift.png)|  
| [rotate](./rotate) | ![file](./img/rotate.png) |  
| [make symmetric](./makesymmetric) | ![file](./img/makesymmetric.png) |  
| [slope](./slope) | ![file](./img/slope.png) |  
| [stretch](./stretch) | ![file](./img/stretch.png)|  
| [clear](./clear) | ![file](./img/clear.png)|  
| [set unset interlacements to](./set_unset) | ![file](./img/set_unset.png) |  
| [set interlacements of type to unset ](./set_down_to_unset) | ![file](./img/set_down_to_unset.png) |  
| [crop](./crop) | ![file](./img/crop.png) |  
| [trim](./trim) | ![file](./img/trim.png) |  
| [margin](./margin) | ![file](./img/margin.png)|  
| [undulate wefts](./undulatewefts) | ![file](./img/undulatewefts.png) |  
| [undulate warps](./undulatewarps) | ![file](./img/undulatewarps.png) |  


## Cloth 
Cloth Operations describe the arrangements of pattern regions in an overall draft or cloth. Regions defined by the cloth design parameters can be filled with input drafts. 

 | operation name  | examples |
 | -------- | ------- | 
| [rectangle](./rectangle) | ![file](./img/rectangle.png) |  
| [tile](./tile) | ![file](./img/tile.png) |  
| [chaos sequence](./chaos) | ![file](./img/chaos.png)|  
| [pattern across warp](./warp_profile) | ![file](./img/warp_profile.png) |  
| [pattern across weft](./weft_profile) | ![file](./img/weft_profile.png) |  
| [variable width sampler](./sample_width) | ![file](./img/sample_width.png)|  
| [variable length sampler](./sample_length) | ![file](./img/sample_length.png) |  
| [fill](./fill) | ![file](./img/fill.png) |  
| [image map](./imagemap) | ![file](./img/imagemap.png) |  
| [join left](./join_left) | ![file](./img/join_left.png) |  
| [join top](./join_top) | ![file](./img/join_top.png) |  

## Compound
Compound operations support joining different structural elements together compound weave structures characterized by the use of multiple weft and warp systems and/or layers.

 | operation name  | examples |
 | -------- | ------- | 
| [interlace wefts](./interlace) | ![file](./img/interlace.png) |  
| [interlace warps](./interlacewarps) | ![file](./img/interlacewarps.png) |  
| [overlay multiple](./overlay_multiple) | ![file](./img/overlay_multiple.png) |  
| [splice in wefts](./splice_in_wefts) | ![file](./img/splice_in_wefts.png) |  
| [splice in warps](./splice_in_warps) | ![file](./img/splice_in_warps.png)|  
| [layer](./layer) | ![file](./img/layer.png) |  
| [layer notation](./notation) | ![file](./img/notation.png) |  
| [assign draft to system](./assign_systems) | ![file](./img/assign_systems.png) |  

## Dissect
Describes operations that split apart a single input draft into multiple outputs according to some criteria.

 | operation name  | examples |
| -------- | ------- | 
| [deinterlace wefts](./deinterlace) | ![file](./img/deinterlace.png) |  


## Compute
Computer operations apply different forms of computational, binary, and/or mathematical functions to the production and modification of drafts.

 | operation name  | examples |
 | -------- | ------- | 
| [set atop, (a, b) => b](./atop) | ![file](./img/atop.png) |  
| [overlay, (a,b) => (a OR b)](./overlay) | ![file](./img/overlay.png) |  
| [mask, (a,b) => (a AND b)](./mask) | ![file](./img/mask.png) |  
| [cut, (a, b) => (a NAND b)](./cutout) | ![file](./img/cutout.png) |  
| [diff, (a, b) => (a NEQ b)](./diff) | ![file](./img/diff.png) |  

## Helper
Operations that automate common drafting techniques to ensure good woven and cloth structure.

 | operation name  | examples |
 | -------- | ------- | 
| [selvedge](./selvedge) | ![file](./img/selvedge.png) |  
<!-- | [bind weft floats](./bind_weft_floats) | ![file](./img/.png) |   -->
<!-- | [bind warp floats](./bind_warp_floats) | ![file](./img/.png) |   -->


## Color Effects
Supports the specification of materials in order to describe different color effects on the woven cloth

 | operation name  | examples |
 | -------- | ------- | 
| [set materials and systems](./apply_materials) | ![file](./img/apply_materials.png) |  
| [set weft materials](./apply_weft_materials) | ![file](./img/apply_weft_materials.png) |  
| [set warp materials](./apply_warp_materials) | ![file](./img/apply_warp_materials.png) |  


## Drafting Styles
Supports the conversion of one style of drafting to another, based on the requirements of specific equipment


 | operation name  | examples |
 | -------- | ------- | 
| [generate floor loom threading and treadling](./floor_loom) | ![file](./img/floor_loom.png) |  
| [generate direct tie loom threading and lift plan](./direct_loom) | ![file](./img/direct_loom.png) |  
| [make drawdown from threading, tieup, and treadling](./drawdown) | ![file](./img/drawdown.png) |  
| [make drawdown from threading and lift plan](./directdrawdown) | ![file](./img/directdrawdown.png) |  