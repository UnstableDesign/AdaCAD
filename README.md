# AdaCAD
AdaCAD is a drafting tool for weavers. It has particular supports for Jacquard weaving as well as frame loom weaving and focuses on the development and testing of structures. It follows from the principles of generative design by allowing a designer to create a series of parameterized operations that a user connections to generate new drafts. It also offers specific support and examples for those integrating electonics into woven structures. 

You can use the last release of the tool at [https://adacad-weaver.firebaseapp.com/](https://adacad-weaver.firebaseapp.com/).
More more information about the project and user guides, visit [https://adacad.unstable.design/](https://adacad.unstable.design/)


## Development Notes
There are three core modules in this repo: 
- Core: contains components, services, directives, etc. that are used by both weaver (individual draft view) and mixer (generative workspace) modules. Changes to core will affect both deployments and should be checked before pushing.

- Weaver: contains all components, services, directives, etc. that are used by AdaCAD Weaver. This view supports designing on a simulated loom and viewing yarn paths

- Mixer: contains all components, services, directives, etc. that are used by AdaCAD Mixer. This view supports more freeform experimentation on stitch structures.



## Developer Documentation 
You can use view automatically generated documentation of our project at [http://adacad.unstable.design/AdaCAD/](http://adacad.unstable.design/AdaCAD/).


## Development Setup
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.8.

To download the requirements run `npm install`.

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
