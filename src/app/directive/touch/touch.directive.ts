import { Directive, ElementRef, Renderer2 } from '@angular/core';

import * as Hammer from 'hammerjs';

import { ClickerMainService } from './../../services/clicker-main/clicker-main.service';

@Directive({
  selector: '[appTouch]'
})
export class TouchDirective {
  constructor(protected element: ElementRef,
              protected renderer: Renderer2,
              protected clickerMainService: ClickerMainService) {
    Hammer(element.nativeElement).on('press', function(event) {
      const id = +element.nativeElement.attributes['id'].value;
      clickerMainService.startHarvesting(id);
    });

    Hammer(element.nativeElement).on('pressup', function(event) {
      const id = +element.nativeElement.attributes['id'].value;
      clickerMainService.stopHarvesting(id);
    });
  }
}
