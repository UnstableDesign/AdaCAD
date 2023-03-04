import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MixerComponent } from './mixer/mixer.component';


const routes: Routes = [
   {
     path: '',
     component: MixerComponent,
     children: []
   },
  {
    path: '**',
    component: MixerComponent,
    children: []
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
