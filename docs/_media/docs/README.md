**adacad-drafting-lib**

***

# AdaCAD Drafting Library

**CURRENTLY IN DEVELOPMENT***

The AdaCAD Drafting LIbrary contains the core functionality of AdaCAD without of the UI implementation. Thus, you can access and import the library to work directly in typescript, without having to touch the complex and overwhelming angular code that is used to manage the UI. This goal is to enable better testing, documentation, and integration of our data structures, operations and functions into broader projects. 

## Envisioned Features (in Progress)

- To Generate Drafts in Bitmap and .WIF formats from the Command Line or by writting typescript files that import the library. For example, you might imagine that you can script: 
```
const a = tabby (1, 2, 1, 2); //create a tabby variant
const b = twill (2, 3, 'Z'); // create a twill 
const c = layer(a, b); //layer the structures
export(c, 'bmp') //export the resutling draft as a bitmap file
```

- A more accessible format for developers who may be interested in contributing to simulation functions, adding custom operations, or adding support for different loom or file export types. 

- 

## Installation

The library is available via the NPM registry. The current version represents the existing core functionality (e.g. datastructures, types, operations, and utilities) that control AdaCAD. 

You can download it using: 

`npm i adacad-drafting-lib`

To import it into your project use

`import * from 'adacad-drafting-lib' `

or select the specific features and functions you will import

`import {Draft} from 'adacad-drafting-lib/objects'`

## Documentation 

Automated TypeDoc documentation for each file has been generated in the [docs](_media/docs) folder. 

# Related Links

## Public Facing: 
- [AdaCAD Online](htts://adacad.org) 
- [AdaCAD Documentation](htts://docs.adacad.org)

## Github Repos

- [AdaCAD UI](https://github.com/UnstableDesign/AdaCAD/tree/main) - Branch 'migrate_to_standalone' is a version that is built onto of this library
- [AdaCAD Docs](https://github.com/UnstableDesign/AdaCAD_Documentation) - eventually will work library documentation into this website to support development.
