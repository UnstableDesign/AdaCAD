[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/draft](../README.md) / getDraftAsImage

# Function: getDraftAsImage()

> **getDraftAsImage**(`draft`, `pix_per_cell`, `floats`, `use_color`, `mats`): `ImageData`

Defined in: objects/draft.ts:354

when drafts are rendered to the screen they are drawn pixel by pixel to an Image element and rendered on the canvas. This is a much faster process than drawing as lines and shapes on a canvas.

## Parameters

### draft

[`Draft`](../../datatypes/interfaces/Draft.md)

the draft we will convert to an image

### pix\_per\_cell

`number`

the maximum cell size for each interlacement, calculated based on draft size and maximum canvas dimensions

### floats

`boolean`

boolean to render cells of the same value as floats (rather than bounded cells)

### use\_color

`boolean`

boolean to render the color of the yarn

### mats

[`Material`](../../datatypes/interfaces/Material.md)[]

an array of the materials currently in use in the workspace

## Returns

`ImageData`
