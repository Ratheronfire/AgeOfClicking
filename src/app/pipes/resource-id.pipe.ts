import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'resourceId'
})
export class ResourceIdPipe implements PipeTransform {
  transform(value: string): string {
    return value.toLowerCase().replace(/ /g, '_');
  }
}
