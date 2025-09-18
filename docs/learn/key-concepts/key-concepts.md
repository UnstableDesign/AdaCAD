---
sidebar_position: 2
---

# Key Concepts

## Parametric Design
AdaCAD takes a ['parametric design'](https://en.wikipedia.org/wiki/Parametric_design) approach to creating woven structures and drafts. 

Parametric design is an approach that asks the designer to explicitly describe a design in terms of a set of rules and relationships that the design should obey. Our approach takes specific inspiration from other parametric design tools such as [MaxMSP](https://cycling74.com/) (parametric design for sound) and [Grasshopper for Rhino](https://www.rhino3d.com/learn/?query=kind:%20grasshopper&modal=null) (parametric design for objects/forms). While parametric design takes a minute to understand and adopt, it can reduce the effort required to make changes, edits, or just playfully explore a design space within a range of user-specified options. 


To specify these relation and generate drafts in AdaCAD, a designer creates a [dataflow](../../reference/glossary/dataflow) made up of both [drafts](/docs/reference/glossary/draft.md) and [operations]( /docs/reference/operations/). An operation takes a draft as input, manipulates it according to it's internal rules and user defined parameters, and returns a modified draft. Multiple drafts and operations can be chained together to create drafts of increasing complexity.


[View a longer explanation...](docs/reference/glossary/parametric-design.md)



## Dataflow
![file](../../reference/glossary/img/connection.gif)
We use the term dataflow to describe a chain of [drafts](/docs/reference/glossary/draft.md) and [operations](/docs/reference/operations/) that manipulate and generate new drafts. 
If any node in the dataflow is changed, those changes propagate through the whole chain of connections, leading to changed results. 

Dataflows are created when drafts and operations are connected together by selecting the [outlet](../../reference/glossary/outlet) of a draft and connecting it to an [inlet](../../reference/glossary/inlet) of an operation. 


[View a longer explanation...](/docs/reference/glossary/dataflow.md)

## System

In this context, we use the term `system` to describe groupings of warps (e.g. warp systems) or wefts (e.g. weft systems) that will form specific design relationships. For example, it is common to think of multi-layer weaves as working by interlacing certain wefts upon certain warp systems and then lifting those systems out of the way to create "layered" structures. In another case, you might think of a double sided twill operating of two weft systems, one that will weave on the weft-facing side of the warp and the other on the warp-facing side. 
[View a longer explanation...](/docs/reference/glossary/system.md)

## Layer Notation

Layer notation emerged in conversation with [Kathryn Walters](https://www.kmwalters.com/pattern), who wanted AdaCAD to help her manage complex structures that could arbitrarily map warp and weft systems to different layers, layer orders, or even different numbers of layers (e.g. a structure that goes from 2 to 4 to 3 layers for instance.) Beyond her immediate needs, we found it to be a useful system for describing the relationship between different cloth layers. 

Layer notation essentially describes the behavior of layers in a cloth independent of the structures that will be mapped onto the layers. Put another way, it is a way or organizing weft and warp systems so that they bind into layers in specific ways. 


[View a longer explanation...](/docs/reference/glossary/layer-notation.md)
