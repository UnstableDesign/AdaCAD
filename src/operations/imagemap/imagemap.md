## Parameters
- `choose file`: click this to locate and upload the file that you'd like to use as a map. Only .jpg and .bmp files will be accepted.
- `draft width`: the number of warp ends in the output. Defaults to the pixel width of the image but can be adjusted to stretch or compress the image from left to right prior to assigning structures. 
-` draft height`: the number of weft pics in the output. Defaults to the pixel height of the image but can be adjusted to stretch or compress the image from top to bottom prior to assigning structures. 

:::warn
AdaCAD can only accept images that have less than 100 colors. Please use another software, such as Photoshop, to reduce the color space (e.g. make an indexed color image) prior to uploading. 
:::

- `view/edit image` - after an image is successfully loaded, you are able to view the original image and make modifications to the colors found in the image by clicking this "view/edit image" button. For example, you can group two similar colors, or two colors that you'd like to use the same input draft by modifying the "groups with" fields on the right of the pop up window. 
![file](./img/imagemap_editor.png)



- `replace image` - after the image is uploaded, you are able to remove it and upload a new image by pressing this "replace image" button. 

## Dynamic Inlets
When the image is uploaded, AdaCAD scans through every pixel and makes a list of the colors used in the image. It then creates an inlet for each color. The draft you assign to each color inlet replaces the  color region of the same color in the original image. 



## Application
Can be used to create complex woven motifs or images with regions filled with different structures
## Developer
adacad id: `imagemap`
