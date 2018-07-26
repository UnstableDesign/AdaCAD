import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WeaveDirective } from './directives/weave.directive';
import { PatternService } from './provider/pattern.service';
import { FilterPipe } from './pipe/filter.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [WeaveDirective, FilterPipe],
  providers: [PatternService],
  exports: [WeaveDirective, FilterPipe]
})
export class CoreModule { }
