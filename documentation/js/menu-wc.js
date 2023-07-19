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
                    <a href="index.html" data-type="index-link">adacad documentation</a>
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
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AppModule-03dd1466fa5e88b51aa6bc3c3c23ff0f69df675cccb9df5d879049f06cac176e044c6fcea9630425739847cb327962803e7c9221e4e2946dcca150b318245f70"' : 'data-bs-target="#xs-components-links-module-AppModule-03dd1466fa5e88b51aa6bc3c3c23ff0f69df675cccb9df5d879049f06cac176e044c6fcea9630425739847cb327962803e7c9221e4e2946dcca150b318245f70"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-03dd1466fa5e88b51aa6bc3c3c23ff0f69df675cccb9df5d879049f06cac176e044c6fcea9630425739847cb327962803e7c9221e4e2946dcca150b318245f70"' :
                                            'id="xs-components-links-module-AppModule-03dd1466fa5e88b51aa6bc3c3c23ff0f69df675cccb9df5d879049f06cac176e044c6fcea9630425739847cb327962803e7c9221e4e2946dcca150b318245f70"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppRoutingModule.html" data-type="entity-link" >AppRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/CoreModule.html" data-type="entity-link" >CoreModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-CoreModule-7340df7570ee520461c6d364842feff2c64d74ecae718abd45d8542b7980ffbbde106873bc7c4e0727708968328e734ae5c2849e91ec8a975c36eae6ab366a30"' : 'data-bs-target="#xs-components-links-module-CoreModule-7340df7570ee520461c6d364842feff2c64d74ecae718abd45d8542b7980ffbbde106873bc7c4e0727708968328e734ae5c2849e91ec8a975c36eae6ab366a30"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-CoreModule-7340df7570ee520461c6d364842feff2c64d74ecae718abd45d8542b7980ffbbde106873bc7c4e0727708968328e734ae5c2849e91ec8a975c36eae6ab366a30"' :
                                            'id="xs-components-links-module-CoreModule-7340df7570ee520461c6d364842feff2c64d74ecae718abd45d8542b7980ffbbde106873bc7c4e0727708968328e734ae5c2849e91ec8a975c36eae6ab366a30"' }>
                                            <li class="link">
                                                <a href="components/AboutModal.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AboutModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BlankdraftModal.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BlankdraftModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ExamplesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExamplesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FilebrowserComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilebrowserComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InitModal.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InitModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoadfileComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoadfileComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoginComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoomModal.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoomModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MaterialModal.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MaterialModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfileComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SignupComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SignupComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TopbarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TopbarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UploadFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UploadFormComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#directives-links-module-CoreModule-7340df7570ee520461c6d364842feff2c64d74ecae718abd45d8542b7980ffbbde106873bc7c4e0727708968328e734ae5c2849e91ec8a975c36eae6ab366a30"' : 'data-bs-target="#xs-directives-links-module-CoreModule-7340df7570ee520461c6d364842feff2c64d74ecae718abd45d8542b7980ffbbde106873bc7c4e0727708968328e734ae5c2849e91ec8a975c36eae6ab366a30"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-CoreModule-7340df7570ee520461c6d364842feff2c64d74ecae718abd45d8542b7980ffbbde106873bc7c4e0727708968328e734ae5c2849e91ec8a975c36eae6ab366a30"' :
                                        'id="xs-directives-links-module-CoreModule-7340df7570ee520461c6d364842feff2c64d74ecae718abd45d8542b7980ffbbde106873bc7c4e0727708968328e734ae5c2849e91ec8a975c36eae6ab366a30"' }>
                                        <li class="link">
                                            <a href="directives/KeycodesDirective.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KeycodesDirective</a>
                                        </li>
                                    </ul>
                                </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CoreModule-7340df7570ee520461c6d364842feff2c64d74ecae718abd45d8542b7980ffbbde106873bc7c4e0727708968328e734ae5c2849e91ec8a975c36eae6ab366a30"' : 'data-bs-target="#xs-injectables-links-module-CoreModule-7340df7570ee520461c6d364842feff2c64d74ecae718abd45d8542b7980ffbbde106873bc7c4e0727708968328e734ae5c2849e91ec8a975c36eae6ab366a30"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CoreModule-7340df7570ee520461c6d364842feff2c64d74ecae718abd45d8542b7980ffbbde106873bc7c4e0727708968328e734ae5c2849e91ec8a975c36eae6ab366a30"' :
                                        'id="xs-injectables-links-module-CoreModule-7340df7570ee520461c6d364842feff2c64d74ecae718abd45d8542b7980ffbbde106873bc7c4e0727708968328e734ae5c2849e91ec8a975c36eae6ab366a30"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FileService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PatternfinderService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PatternfinderService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UploadService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UploadService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/VaeService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VaeService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DraftDetailModule.html" data-type="entity-link" >DraftDetailModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-DraftDetailModule-f614385be4793cb89cadbe996a18d8c784264977bdf58a6d8da9f65015f8e8fdd57ae133f524992715f314e873a288f0b154d9bc54d1ba31bcbe9934d1cdf4bf"' : 'data-bs-target="#xs-components-links-module-DraftDetailModule-f614385be4793cb89cadbe996a18d8c784264977bdf58a6d8da9f65015f8e8fdd57ae133f524992715f314e873a288f0b154d9bc54d1ba31bcbe9934d1cdf4bf"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-DraftDetailModule-f614385be4793cb89cadbe996a18d8c784264977bdf58a6d8da9f65015f8e8fdd57ae133f524992715f314e873a288f0b154d9bc54d1ba31bcbe9934d1cdf4bf"' :
                                            'id="xs-components-links-module-DraftDetailModule-f614385be4793cb89cadbe996a18d8c784264977bdf58a6d8da9f65015f8e8fdd57ae133f524992715f314e873a288f0b154d9bc54d1ba31bcbe9934d1cdf4bf"' }>
                                            <li class="link">
                                                <a href="components/ActionsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ActionsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CrosssectionComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CrosssectionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DraftDetailComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DraftDetailComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DraftviewerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DraftviewerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SelectionComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SelectionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SidebarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SidebarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SimulationComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SimulationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WeaverViewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WeaverViewComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DraftDetailModule-f614385be4793cb89cadbe996a18d8c784264977bdf58a6d8da9f65015f8e8fdd57ae133f524992715f314e873a288f0b154d9bc54d1ba31bcbe9934d1cdf4bf"' : 'data-bs-target="#xs-injectables-links-module-DraftDetailModule-f614385be4793cb89cadbe996a18d8c784264977bdf58a6d8da9f65015f8e8fdd57ae133f524992715f314e873a288f0b154d9bc54d1ba31bcbe9934d1cdf4bf"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DraftDetailModule-f614385be4793cb89cadbe996a18d8c784264977bdf58a6d8da9f65015f8e8fdd57ae133f524992715f314e873a288f0b154d9bc54d1ba31bcbe9934d1cdf4bf"' :
                                        'id="xs-injectables-links-module-DraftDetailModule-f614385be4793cb89cadbe996a18d8c784264977bdf58a6d8da9f65015f8e8fdd57ae133f524992715f314e873a288f0b154d9bc54d1ba31bcbe9934d1cdf4bf"' }>
                                        <li class="link">
                                            <a href="injectables/RenderService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RenderService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MixerModule.html" data-type="entity-link" >MixerModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-MixerModule-1ec66c4dd86de8fb8f1380f29e3b6b7dbc1c8835fd61fbee38d33ec9f754cd31f49ccc7d09ac63664f22cb0ed64336d60c65c944fdacb088436de7a4e8050f7d"' : 'data-bs-target="#xs-components-links-module-MixerModule-1ec66c4dd86de8fb8f1380f29e3b6b7dbc1c8835fd61fbee38d33ec9f754cd31f49ccc7d09ac63664f22cb0ed64336d60c65c944fdacb088436de7a4e8050f7d"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-MixerModule-1ec66c4dd86de8fb8f1380f29e3b6b7dbc1c8835fd61fbee38d33ec9f754cd31f49ccc7d09ac63664f22cb0ed64336d60c65c944fdacb088436de7a4e8050f7d"' :
                                            'id="xs-components-links-module-MixerModule-1ec66c4dd86de8fb8f1380f29e3b6b7dbc1c8835fd61fbee38d33ec9f754cd31f49ccc7d09ac63664f22cb0ed64336d60c65c944fdacb088436de7a4e8050f7d"' }>
                                            <li class="link">
                                                <a href="components/ConnectionComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ConnectionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DesignComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DesignComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ImageComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ImageComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InletComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InletComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MixerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MixerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MixerViewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MixerViewComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NoteComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NoteComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OpHelpModal.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OpHelpModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OperationComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OperationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OpsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OpsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PaletteComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PaletteComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ParameterComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ParameterComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/QuickopComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >QuickopComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SnackbarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SnackbarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SubdraftComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubdraftComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#directives-links-module-MixerModule-1ec66c4dd86de8fb8f1380f29e3b6b7dbc1c8835fd61fbee38d33ec9f754cd31f49ccc7d09ac63664f22cb0ed64336d60c65c944fdacb088436de7a4e8050f7d"' : 'data-bs-target="#xs-directives-links-module-MixerModule-1ec66c4dd86de8fb8f1380f29e3b6b7dbc1c8835fd61fbee38d33ec9f754cd31f49ccc7d09ac63664f22cb0ed64336d60c65c944fdacb088436de7a4e8050f7d"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-MixerModule-1ec66c4dd86de8fb8f1380f29e3b6b7dbc1c8835fd61fbee38d33ec9f754cd31f49ccc7d09ac63664f22cb0ed64336d60c65c944fdacb088436de7a4e8050f7d"' :
                                        'id="xs-directives-links-module-MixerModule-1ec66c4dd86de8fb8f1380f29e3b6b7dbc1c8835fd61fbee38d33ec9f754cd31f49ccc7d09ac63664f22cb0ed64336d60c65c944fdacb088436de7a4e8050f7d"' }>
                                        <li class="link">
                                            <a href="directives/MarqueeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MarqueeComponent</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#directives-links"' :
                                'data-bs-target="#xs-directives-links"' }>
                                <span class="icon ion-md-code-working"></span>
                                <span>Directives</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="directives-links"' : 'id="xs-directives-links"' }>
                                <li class="link">
                                    <a href="directives/SelectionComponent.html" data-type="entity-link" >SelectionComponent</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/MyErrorStateMatcher.html" data-type="entity-link" >MyErrorStateMatcher</a>
                            </li>
                            <li class="link">
                                <a href="classes/OneD.html" data-type="entity-link" >OneD</a>
                            </li>
                            <li class="link">
                                <a href="classes/Selection.html" data-type="entity-link" >Selection</a>
                            </li>
                            <li class="link">
                                <a href="classes/TwoD.html" data-type="entity-link" >TwoD</a>
                            </li>
                            <li class="link">
                                <a href="classes/Util.html" data-type="entity-link" >Util</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/CollectionService.html" data-type="entity-link" >CollectionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DesignmodesService.html" data-type="entity-link" >DesignmodesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExampleserviceService.html" data-type="entity-link" >ExampleserviceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FabricssimService.html" data-type="entity-link" >FabricssimService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FilesystemService.html" data-type="entity-link" >FilesystemService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ImageService.html" data-type="entity-link" >ImageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/InkService.html" data-type="entity-link" >InkService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LayersService.html" data-type="entity-link" >LayersService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MaterialsService.html" data-type="entity-link" >MaterialsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MultiselectService.html" data-type="entity-link" >MultiselectService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotesService.html" data-type="entity-link" >NotesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OperationDescriptionsService.html" data-type="entity-link" >OperationDescriptionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OperationService.html" data-type="entity-link" >OperationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SimulationService.html" data-type="entity-link" >SimulationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StateService.html" data-type="entity-link" >StateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SystemsService.html" data-type="entity-link" >SystemsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TreeService.html" data-type="entity-link" >TreeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/VersionService.html" data-type="entity-link" >VersionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ViewportService.html" data-type="entity-link" >ViewportService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WorkspaceService.html" data-type="entity-link" >WorkspaceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ZoomService.html" data-type="entity-link" >ZoomService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AnalyzedImage.html" data-type="entity-link" >AnalyzedImage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Bounds.html" data-type="entity-link" >Bounds</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Cell.html" data-type="entity-link" >Cell</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ComboNode.html" data-type="entity-link" >ComboNode</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ComboTree.html" data-type="entity-link" >ComboTree</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DensityUnits.html" data-type="entity-link" >DensityUnits</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DesignActions.html" data-type="entity-link" >DesignActions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DesignMode.html" data-type="entity-link" >DesignMode</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Draft.html" data-type="entity-link" >Draft</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DraftMap.html" data-type="entity-link" >DraftMap</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DraftNodeProxy.html" data-type="entity-link" >DraftNodeProxy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Fileloader.html" data-type="entity-link" >Fileloader</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileObj.html" data-type="entity-link" >FileObj</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileSaver.html" data-type="entity-link" >FileSaver</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HistoryState.html" data-type="entity-link" >HistoryState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Ink.html" data-type="entity-link" >Ink</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Interlacement.html" data-type="entity-link" >Interlacement</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterlacementVal.html" data-type="entity-link" >InterlacementVal</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IOTuple.html" data-type="entity-link" >IOTuple</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Item.html" data-type="entity-link" >Item</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoadResponse.html" data-type="entity-link" >LoadResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoomTypes.html" data-type="entity-link" >LoomTypes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Material.html" data-type="entity-link" >Material</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MaterialMap.html" data-type="entity-link" >MaterialMap</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MaterialTypes.html" data-type="entity-link" >MaterialTypes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Model.html" data-type="entity-link" >Model</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NodeComponentProxy.html" data-type="entity-link" >NodeComponentProxy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Note.html" data-type="entity-link" >Note</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OpComponentProxy.html" data-type="entity-link" >OpComponentProxy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OperationClassification.html" data-type="entity-link" >OperationClassification</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OpInput.html" data-type="entity-link" >OpInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OpParamVal.html" data-type="entity-link" >OpParamVal</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Point.html" data-type="entity-link" >Point</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SaveObj.html" data-type="entity-link" >SaveObj</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StartOptions.html" data-type="entity-link" >StartOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StatusMessage.html" data-type="entity-link" >StatusMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/System.html" data-type="entity-link" >System</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TreeNode.html" data-type="entity-link" >TreeNode</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TreeNodeProxy.html" data-type="entity-link" >TreeNodeProxy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Upload.html" data-type="entity-link" >Upload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ViewModes.html" data-type="entity-link" >ViewModes</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
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
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});