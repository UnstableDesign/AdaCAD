import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WeaverComponent } from './weaver/weaver.component';

const routes: Routes = [
  {
    path: '',
    component: WeaverComponent,
    children: []
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
