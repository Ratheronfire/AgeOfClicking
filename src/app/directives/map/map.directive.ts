import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';

import { MapService } from './../../services/map/map.service';

@Directive({
  selector: '[appMap]'
})
export class MapDirective implements AfterViewInit {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  constructor(protected element: ElementRef,
              protected renderer: Renderer2,
              protected mapService: MapService) { }

  ngAfterViewInit() {
    this.canvas = <HTMLCanvasElement> this.element.nativeElement;
    this.context = this.canvas.getContext('2d');

    this.mapService.context = this.context;
  }
}
