[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [utils/utils](../README.md) / updateMaterialIds

# Function: updateMaterialIds()

> **updateMaterialIds**(`material_mapping`, `index_map`, `replacement_ndx`): `number`[]

Defined in: utils/utils.ts:295

used to update materials lists when we remove a material. 
Works by taking an array of materials and then mapping their indexes to the one identified in the map
If a mapping isn't found for a given number in the material list, it is replaced with the replacement value.

## Parameters

### material\_mapping

`number`[]

the mapping of rows of cols to a material

### index\_map

[`MaterialMap`](../../../objects/datatypes/interfaces/MaterialMap.md)[]

a map from old to new material ids

### replacement\_ndx

`number`

anything not found in the map will be replaced by this value

## Returns

`number`[]
