import { Component, Input, OnInit } from '@angular/core';
import { TreeService } from '../../core/provider/tree.service';
import { SimulationService } from '../../core/provider/simulation.service';
import { Draft } from '../../core/model/datatypes';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit {

  @Input('id') id;


  constructor(private tree: TreeService, public simulation: SimulationService) {

  }


  ngOnInit(): void {
    
  }

  ngAfterViewInit(){
    const div = document.getElementById('simulation_container');
    console.log("IN ON INIT", div.offsetHeight)
  }

  drawSimulation(draft: Draft){
    const div = document.getElementById('simulation_container');
    console.log("ON DRAW SIM", div.offsetHeight)
    this.simulation.drawSimulation(draft);
  }

}
