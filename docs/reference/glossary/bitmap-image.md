# Bitmap Image

A bitmap image is a image format whereby each pixel is one of two values: black or white. 

A weaver can use bitmap images to program jacquard looms, like the TC2 digital [jacquard loom](jacquard-loom). To use a bitmap image this way, you create an image that is as many pixels wide as you have warp [ends](end) and as many pixels tall as the number of weft [picks](pick) required in your design (or the number you would like to repeat over and over). 

The TC2 loom will read the image from bottom row to top, and interpret each row in the image as a weaving pick. Black cells will indicate locations at which the warp should be [raised](warp-raised), and white, [lowered](warp-lowered). 

The weaver progresses, row by row, through the image as they weave. 

For information about how you can create and upload drafts to your TC2, you can view the example [Make a Draft for the TC2](../../learn/templates/quick-tc2.md)



