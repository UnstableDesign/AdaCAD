import { Injectable } from '@angular/core';
import descriptions from '../../../assets/json/op_descriptions.json';
import classifications from '../../../assets/json/op_classifications.json';
import { OperationClassification } from '../model/datatypes';

@Injectable({
  providedIn: 'root'
})
export class OperationDescriptionsService {

  constructor() { 



  }

  getOpClassifications() : Array<OperationClassification>{
   return classifications.classifications;
  }


  getCatDescription(name: string) : string{
    const cat =  classifications.classifications.find(el => el.category_name == name);
    if(cat !== undefined) return cat.description;
    else return "";
   }

  getOpDescription(opname: string){
    const item = descriptions.operation.find(el => el.name == opname);
    if(item !== undefined){
      return item.description;
    }else{
      return "";
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
    }else{
      return "";
    }
  }

  getYoutube(opname: string){
    const item = descriptions.operation.find(el => el.name == opname);
    if(item !== undefined){
      return item.youtube;
    }else{
      return "";
    }
  }

  getParamDescription(paramname: string){
    const item = descriptions.param.find(el => el.name == paramname);
    if(item !== undefined){
      return item.description;
    }
  }



  getDyanmicText(): string{
    return descriptions.dynamic_description;
  }




}
