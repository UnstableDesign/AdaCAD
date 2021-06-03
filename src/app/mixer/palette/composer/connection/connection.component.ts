import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss']
})
export class ConnectionComponent implements OnInit {

  from: any;   //Subdraft Component or Operation
  to: any;   //Subdraft Component or Operation


  constructor() { }

  ngOnInit() {
  }

  //Subdraft Component or Operation
  setFrom(from: any){
    this.from = from;
  }

  setTo(to:any){
    this.to = to;
  }


  getTo():any{
    return this.to;
  }

}
