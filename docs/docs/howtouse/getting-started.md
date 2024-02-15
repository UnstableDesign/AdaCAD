---
sidebar_position: 1
---
# Getting Started
<p>Welcome to AdaCAD. The resources on this page will give you an overview of the interface and a few tips on how to get started drafting.</p>


# What is AdaCAD?
AdaCAD is a [parametric design](./glossary/parametric-design) tool for making woven [drafts](./glossary/draft). While most drafting software starts with a blank canvas that the designer fills in their structures, AdaCAD works differently by "growing" a draft from the ground up: starting from structures and arranging them into more complex structural and visual designs. Essentially, it lets you create little workflows that "grow" designs based on a set of rules you define. Its programming for weaving and it makes explicit the inherently algorithmic nature of draft making. It  supports the creation of drafts for [Jacquard](./glossary/jacquard-loom), [Harness](./glossary/harness-loom), and [Direct Tie or Dobby](./glossary/direct-tie-loom) Looms. 


# How to Get the Software
AdaCAD is accessible online:
- stable release of the tool at [https://adacad.org/](https://adacad.org/).
- beta release of our most recent developments at [https://adacad-beta-fa4dc.web.app/](https://adacad-beta-fa4dc.web.app/)


# Tutorials
For more information about the project and user guides, explore projects in our  [learn](/docs/category/learn/) category or on our [YouTube Channel](https://www.youtube.com/playlist?list=PLy2lIjrar_02XiqfJG8kLpeWOyCtDXeFJ)



# Understanding the User Interface


![file](./img/Mixer_Overview.jpeg)
<p>The image above is a labeled guide to the AdaCAD interface (which has the buttons you need to push create drafts as listed above). On the top bar, there are links allowing you to:</p>
<ul>
<li>Sign in: Signing in with a google account will automatically save your work so that you can recover it if something unexpected happens in your web browser. We collect only your google email and name, and do not share it. </li>
<li>Get Help: Links to this page :)</li>
<li>Learn About AdaCAD: Contains information about AdaCAD's version and how to report errors</li>
<li>Clear Screen: starts a new blank workspace</li>
<li>Save/Download Workspace: download to your computer so you can load it back later</li>
<li>Load Workspace: allows you to load an example file or a .ada file from your computer</li>
<li>Name Workspace: you can give your workspace a name, which will be the filename when it saves</li>
</ul>

<p>On the right-hand sidebar you can: </p>
<ul>
<li>Undo: you can undo up to 10 previous changes</li>
<li>Redo: you can redo up to your 10 next changes</li>
<li><i>Add an Image: No longer used, adding an image is an operation now</i></li>
<li>Add an Operation to the Workspace: opens a panel where you can select the operation you want to add to the workspace</li>
<li>Draw Line: allows you to draw lines freehand on the workspace</li>
<li>Draw Shape: allows you to draw shapes freehand on the workspace</li>
<li>Select: selects a portion of a draft from the workspace and copies it in a new draft</li>
<li>Move: allows you to move the position of the drafts and operations on the workspace</li>
<li>Comment: allows you to add a text comment and place it on the workspace</li>
<li>View Options: opens a window that allows you to zoom in and out of your workspace</li>
<li>Add/Edit Materials: opens a window that contains a list of materials that you're workspace can use</li>
<li>Loom Settings: opens a window that customizes the interface based on the type of loom you have. For example, you'll only get options to design for threading, tieup, and treadling if you are set the mode to shaft loom</li>
</ul>

<p>When you add operations and drafts to the workspace, and connect them together to create new drafts. On those new drafts you have a few options. These become visible when you hover your mouse over a draft:</p>
<ul>
<li>Expand into Fine Tune Mode: you can expand into fine-tune mode, which gives you more options for editing and viewing details on an individual draft</li>
<li>Show/Hide: reveals or hides the draft (to save space on the interface)</li>
<li>Copy: copies the draft into a new draft, without an operation parent, so that you can make edits or changes outline of the operation-draft-workflow</li>
<li>Download: downloads the draft as a bitmap or image. You can use this to export structures which you may later import into Photoshop.</li>
<li>Connect: clicking the downward arrow at the bottom of the draft lets you add it as an input to an operation. A single draft can be connected to multiple operations.</li>
</ul>
<p>Operations also have a few options</p>
<ul>
<li>Connect: the top, right-facing arrow can be clicked to select this operation as a destination for a previously selected draft. When drafts are connected to an operation, their name appears to the right of this arrow. You can use this to either see what you've connected or remove a connection.</li>
<li>Help (?): Opens a window that tells you more about the operation and how it works</li>
<li>Copy: copies this operation (and its parameters) and pastes it onto the workspace</li>
<li>Delete: deletes the operation and any immediately connected drafts and connections</li>
<li>Parameters: most operations have parameters (numbers, text, check boxes) that let you give them some information about how they should behave. Just play with these to see how they work :) </li>
</ul>

![file](./img/Finetune_Overview.jpeg)
<p>A labeled guide to the fine-tuning interface. When you add drafts and operations to the workspace, you can expand the to enter "fine tuning" mode, which allows you see more details about an individual draft. There is a sidebar on this window that offers you controls to</p>

<ul>
<li>Draw: change the value (up,down, unset) of each draft cell. Black represents heddle up, white heddle down, Unset cells mean that a yarn will not travel over this warp and can be useful when shape weaving or integrating inlays in portions of the draft.</li>
<li>Copy/Modify: allows you to select a section of the input draft and perform some operations (invert, flip,etc) on it</li>
<li>Repeats: allows you to set repeating color or system patterns on the warp and weft.</li>
<li>Zoom: allows you to customize the zoom and/or other options for visualizing your draft</li>
<li>Yarn Paths: allows you to toggle between seeing your draft as a draft vs. a very rough simulation of how the yarns will move through the draft.</li>
<li>Draft Settings: allows you to specify details about this draft, such as how many warps and wefts it has.</li>
</ul>




These videos show you how to get started in AdaCAD 3.0. The interface in these videos is a bit outdated, but the features and workflow remain mostly the same!


Part 1: 
<iframe width="560" height="315" src="https://www.youtube.com/embed/N4MV9rZ3lm0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>


Part 2: 
<iframe width="560" height="315" src="https://www.youtube.com/embed/tVYlnpD7le0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

