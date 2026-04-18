import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NgxLowcodeIconNode,
  NgxLowcodeMaterialIconKey,
  resolveLowcodeMaterialIconNodes
} from '../../../core';

@Component({
  selector: 'ngx-lowcode-designer-icon',
  templateUrl: './ngx-lowcode-designer-icon.component.html',
  styleUrl: './ngx-lowcode-designer-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ngx-lowcode-designer-icon-host'
  }
})
export class NgxLowcodeDesignerIconComponent {
  readonly icon = input.required<NgxLowcodeMaterialIconKey>();
  readonly decorative = input(true);
  readonly label = input('');
  readonly nodes = computed<readonly NgxLowcodeIconNode[]>(() => resolveLowcodeMaterialIconNodes(this.icon()));
}
