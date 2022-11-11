import { Injectable } from '@angular/core';
import descriptions from '../../../assets/json/op_descriptions.json';  

@Injectable({
  providedIn: 'root'
})
export class OperationDescriptionsService {

  constructor() { 



  }

  getOpDescription(opname: string){
    const item = descriptions.operation.find(el => el.name == opname);
    if(item !== undefined){
      return item.description;
    }
  }

  getDisplayName(opname: string){
    const item = descriptions.operation.find(el => el.name == opname);
    if(item !== undefined){
      return item.displayname;
    }else{
      return opname;
    }
  }

  getOpApplication(opname: string){
    const item = descriptions.operation.find(el => el.name == opname);
    if(item !== undefined){
      return item.application;
    }
  }



}
