# Viewer
<div class="emph">
The viewer allows you to view a specific draft in a variety of formats. 
</div>

## Overview
![file](./img/viewer_overview.jpeg)

## a. Selecting the Draft to View
The draft that is currently on view in the Viewer is based on which draft is currently selected in the [workspace](./workspace.md) or the current draft on view in the [draft editor](./draft_editor.md). In the workspace, you select a draft by clicking upon it. A dotted border appears around the draft to show that it is actively on view. 

## b. View Controls
![file](./img/viewer_modes.jpeg)

- <FAIcon icon="fa-solid fa-map-pin" size="1x" /> **Pin Draft**: Clicking this "pins" the currently selected draft to the viewer, meaning that this draft will remain selected even if another draft upon the workspace is clicked (for instance, to change the value of a parameter). You might use this to visualize how changes made upstream of this draft affect its appearance. 
- <FAIcon icon="fa-solid fa-eye" size="1x" /> **Rendering Mode**: AdaCAD offers four different ways of rendering the draft, demonstrated in the image above: 
    - <FAIcon icon="fa-solid fa-cube" size="1x" /> **Simulation**: Offers a 3D rendering of the draft. This is currently in progress and will only work for drafts of a small size. The spacing of the warps in the simulation is controlled by the current density setting for the draft, which can be adjusted in the [draft editor's loom settings](./draft_editor.md#c-adjust-loom-and-draft-settings)
    - <FAIcon icon="fa-solid fa-paint-roller" size="1x" /> **Color Pattern**: Draws warp and weft floats that would be produced by the draft and also draws the colors that would be visible on the surface of the cloth. 
    - <FAIcon icon="fa-solid fa-hashtag" size="1x" /> **Structures**: Draws warp and weft floats that would be produced by the draft, without color so as to aid in visualizing the cloth structure. 
    - <FAIcon icon="fa-solid fa-chess-board" size="1x" /> **Draft**: Draws only the draft as represented by black and white cells. 

- <FAIcon icon="fa-solid fa-edit" size="1x" /> **Open in Editor**: Opens the currently selected draft in the [draft editor](./draft_editor.md)

## c. Rendering
The rendering of the draft is drawn into this window. If the rendering is larger than the view window, you can use the zoom bar and or scroll bars to explore it. 

## d. View and Download Tools
- The **Zoom Slider** controls the current level of scaling applied to the rendering. 
- The **Draft Name Text Field** can be used to label the selected draft. The name "drafty" is used as a default. This feature is still error prone, and will be addressed in later versions. 
- <FAIcon icon="fa-solid fa-download" size="1x" /> **Download** gives you the option to download the currently selected draft is a bitmap, image, or .WIF file. This action will save the draft to your computer where-ever your computer is configured to store downloaded files. The name of the file will be the draft name followed by the file extension. So, if you enter the name "DiamondTwills" in the name field and then select to download as a .wif, the file downloaded will be called "DiamondTwills.wif"