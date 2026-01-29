import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-sim-sidebar',
    templateUrl: './sim-sidebar.component.html',
    styleUrls: ['./sim-sidebar.component.scss'],
    standalone: false
})
export class SimSidebarComponent {

  @Input() sim_expanded;
  @Output() onExpand: any = new EventEmitter();

  closeSimView() {
    throw new Error('Function not implemented.');
  }

  expand(){
    this.onExpand.emit();
  }
  
  
}


