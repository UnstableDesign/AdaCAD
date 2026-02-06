# Simulation

** IN PROGRESS **

## GOALS / REQUIREMENTS:
-  be able to create a structural simulation for any given draft that accurately anticipates how layers will form and separate without defining specific assignments of warp/weft systems to layers. 
- to handle and represent the variable packing of yarns in different locations of the cloth (to anticipate packing)


## APPROACH

Modeled off of [TopoKnit](https://arxiv.org/abs/2101.04560), the core of this simulation is based on the idea of where two yarns (a warp and a weft) will or will not contact each other in a woven cloth. While TopoKnit is specific to weft knitting, the approach inspired me to think about representing points of contact between yarns in a process oriented fashion. As such, I model the possible contact points based on a draft, refine them based on how layers will or will not form, and then "insert" each yarn into the visualization in the order in which it would be woven. This is compiled from a drawdown, to a list of contact neighborhoods (topology) -> then by translating those neighborhoods into vertices. 

## DRAFT -> CONTACT NEIGHBORHOODS
It begins by parsing a drawdown, represented as a 2D array of cells. No additional information needs to be supplied with the drawdown to explain if and how layers should form (e.g. it ignores system information when parsing). At each cell/interlacement (crossing point of a warp end and weft pick) the yarns can make contact in four different locations, depending on the pairwise relationship of draft instructions to the top/bottom/left/right of the cell representing the interlacement. 

To start, every interlacement/cell in the draft is populated by four contact neighborhoods. The value of these contact neighborhoods is set by the relationship of the cell to it's neighbor. All contact neighborhoods are initialized as Potentials (PCN's) to start. If the cell changes face (from back to front or vice-versa, the id/edge associated with that change it is considered an "Active" contact node or ACN). An Empty Contact Neighborhood (ECN) represents a place where there is no active weft. A virtual contact node is added in cases where we need render a warp or weft at full width. 

At this beginning stage, we may have more ACNs (places that represent a warp/weft contact) than needed because there are certain ACNs that suggest contact, but not interlacement (e.g. collections of warps/wefts that will separate into layer). So, first we determine which ACNS sit on which layers. 

## LAYER SEPARATION and SETTING layer VALUES ON ACNS
The layering of certain interlacements is achieved by created a list of all the floats (warp floats and weft floats) in the draft. Warp floats run vertically with face value of true, weft floats run horizontally with face value of false. Each float is defined by two ACNs representing it's left/right edges or top/bottom edges. We run an algorithm that starts by finding the longest warp and then virtually "lifting" that warp to see what other wefts would be lifted as a result. The extent of the lifting (how far away from the original float we also lift) by the simulation settings "lift-limit" parameter. Floats are lifted recursively and when they are lifted, their corresponding ACN's and ACN pairs are updated to reflect the current layer that is lifting (1 for top face, 2 for next layer down, and so on) and marked as "touched" meaning that it has already been visited and marked. The algorithm ends when all floats are marked "touched" or there are no more floats to lift. We then proceed to process the next layer starting with the longest remaining warp float, and lifting it, marking layers and so on. As we subsequently lift layers, we increase the lift-limit, acknowledging that multi-layer drafts will have more space between each related weft. This is a potential source of error, since wefts may be assigned to layers in non-regular sequences. We finish when there are no more floats to process. 



## TRANSLATING ACNS TO VERTICES

After this layer process concludes we will continue to have some CNS where the warp oriented CNs (id's 2 and 3 or top and bottom) and weft oriented CNs (id's 0 and 2 or left and right) will not be assigned the same layer. We will only create vertexes for ACNS where the warp and weft are on the same layer. 

We start by pruning the CNs into a separate list and then, on each CN, finding the previous valid ACN on the same layer that is closest to it. This will serve as a reference point for how the y will form. 

We then iterate through the list of valid acns for a given row, and create vertexes for each point. 

 




## Approaches that Didn't Work
Pairwise comparison of floats. Could not fully capture extent to weft crossings (example being second layer or 3 layer tabby). 

## comapring two paths and seeing where they intersect
Not all intersections will behave the same in "real" cloth. A few different draft profiles can create a wide variety of crossing patterns and no single route made this easy. Could be computationally expensive. 


## Warp/Weft Tuples
First approach storing id's (i, j) where two wefts or warps would cross. This left uncertainty in how warps would align to weft layers. This also requires that you set a boundary within which you search for layers so if you have some layers and some long floats, it can get very confused. 


# References

TopoKnit : A Process-Oriented Representation for Modeling the Topology of Yarns in Weft-Knitted Textiles
Levi Kapllani, Chelsea Amanatides, Genevieve Dion, Vadim Shapiro, David E. Breen
https://arxiv.org/abs/2101.04560
