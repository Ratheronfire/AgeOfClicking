import { Directive, Renderer2, ElementRef } from '@angular/core';

@Directive({
  selector: '[appNoScroll]'
})
export class NoScrollDirective {
  constructor(protected element: ElementRef,
              protected renderer: Renderer2) {
    element.nativeElement.addEventListener('mousewheel', function(e) {
      e.preventDefault();
    });
  }
}
