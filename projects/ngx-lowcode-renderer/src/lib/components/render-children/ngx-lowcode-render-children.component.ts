import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { NgxLowcodeDropTarget, NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';
import { NgxLowcodeNodeRendererComponent } from '../node-renderer/ngx-lowcode-node-renderer.component';

@Component({
  selector: 'ngx-lowcode-render-children',
  standalone: true,
  imports: [CommonModule, NgxLowcodeNodeRendererComponent],
  templateUrl: './ngx-lowcode-render-children.component.html',
  styleUrl: './ngx-lowcode-render-children.component.scss'
})
export class NgxLowcodeRenderChildrenComponent {
  readonly nodes = input<NgxLowcodeNodeSchema[]>([]);
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();
  readonly paletteDragging = input(false);
  readonly hoveredDropTarget = input<NgxLowcodeDropTarget | null>(null);
  readonly dropTargetChange = output<NgxLowcodeDropTarget | null>();
}
