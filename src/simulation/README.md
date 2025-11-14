# Simulation Approach


Modeled off of topo knit, the core of this simulation is based on the idea of where two yarns (a warp and a weft) will or will not contact each other. This is compiled from a drawdown, to a list of contact neighborhoods (topology) -> then by translating those neighborhoods into vertices. 

## DRAFT -> CONTACT NEIGHBORHOODS
It begins by parsing a drawdown, represented as a 2D array of cells. No additonal information needs to be supplied with teh drawdown to explain if and how layers should form (e.g. it ignores system information when parsing). At each cell/interlacement (crossing point of a warp end and weft pick) the yarns can make contact in four different locations, depending on the pairwise relationship of draft instructions to the top/bottom/left/right of the cell representing the interlacement. 

To start, every interlacement/cell in the draft is populated by four contact neighborhoods. The value of these contact neighborhoods is set by the relationship of the cell to it's neighbor. All contact neighborhoods are initialized as Potentials (PCN's) to start. If the cell changes face (from back to front or vice-versa, the id/edge associated with that change it is considered an "Active" contact node or ACN). An Empty Contact Neighborhood (ECN) represents a place where there is no active weft. A virtual contact node is added in cases where we need render a warp or weft at full width. 

At this beginning stage, we may have more ACNs (places that represent a warp/weft contact) than needed because there are certain ACNs that suggest contact, but not interlacement (e.g. collections of warps/wefts that will separate into layer). So, first we determine which ACNS sit on which layers. 

## LAYER SEPARATION and SETTING layer VALUES ON ACNS
The layering of certain interlacements is achieved by created a list of all the floats (warp floats and weft floats) in the draft. Warp floats run vertically with face value of true, weft floats run horizontally with face value of false. Each float is defined by two ACNs representing it's left/right edges or top/bottom edges. We run an algorithm that starts by finding the longest warp and then virtually "lifting" that warp to see what other wefts would be lifted as a result. The extent of the lifting (how far away from the original float we also lift) by the simulation settings "lift-limit" parameter. Floats are lifted recursively and when they are lifted, their corresponding ACN's and ACN pairs are updated to reflect the current layer that is lifting (1 for top face, 2 for next layer down, and so on) and marked as "touched" meaning that it has already been visited and marked. The algorithm ends when all floats are marked "touched" or there are no more floats to lift. We then proceed to process the next layer starting with the longest remaining warp float, and lifting it, marking layers and so on. As we subsequently lift layers, we increase the lift-limit, acknowledging that multi-layer drafts will have more space between each related weft. This is a potential source of error, since wefts may be assigned to layers in non-regular sequences. We finish when there are no more floats to process. 

After this layer process concludes we will continue to have some CNS where the warp oriented CNs (id's 2 and 3 or top and bottom) and weft oriented CNs (id's 0 and 2 or left and right) will not be assigned the same layer. We need to remove these ACNs this is not a binding point of contact between that weft and warp.


## TRANSLATING ACNS TO VERTICES

For every layer that was found, create a draft purely from the subset of ACNs that shared a warp and weft layer. Make sure that each cell in this subset draft points back to it's location in the original map. 

Start walking the wefts from row 0 to 1, pushing the vertexes to a path that goes left to right, right to left so for any given material. 

on row zero, get the layer. 
find any cells where the warp and weft oriented CNs both sit on that layer, if there is an ACN on that cell oriented weft wise, push it to create a new weft vertex. use the face value at that location to set the orientation.

set x according to the position of the warp +/- the warp material width (so it has a left/right sided-ness)
set z according to the layer 
set y according to the relationship between this weft and any previous wefts that have been added. 
    - to do this, trace the draft from the last vtx to this current vertex. find the closest previous vertex on this same layer and compute a replusion factor based on how close their Vertexes are to eachother. If they are the same, then stack the values. 
 



Eventually, the ACNs will correspond to vertexes in the draft rendering. 


From this representation of ACNS we can make quick maps of the floats and relationships in the draft. For example, each weft float begins at a left-side cell and ends at the right side cell. 

Yet, not all ACNs in the draft are equally meaningful. So edges are created by way of layers forming, for instance, lifting and lowering different warps in sets such that the layers will stack. We assess these relationships by 

1. looking for teh longest float (the top layer of the cloth) and virtually "pulling" it upward and seeing what other floats would be lifted subsequenty. We then lift those subsequent floats on and on until we have checked all floats. We call all connected floats a layer and update the ACN values as we lift, such that the Z value of any given ACN corresponds to the layer. 

Since each ACN can be assigned to a different layer, it is possible for the warp of one cell to be on one layer while the weft remains on another. Cells where the associated ACNs sit on different layers (one for warp and one for weft are "false" ACNS in that the two yarns may not actually make contact at that point.)

so if we were to remove false ACNS. 