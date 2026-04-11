import { createMaterial, parseStringToDrawdown, type Drawdown } from "adacad-drafting-lib";


const material_a = createMaterial({ id: 0 })
material_a.diameter = 2;
const material_b = createMaterial({ id: 1 })
material_b.diameter = 2;



export const simVars = {
    pack: 1, //max packing
    lift_limit: 10,
    use_layers: true,
    warp_spacing: 10,
    layer_spacing: 5,
    wefts_as_written: false,
    simulate: false,
    time: .003,
    mass: 5,
    max_theta: Math.PI / 4,
    ms: [material_a, material_b],
    use_smoothing: true,
    repulse_force_correction: 0,
}


export const CELL_SIZE = 0.5;
export const LAYER_SPACING = 1;
export const GAP_RATIO = 0.6;
export const VIEW_SCALE = 1;
export const CN_SIZE = 0.08;



const tabby = `
-|-|-|-|
|-|-|-|-
-|-|-|-|
|-|-|-|-
-|-|-|-|
|-|-|-|-
-|-|-|-|
|-|-|-|-
` ;

const waffle = `---|----
--|-|---
-|-|-|--
|-|||-|-
-|||||-|
|-|||-|-
-|-|-|--
--|-|---
` ;

const basket = `
|---|---
|---|---
|---|---
-|||-|||
|---|---
|---|---
|---|---
-|||-|||
`;

const satin_drawdown = `
-----|--
--|-----
-------|
----|---
-|------
------|-
---|----
|-------
`;

const two_side_twill =
    `|-||||||
-----|--
||-|||||
------|-
|||-||||
-------|
||||-|||
|-------
|||||-||
-|------
||||||-|
--|-----
|||||||-
---|----
-|||||||
----|---
`;

const a1b2_c3_d4_tabby = `
|||||||-
|||-||--
|---|---
-|---|--
|||-||||
||--|||-
|---|---
-|---|--`;

const a1c3_b2_d4_tabby = `
-------|
|---|---
|||-|-|-
--|---|-
|||-||||
|---|---
|-|-|||-
--|---|-
`;


const a1_b2_basket = `
|||||||-|-|-
|-|-|-------
|||||||-|-|-
|-|-|-------
|||||||-|-|-
|-|-|-------
|-|-|-||||||
------|-|-|-
|-|-|-||||||
------|-|-|-
|-|-|-||||||
------|-|-|-
`;

const two_layer_tabby = `
|---|---
|||-|||-
--|---|-
|-|||-||
|---|---
|||-|||-
--|---|-
|-|||-||
`

const waffle_dd = parseStringToDrawdown(waffle);
const tabby_dd = parseStringToDrawdown(tabby);
const two_layer_tabby_dd = parseStringToDrawdown(two_layer_tabby);
const basket_draft = parseStringToDrawdown(basket);
const satin_draft = parseStringToDrawdown(satin_drawdown);
const two_side_twill_draft = parseStringToDrawdown(two_side_twill);
const a1b2_c3_d4_tabby_draft = parseStringToDrawdown(a1b2_c3_d4_tabby);
const a1c3_b2_d4_tabby_draft = parseStringToDrawdown(a1c3_b2_d4_tabby);
const a1_b2_basket_draft = parseStringToDrawdown(a1_b2_basket);




export const DRAFT_LIST: Array<Drawdown> = [waffle_dd, tabby_dd, two_layer_tabby_dd, basket_draft, satin_draft, two_side_twill_draft, a1b2_c3_d4_tabby_draft, a1c3_b2_d4_tabby_draft, a1_b2_basket_draft];



