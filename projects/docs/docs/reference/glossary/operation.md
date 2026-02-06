# Operation
Operations are little computational machines that take drafts as inputs, do something to them, and then spit them out as new and different, drafts. An operation consists of several parts:  [inlet(s)](inlet), [parameters](parameter), and a resulting [draft](draft) with an [outlet](outlet). Chaining operations together creates a [dataflow](./dataflow.md) 


## Understanding Operations
You can think of AdaCAD Operations as guitar effects pedals. Just as a guitar effects pedal takes a sound signal into an input port, modifies it based on the value of the knobs and the internal hardware of the pedal, and outputs the modified sound via the output port, operations in AdaCAD take drafts into their ["inlets"](../../reference/glossary/inlet.md), modify those drafts according to the operation's code and user specified [parameters](../../reference/glossary/parameter.md) and outputs the modified draft via the ["outlet"](../../reference/glossary/outlet.md). And just as multiple guitar pedals can be chained together to further augment the sound, AdaCAD operations can be chained together to further augment the drafts. 
![file](../../reference/glossary/img/concept.png)


The figure below shows how this interaction takes place within the AdaCAD workspace with the <OpLink name="stretch"/>. The stretch operation pictured below receives the input draft into it's inlet. The user then changes  "warp-repeats" and "weft-repeats" [parameters](../../reference/glossary/parameter.md) to indicate the number of time they want each warp end and weft pic to be repeated. When the value of the parameter changes, AdaCAD update the output draft.  
![file](../../reference/glossary/img/concept_2.png)



## Kinds of Operations
AdaCAD currently offers over 60 different operations. You can explore every operation by vising [Reference->Operations(A-Z)](../../reference/operations/index.md) in the sidebar on the left of the page. Operations are organized into different categories based on their typical use within a drafting process. These categories are also color-coded on the interface. 

- [**Structure (Orange)**](../../reference/operations/index.md#structure) Operations: such as <OpLink name="tabby"/>,  <OpLink name="twill"/> generate structures that obey the rules of a given family.
- [**Transformation (Tan)**](../../reference/operations/index.md#transformation) Operations: such as <OpLink name="invert"/>,  <OpLink name="shift"/>, and  <OpLink name="makesymmetric"/> modify an input draft according to the specific rules of the transformation applied. 
- [**Cloth (Dark Green)**](../../reference/operations/index.md#cloth) Operations: such as  <OpLink name="rectangle"/>,  <OpLink name="tile"/>, and  <OpLink name="imagemap"/> are intended to be used to arrange and/or repeat different structures across the surface of a cloth. 
- [**Compound (Bright Green)**](../../reference/operations/index.md#compound) Operations: such as  <OpLink name="interlace"/>,  <OpLink name="assign_systems"/>, and <OpLink name="splice_in_wefts"/> support joining different structural elements together into compound weave structures characterized by the use of multiple weft and warp systems and/or layers.
- [**Dissect (Blue)**](../../reference/operations/index.md#dissect) Operations: such as <OpLink name="deinterlace"/>, split a single draft into multiple drafts according to some criteria. 
- [**Compute (Deep Violet)**](../../reference/operations/index.md#compute) Operations: such as <OpLink name="overlay"/> and  <OpLink name="mask"/>, apply different forms of computational, binary, and/or mathematical functions to the modification of drafts. 
- [**Helper (Violet)**](../../reference/operations/index.md#helper) Operations: such as <OpLink name="selvedge"/> automate common drafting techniques to ensure good woven and cloth structure.
- [**Color Effects (Magenta)**](../../reference/operations/index.md#color-effects) Operations: such as <OpLink name="apply_weft_materials"/> allow you to specify materials in order to describe different color effects on the woven cloth
- [**Drafting Styles (Camel)**](../../reference/operations/index.md#drafting-styles) Operations: such as <OpLink name="floor_loom"/> allow you to convert of one style of drafting to another, based on the requirements of specific equipment


## Understanding the Parts of an Operation


![file](./img/operation_anatomy.png)

### Inlets
Inlets allow you to add drafts to an operation, so they can be modified according to the operations [parameters](./parameter.md) and code. You connect a draft to an inlet by clicking the [outlet](./outlet.md) of one node and connecting it to the [inlet](./inlet.md) of an operation. Some operations have 

### Parameters
Under the name of the operation, in this case <OpLink name="apply_materials"/> there is a list of [parameters](parameter) that are provided to the operation to inform the draft it will create. 

### Output Draft
Under the parameters, you can see the [draft](draft) that is generated by this operation. 

### Outlet
If you want to use this [draft](draft) as the input of another operation you can connect its [outlet](outlet), shown here, to the [inlet](inlet) of a different operation to make a connection. You can connect a single outlet to multiple inlets. To make a connection, you click on the outlet first, then click on the inlet you want it connected to. 

<!-- ![file](./imgconnection.gif) -->
