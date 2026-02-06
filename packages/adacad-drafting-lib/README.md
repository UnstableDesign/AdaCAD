# AdaCAD Drafting Library

The AdaCAD Drafting Library contains the core functionality of AdaCAD without of the UI implementation. Thus, you can access and import the library to work directly in typescript, without having to touch the complex and overwhelming angular code that is used to manage the UI. This goal is to enable better testing, documentation, and integration of our data structures, operations and functions into broader projects. 


## Code Structure

The library is organized into several core directories, each handling a specific aspect of drafting functionality:

- **[draft](./src/draft/README.md)**: Contains the data structures, types, and helper functions for managing drafts and warp/weft systems. This includes the `Draft` interface, `Cell` operations, drawdown manipulation, and system management.

- **[loom](./src/loom/README.md)**: Contains the data structures, types, and helper functions for managing looms. Supports different loom types (jacquard, frame/shaft-treadle, direct-tie/dobby) with type-specific computation functions and conversion utilities.

- **[material](./src/material/README.md)**: Contains the material representation and management logic. Materials represent yarns/threads with visual properties (color, diameter) and physical properties (stretch, thickness) used in rendering and simulation.

- **[media](./src/media/README.md)**: Contains type definitions and interfaces for handling images and color data. Supports image analysis, color extraction, and rendering color definitions for draft visualization.

- **[operations](./src/operations/README.md)**: Contains all the operations available in AdaCAD. Operations are the building blocks of the dataflow system - they take drafts as inputs, apply transformations or generate new patterns, and output drafts. Includes both regular operations (fixed inlets) and dynamic operations (variable inlets).

- **[sequence](./src/sequence/README.md)**: Contains the `Sequence` namespace with classes for manipulating 1D and 2D sequences of interlacement values. Provides a fluent API for pattern manipulation, transformation, and system mapping operations.

- **[simulation](./src/simulation/README.md)**: Contains the simulation engine for generating 3D visualizations of woven cloth. Uses material properties and draft information to predict how the woven cloth will look and behave.

- **[utils](./src/utils/README.md)**: Contains utility functions, default values, and helper functions used throughout AdaCAD. Includes draft analysis functions, mathematical operations (LCM, GCD), comparison functions, string parsing, and configuration defaults.



## Installation (Global via NPM)

Use this if you need only to use the existing library. The library is available via the NPM registry. The current version represents the existing core functionality (e.g. data-structures, types, operations, and utilities) that control AdaCAD. 

You can download it using: 

`npm i adacad-drafting-lib`

To import it into your project use

`import * from 'adacad-drafting-lib' `

or select the specific features and functions you will import

`import {Draft} from 'adacad-drafting-lib/draft'`


## Installation (Local)
Use this if you want to develop new features in teh library and use these local changes as the backbone in the AdaCAD UI. 

create a symlink in this directory:

`npm link`

make sure that the package.json file in /projects/adacad/ui/ links to the local library: 

`npm link adacad-drafting-lib --save --legacy-peer-deps`



## Documentation 

Automated TypeDoc documentation for each file has been generated in the [docs](./docs/) folder. 

# Related Links

## Public Facing: 
- [AdaCAD Online](htts://adacad.org) 
- [AdaCAD Documentation](htts://docs.adacad.org)
