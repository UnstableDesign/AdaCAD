# Operations

AdaCAD offers over 50 [operations](../glossary/operation) that you can build into [dataflows](../glossary/dataflow) to generate drafts. This page groups operations by their function, previews their design, and links to the full details of each operation (which you can also find on the left sidebar).
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
 | -------- | ------- | 
| [all possible structures](./operations/combos) | ![file](./img/combos.png) |  
| [complex twill](./operations/complextwill) | ![file](./img/complextwill.png) | 
| [glitch satin](./operations/glitchsatin) | ![file](./img/glitchsatin.png) |  
| [random](./operations/random) | ![file](./img/random.png) |  
| [satin](./operations/satin) |![file](./img/satin.png) |  
| [satin-ish](./operations/satinish) | ![file](./img/satinish.png) |  
| [sawtooth](./operations/sawtooth) | ![file](./img/sawtooth.png) |  
| [shaded_satin](./operations/shaded_satin) | ![file](./img/shaded_satin.png) |  
| [sine wave sampler](./operations/sine) | ![file](./img/sine.png) |  
| [tabby](./operations/tabbyder) | ![file](./img/tabbyder.png) |  
| [twill](./operations/twill) | ![file](./img/twill.png) |  
| [waffle](./operations/waffle) | ![file](./img/waffle.png) |  
| [waffle-ish](./operations/waffleish) | ![file](./img/waffleish.png)|  
| [undulating twill](./operations/undulatingtwill) | ![file](./img/undulatingtwill.png) |  
| [upload draft](./operations/bwimagemap) | ![file](./img/bwimagemap.png) |  


## Transformation 
Transformation operations take an input structure or draft and transforms it in some way.

| operation name  | examples |
 | -------- | ------- | 
| [invert](./operations/invert) | ![file](./img/invert.png) |  
| [flip](./operations/flip) | ![file](./img/flip.png) |  
| [shift](./operations/shift) | ![file](./img/shift.png)|  
| [rotate](./operations/rotate) | ![file](./img/rotate.png) |  
| [make symmetric](./operations/makesymmetric) | ![file](./img/makesymmetric.png) |  
| [slope](./operations/slope) | ![file](./img/slope.png) |  
| [stretch](./operations/stretch) | ![file](./img/stretch.png)|  
| [clear](./operations/clear) | ![file](./img/clear.png)|  
| [set unset interlacements to](./operations/set_unset) | ![file](./img/set_unset.png) |  
| [set interlacements of type to unset ](./operations/set_down_to_unset) | ![file](./img/set_down_to_unset.png) |  
| [crop](./operations/crop) | ![file](./img/crop.png) |  
| [trim](./operations/trim) | ![file](./img/trim.png) |  
| [margin](./operations/margin) | ![file](./img/margin.png)|  
| [undulate wefts](./operations/undulatewefts) | ![file](./img/undulatewefts.png) |  
| [undulate warps](./operations/undulatewarps) | ![file](./img/undulatewarps.png) |  


## Cloth 
Cloth Operations describe the arrangements of pattern regions in an overall draft or cloth. Regions defined by the cloth design parameters can be filled with input drafts. 

 | operation name  | examples |
 | -------- | ------- | 
| [rectangle](./operations/rectangle) | ![file](./img/rectangle.png) |  
| [tile](./operations/tile) | ![file](./img/tile.png) |  
| [chaos sequence](./operations/chaos) | ![file](./img/chaos.png)|  
| [pattern across warp](./operations/warp_profile) | ![file](./img/warp_profile.png) |  
| [pattern across weft](./operations/weft_profile) | ![file](./img/weft_profile.png) |  
| [variable width sampler](./operations/sample_width) | ![file](./img/sample_width.png)|  
| [variable length sampler](./operations/sample_length) | ![file](./img/sample_length.png) |  
| [fill](./operations/fill) | ![file](./img/fill.png) |  
| [image map](./operations/imagemap) | ![file](./img/imagemap.png) |  
| [join left](./operations/join_left) | ![file](./img/join_left.png) |  
| [join top](./operations/join_top) | ![file](./img/join_top.png) |  

## Compound
Compound operations support joining different structural elements together compound weave structures characterized by the use of multiple weft and warp systems and/or layers.

 | operation name  | examples |
 | -------- | ------- | 
| [interlace wefts](./operations/interlace) | ![file](./img/interlace.png) |  
| [interlace warps](./operations/interlacewarps) | ![file](./img/interlacewarps.png) |  
| [overlay multiple](./operations/overlay_multiple) | ![file](./img/overlay_multiple.png) |  
| [splice in wefts](./operations/splice_in_wefts) | ![file](./img/splice_in_wefts.png) |  
| [splice in warps](./operations/splice_in_warps) | <!--![file](./img/.png)--> |  
| [layer](./operations/layer) | <!--![file](./img/.png)--> |  
| [layer notation](./operations/notation) | <!--![file](./img/.png)--> |  
| [assign draft to system](./operations/assign_systems) | <!--![file](./img/.png)--> |  

## Dissect
Describes operations that split apart a single input draft into multiple outputs according to some criteria.

 | operation name  | examples |
| -------- | ------- | 
| [deinterlace](./operations/deinterlace") | <!--![file](./img/.png)--> |  


## Compute
Computer operations apply different forms of computational, binary, and/or mathematical functions to the production and modification of drafts.

 | operation name  | examples |
 | -------- | ------- | 
| [set atop, (a, b) => b](./operations/atop) | <!--![file](./img/.png)--> |  
| [overlay, (a,b) => (a OR b)](./operations/overlay) | <!--![file](./img/.png)--> |  
| [mask, (a,b) => (a AND b)](./operations/mask) | <!--![file](./img/.png)--> |  
| [cut, (a, b) => (a NAND b)](./operations/cutout) | <!--![file](./img/.png)--> |  
| [diff, (a, b) => (a NEQ b)](./operations/diff) | <!--![file](./img/.png)--> |  

## Helper
Operations that automate common drafting techniques to ensure good woven and cloth structure.

 | operation name  | examples |
 | -------- | ------- | 
| [selvedge](./operations/selvedge) | <!--![file](./img/.png)--> |  
| [bind weft floats](./operations/bind_weft_floats) | <!--![file](./img/.png)--> |  
| [bind warp floats](./operations/bind_warp_floats) | <!--![file](./img/.png)--> |  


## Color Effects
Supports the specification of materials in order to describe different color effects on the woven cloth

 | operation name  | examples |
 | -------- | ------- | 
| [set materials and systems](./operations/apply_materials) | <!--![file](./img/.png)--> |  
| [set weft materials](./operations/apply_weft_materials) | <!--![file](./img/.png)--> |  
| [set warp materials](./operations/apply_warp_materials) | <!--![file](./img/.png)--> |  


## Drafting Styles
Supports the conversion of one style of drafting to another, based on the requirements of specific equipment


 | operation name  | examples |
 | -------- | ------- | 
| [generate floor loom threading and treadling](./operations/floor_loom) | <!--![file](./img/.png)--> |  
| [generate direct tie loom threading and lift plan](./operations/direct_loom) | <!--![file](./img/.png)--> |  
| [make drawdown from threading, tieup, and treadling](./operations/drawdown) | <!--![file](./img/.png)--> |  
| [make drawdown from threading and lift plan](./operations/directdrawdown") | <!--![file](./img/.png)--> |  