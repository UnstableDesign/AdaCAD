# Viewer
<div class="emph">
The viewer allows you to view a specific draft in a variety of formats. 
</div>

## Overview

The viewer occupies the right-hand side of the screen. Unlike the [workspace](./workspace.md), [draft editor](./draft_editor.md), and [library](./library.md), it is not one of the design modes: it stays visible no matter which mode you are working in, so you can always see a rendering of the draft you have selected.

<!-- TODO (screenshot): img/viewer_overview.jpeg is from AdaCAD 4 and is out of date. It is missing the front/back toggle, the actual/standard toggle, the fa-circle-info draft information panel, and the "Adjust Simulation" button. Re-capture and re-letter to match the sections below. -->

![file](./img/viewer_overview.jpeg)

## a. Selecting the Draft to View
The draft that is currently on view in the Viewer is based on which draft is currently selected in the [workspace](./workspace.md), the current draft on view in the [draft editor](./draft_editor.md), or the draft card you last clicked in the [library](./library.md). In the workspace, you select a draft by clicking upon it. A dotted border appears around the draft to show that it is actively on view. 

If nothing is selected, the viewer reads *no draft selected, select a draft to visualize*.

## b. View Controls

<!-- TODO (screenshot): img/viewer_modes.jpeg is from AdaCAD 4. Re-capture to show the four rendering modes as they look now, alongside the front/back and actual/standard toggles. -->

![file](./img/viewer_modes.jpeg)

- <FAIcon icon="fa-solid fa-eye" size="1x" /> **Rendering Mode**: AdaCAD offers four different ways of rendering the draft, demonstrated in the image above: 
    - <FAIcon icon="fa-solid fa-cube" size="1x" /> **view in 3D**: offers a 3D rendering of the draft. See [the simulation](#the-simulation) below.
    - <FAIcon icon="fa-solid fa-chess-board" size="1x" /> **view as draft**: draws only the draft as represented by black and white cells. 
    - <FAIcon icon="fa-solid fa-hashtag" size="1x" /> **view structure**: draws warp and weft floats that would be produced by the draft, without color so as to aid in visualizing the cloth structure. 
    - <FAIcon icon="fa-solid fa-paint-roller" size="1x" /> **view color pattern**: draws warp and weft floats that would be produced by the draft and also draws the colors that would be visible on the surface of the cloth. 

- **front / back**: switches between looking at the face of the cloth and looking at its reverse. This is useful for double cloth and any other structure where the two sides differ.

- **actual / standard**: controls whether the rendering uses each material's real diameter, set in the [materials library](./library.md#e-materials), or draws every yarn at the same uniform size. "Actual" gives a better sense of how a cloth woven with mixed yarn weights will really look; "standard" keeps the structure easier to read.

- <FAIcon icon="fa-solid fa-circle-info" size="1x" /> **Draft Information**: opens a small panel above the rendering showing the draft's **name**, its **dimensions** in ends by picks, and any **notes** you have written. The name and notes each have an <FAIcon icon="fa-solid fa-pen-to-square" size="1x" /> edit button that opens the **Update Draft Info** dialog.

- <FAIcon icon="fa-solid fa-map-pin" size="1x" /> **Pin Draft**: Clicking this "pins" the currently selected draft to the viewer, meaning that this draft will remain selected even if another draft upon the workspace is clicked (for instance, to change the value of a parameter). You might use this to visualize how changes made upstream of this draft affect its appearance. 

The front/back and actual/standard toggles, along with the zoom slider, are hidden while you are in the 3D simulation, since they do not apply there.

### The Simulation

The <FAIcon icon="fa-solid fa-cube" size="1x" /> 3D view builds a simulation of the woven cloth rather than a flat drawing of it. It is still a work in progress, as the banner in the viewer notes, and it will only work for drafts of a modest size. If a draft is too big, the viewer shows a **Size Error** asking you to reduce the number of warps and wefts.

You can orbit, pan, and zoom the 3D view by dragging in it with your mouse.

Clicking <FAIcon icon="fa-solid fa-sliders" size="1x" /> **Adjust Simulation** reveals a set of sliders that change the physical assumptions the simulation makes:

| Control | What it changes |
| ------- | --------------- |
| **Lift Limit** | how many layers of cloth the simulation will try to resolve before giving up |
| **Pack (%)** | how tightly the picks are beaten together |
| **Mass (g)** | the weight of the yarn, which affects how much it settles |
| **Yarn Drooping (°)** | how far a yarn is allowed to bend away from straight as it crosses a float |
| **Warp-Density** | the spacing of the warps, in the units set in your [workspace settings](./topbar.md#units). This starts from the density recorded for the draft in the [draft editor's loom settings](./draft_editor.md#c-adjust-loom-and-draft-settings) |
| **no selvedge / assume selvedge** | whether the simulation treats each pick as written, or assumes the weft turns at a selvedge and carries through |

## c. Rendering
The rendering of the draft is drawn into this window. If the rendering is larger than the view window, you can use the zoom bar and or scroll bars to explore it. 

## d. View and Download Tools
- The **Zoom Slider** controls the current level of scaling applied to the rendering. It is hidden in the 3D simulation, where you zoom by scrolling in the view itself.
- To rename the draft, or to add notes about it, open the <FAIcon icon="fa-solid fa-circle-info" size="1x" /> draft information panel described above.
- To save the draft to your computer, use the <FAIcon icon="fa-solid fa-download" size="1x" /> **Download** button in the [footer](./topbar.md#e-footer). It offers the currently selected draft as a bitmap, an image, a `.WIF` file, or a coloring page. The name of the file will be the draft name followed by the file extension. So, if you name a draft "DiamondTwills" and then select to download it as a `.wif`, the file downloaded will be called `DiamondTwills.wif`.
