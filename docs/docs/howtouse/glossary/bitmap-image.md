# Bitmap Image

A bitmap image is a image format whereby each pixel is one of two values: black or white. 

A weaver can use bitmap images to program jacquard looms, like the TC2 digital jacquard loom. To use a bitmap image this way, you create an image that is as many pixels wide as you have warp ends and as many pixels tall as the number of wefts required in your design (or the number you would like to repeat over and over). 

The TC2 loom will read the image from bottom row to top, and interpret each row in the image as a weaving pick. Black cells will indicate locations at which the warp should be [raised](warp-raised), and white, [lowered](warp-lowered). 

The weaver progresses, row by row, through the image as they weave. 

