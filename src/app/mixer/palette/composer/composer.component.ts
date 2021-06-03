import { Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { DesignmodesService } from '../../provider/designmodes.service';
import { LayersService } from '../../provider/layers.service';
import { OperationComponent } from './operation/operation.component';

@Component({
  selector: 'app-composer',
  templateUrl: './composer.component.html',
  styleUrls: ['./composer.component.scss']
})
export class ComposerComponent implements OnInit {

  /**
   * A container that supports the automatic generation and removal of the components inside of it
   */
   @ViewChild('cc', {read: ViewContainerRef, static: true}) cc: ViewContainerRef;


  op_refs: Array<OperationComponent>

  constructor(private design_modes: DesignmodesService, private layers: LayersService, private resolver: ComponentFactoryResolver) { 
    this.op_refs = [];
  }

  ngOnInit() {
  }


  /**
   * dynamically creates an operation component and pushes it to the list of references
   * @param d a Draft object for this component to contain
   * @returns the created subdraft instance
   */
   addOperation(name: string):OperationComponent{
    const factory = this.resolver.resolveComponentFactory(OperationComponent);
    const op = this.cc.createComponent<OperationComponent>(factory);
    op.instance.name = name;
    op.instance.zndx = this.layers.createLayer();
    op.instance.bounds = {topleft:{x:100, y:100}, width: 100, height: 100};
    this.op_refs.push(op.instance);
    return op.instance;
  }
    

}
