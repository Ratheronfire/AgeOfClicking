import { Pipe } from '@angular/core';
import { PipeTransform } from '@angular/core/src/change_detection/pipe_transform';

@Pipe({
    name: 'enumToArray'
})
export class EnumToPipe implements PipeTransform {
    transform(data: object) {
        return Object.keys(data);
    }
}
