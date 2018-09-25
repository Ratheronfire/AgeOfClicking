import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnumToPipe } from './enumtoarraypipe';

@NgModule({
  imports: [CommonModule],
  declarations: [EnumToPipe],
  exports: [EnumToPipe]
})
export class PipeModule {}
