![file](./img/analyzesystem.png)


## Parameters
- `systems`: a series of letters and numbers, separated by a space, that indicate upon which systems of input draft should be mapped into the output draft. For example:

    - `a1`: will create an output using only the draft cells assigned to warp system 1 and weft system a in the input draft. 

    - `a1b2`: will create an output using only the draft cells assigned to warp system 1 or 2 and weft system a or b in the input draft. 

    - `a`: will create an output using only the draft cells assigned to weft system a regardless of their warp system. 

    - `1`: will create an output using only the draft cells assigned to weft system a regardless of their warp system. 


## Inlets
- `draft` - the draft to analyze. 

## Application
When working with complex or multi-layered drafts, this can be useful to isolate certain systems in order to visualize and confirm their correctness. 

## Developer
adacad id: `analyzesystem`
