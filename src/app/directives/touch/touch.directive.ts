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
    const hammerControl = Hammer(element.nativeElement);

    hammerControl.get('press').set({time: 0});

    hammerControl.on('press', function(event) {
      const id = +element.nativeElement.attributes['id'].value;
      clickerMainService.startHarvesting(id);
    });

    hammerControl.on('pressup', function(event) {
      const id = +element.nativeElement.attributes['id'].value;
      clickerMainService.stopHarvesting(id);
    });
  }
}
