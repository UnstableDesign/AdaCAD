'use strict';


customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">adacad-weaver documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link">AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AppModule-cbef1f00fdb742227bed79cbd696efce"' : 'data-target="#xs-components-links-module-AppModule-cbef1f00fdb742227bed79cbd696efce"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-cbef1f00fdb742227bed79cbd696efce"' :
                                            'id="xs-components-links-module-AppModule-cbef1f00fdb742227bed79cbd696efce"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AppComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppRoutingModule.html" data-type="entity-link">AppRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/CoreModule.html" data-type="entity-link">CoreModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' : 'data-target="#xs-components-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' :
                                            'id="xs-components-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' }>
                                            <li class="link">
                                                <a href="components/UploadFormComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">UploadFormComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#directives-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' : 'data-target="#xs-directives-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' :
                                        'id="xs-directives-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' }>
                                        <li class="link">
                                            <a href="directives/WeaveDirective.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">WeaveDirective</a>
                                        </li>
                                    </ul>
                                </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' : 'data-target="#xs-injectables-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' :
                                        'id="xs-injectables-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' }>
                                        <li class="link">
                                            <a href="injectables/PatternService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>PatternService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UploadService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>UploadService</a>
                                        </li>
                                    </ul>
                                </li>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#pipes-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' : 'data-target="#xs-pipes-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' :
                                            'id="xs-pipes-links-module-CoreModule-33b897ac375cb0810c96111542ca38c4"' }>
                                            <li class="link">
                                                <a href="pipes/FilterPipe.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FilterPipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/WeaverModule.html" data-type="entity-link">WeaverModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-WeaverModule-89e2b59c4b3ce0f81bb9ada98d7455b4"' : 'data-target="#xs-components-links-module-WeaverModule-89e2b59c4b3ce0f81bb9ada98d7455b4"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-WeaverModule-89e2b59c4b3ce0f81bb9ada98d7455b4"' :
                                            'id="xs-components-links-module-WeaverModule-89e2b59c4b3ce0f81bb9ada98d7455b4"' }>
                                            <li class="link">
                                                <a href="components/AboutModal.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AboutModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ConnectionModal.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ConnectionModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DesignComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DesignComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InitModal.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">InitModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LabelModal.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">LabelModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoomComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">LoomComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MasksComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">MasksComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MaterialModal.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">MaterialModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MaterialsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">MaterialsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NotesComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">NotesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PatternModal.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">PatternModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PatternsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">PatternsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SchematicComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SchematicComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ShuttlesModal.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ShuttlesModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SystemsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SystemsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TopbarComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TopbarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViewComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ViewComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WeaverComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">WeaverComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#components-links"' :
                            'data-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/HistoryComponent.html" data-type="entity-link">HistoryComponent</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/Cell.html" data-type="entity-link">Cell</a>
                            </li>
                            <li class="link">
                                <a href="classes/Connection.html" data-type="entity-link">Connection</a>
                            </li>
                            <li class="link">
                                <a href="classes/Draft.html" data-type="entity-link">Draft</a>
                            </li>
                            <li class="link">
                                <a href="classes/Loom.html" data-type="entity-link">Loom</a>
                            </li>
                            <li class="link">
                                <a href="classes/Pattern.html" data-type="entity-link">Pattern</a>
                            </li>
                            <li class="link">
                                <a href="classes/Point.html" data-type="entity-link">Point</a>
                            </li>
                            <li class="link">
                                <a href="classes/Point-1.html" data-type="entity-link">Point</a>
                            </li>
                            <li class="link">
                                <a href="classes/Render.html" data-type="entity-link">Render</a>
                            </li>
                            <li class="link">
                                <a href="classes/Selection.html" data-type="entity-link">Selection</a>
                            </li>
                            <li class="link">
                                <a href="classes/Shuttle.html" data-type="entity-link">Shuttle</a>
                            </li>
                            <li class="link">
                                <a href="classes/System.html" data-type="entity-link">System</a>
                            </li>
                            <li class="link">
                                <a href="classes/Timeline.html" data-type="entity-link">Timeline</a>
                            </li>
                            <li class="link">
                                <a href="classes/Upload.html" data-type="entity-link">Upload</a>
                            </li>
                            <li class="link">
                                <a href="classes/Util.html" data-type="entity-link">Util</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/DensityUnits.html" data-type="entity-link">DensityUnits</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DesignActions.html" data-type="entity-link">DesignActions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DesignModes.html" data-type="entity-link">DesignModes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DraftInterface.html" data-type="entity-link">DraftInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HistoryState.html" data-type="entity-link">HistoryState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoomTypes.html" data-type="entity-link">LoomTypes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MaterialTypes.html" data-type="entity-link">MaterialTypes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StartOptions.html" data-type="entity-link">StartOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToolModes.html" data-type="entity-link">ToolModes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ViewModes.html" data-type="entity-link">ViewModes</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});