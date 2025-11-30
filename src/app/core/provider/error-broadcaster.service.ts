import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ErrorStatement, ErrorType } from '../model/datatypes';

@Injectable({
  providedIn: 'root'
})





/**
 * creates a centralized location for functions to submit errors that may have taken place such that they can be handled or shape rendering. 
 */
export class ErrorBroadcasterService {

  errorBroadcasterSubject: Subject<string>;
  errorBroadcast$;

  originatingNodes: Array<ErrorStatement> = []; // a collection of any tree nodes that are affected by an error. 

  constructor() {
    this.errorBroadcasterSubject = new Subject<string>();
    this.errorBroadcast$ = this.errorBroadcasterSubject.asObservable();
  }

  ngOnInit() {

  }

  postError(node_id: number, type: ErrorType, label: string) {
    if (!this.hasError(node_id)) this.originatingNodes.push({ id: node_id, type, label });
    this.errorBroadcasterSubject.next('ERROR: ' + label)
  }

  clearError(node_id: number) {
    this.originatingNodes = this.originatingNodes.filter(el => el.id !== node_id)

  }

  hasError(node_id: number): boolean {
    let node = this.originatingNodes.find(el => el.id == node_id);
    if (node !== undefined) return true;
    return false;
  }

  getErrorLabel(node_id): string {
    let node = this.originatingNodes.find(el => el.id == node_id);
    if (node !== undefined) return node.label;
    return "";
  }

  getErrorType(node_id): ErrorType {
    let node = this.originatingNodes.find(el => el.id == node_id);
    if (node !== undefined) return node.type;
    return 'OTHER';
  }





}
