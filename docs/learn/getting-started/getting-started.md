---
sidebar_position: 1
---

# Getting Started

## Step 1: Open an AdaCAD Workspace

<a class='button_open primary' href="https://adacad.org/" target="_blank">Click Here to Open a Workspace</a>

Looking for an older version of AdaCAD? Find it on the [compare versions](../../about/compare_versions.md) page. 

## Step 2: Create your First Draft
There are two ways you can make a draft in AdaCAD: Draft Mode and Workspace Mode. You can switch between these two modes by using the "design mode" toggle in the header. 

<!-- ![file](./img/design_mode_toggle.png) -->

### In "Draft" Design Mode, Create Drafts by Clicking on a Point Paper Interface
![file](./img/v4_draftmode.png)

In this mode, you can create a draft of specific dimensions and for different loom types by marking cells in the threading, treadling and tieup, or, by modifying the drawdown and generating the threadings. 


### In "Workspace" Design Mode, Generate a Drafts using a Dataflow
![file](./img/getting-started-workspace.png)

In this mode, you connect [operations](../../reference/glossary/operation.md) together to generate and manipulate drafts according to that operation's rules and [parameters](../../reference/glossary/parameter.md).Learn more about this process in [Getting Started -> Make a Dataflow](dataflow.md). 

In the image above a ["twill"](../../reference/operations/twill.md) operation generates a twill draft according to the user-defined rules. The twill draft generated is then piped into the ["make symmetric"](../../reference/operations/makesymmetric.md) operation, where it is rotated around a user-selected selected corner. Then, that symmetric draft is piped into the ["tile"](../../reference/operations/tile.md) operation where it is repeated along several ends and picks a user-specified number of times. Lastly, the tiled draft, and a draft representing a sequence of colors to repeat along the ends and pics are combined using the ["set materials and systems"](../../reference/operations/apply_materials.md) operations. If you want to see any draft generated within the dataflow in more detail, you can just double click it and then select 'open in editor". 
<!-- <a class='button_open primary' href="https://adacad.org/?ex=first_workspace" target="_blank">Open the "Getting Started" Workpace</a> -->


## Step 3: Weave! 

Once you have created a draft, [weave it on your loom](./weave.md). You can export drafts from AdaCAD to upload to computerized looms such as the TC2 or AVL Compudobby Loom. You can also manually follow patterns to setup analog looms.

## Step 4: Share and Contribute
We'd love to see what you made and to share it with the community. The best way to do this is to join the [AdaCAD Discord Community](https://discord.com/invite/Be7ukQcvrC) and share it via the 'project sharing' channel. Alternatively, you can email your design and creation to unstabledesignlab@gmail.com or share it on Instagram by tagging [#adacad](https://www.instagram.com/explore/tags/adacad/). 

AdaCAD is an open-source project, hoping to blossom into an open-source eco-system, which means we are looking to the community to help develop this project. While we work to get more establish different modes of contribution you can help by sharing your designs with us, editing or updating our documentation (via the "Edit this Page" feature on the bottom of every page), [adding your own operations to AdaCAD](../../develop/makeanoperation.md) and providing feedback to us via Discord, Github, or unstabledesignlab@gmail.com. 


## More Resources 
To make AdaCAD accessible to weavers and other weave-curious folks, we do our best to develop content that shows both how to use AdaCAD and offers exciting examples and artifacts generated in our research lab. Here are a few other resources you might look to for instruction: 

- [Unstable Design Lab YouTube Channel](https://www.youtube.com/playlist?list=PLy2lIjrar_02XiqfJG8kLpeWOyCtDXeFJ)
- [Explore AdaCAD Examples](../../category/examples)
- [Play with AdaCAD Template Workspaces](../templates/quick-tc2.md)
- [Join and Browse Conversations in the AdaCAD Discord Community](https://discord.com/invite/Be7ukQcvrC) 
- [Lookup Unknown or Confusion Terms in the Glossary](../../category/glossary/)
- [Explore All the Current Operations](../../reference/operations/index.md)
