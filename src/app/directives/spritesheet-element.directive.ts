import { Directive, Input, ElementRef, AfterViewInit } from '@angular/core';

enum SpriteSheet {
  Resources = 'RESOURCES',
  Upgrades = 'UPGRADES'
}

@Directive({
  selector: '[appSpritesheetElement]'
})
export class SpritesheetElementDirective implements AfterViewInit {
  @Input('spriteSheet') spriteSheet: string;
  @Input('spriteIndex') spriteIndex: number;

  constructor(private element: ElementRef) { }

  ngAfterViewInit() {
    if (!this.spriteIndex || this.spriteIndex < 0) {
      return;
    }

    let rowLength = 0;

    switch (this.spriteSheet) {
      case 'UPGRADES': {
        rowLength = 11;
      }
    }

    const offsetX = this.spriteIndex % rowLength * -48;
    const offsetY = Math.floor(this.spriteIndex / rowLength) * -48;

    this.element.nativeElement.style.cssText = `--spriteOffsetX: ${offsetX}px; --spriteOffsetY: ${offsetY}px;`;

  }
}
