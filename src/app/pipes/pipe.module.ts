import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnumToPipe } from './enumtoarraypipe';
import { LongNumberPipe } from './long-number-pipe';
import { ResourceIdPipe } from './resource-id.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [EnumToPipe, ResourceIdPipe, LongNumberPipe],
  exports: [EnumToPipe, ResourceIdPipe, LongNumberPipe]
})
export class PipeModule {}
