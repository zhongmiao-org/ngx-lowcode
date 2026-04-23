import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { NgxLowcodeRendererComponent } from '@zhongmiao/ngx-lowcode-renderer';
import { ThyButtonModule, ThyButtonType } from 'ngx-tethys/button';
import { clonePageSchema, createTableDemoPageSchema, demoOrderRows } from '../../core/demo-page-schema';

@Component({
  selector: 'app-table-demo',
  imports: [NgxLowcodeRendererComponent, ThyButtonModule],
  templateUrl: './table-demo.component.html',
  styleUrl: './table-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableDemoComponent {
  private readonly renderer = viewChild(NgxLowcodeRendererComponent);

  protected readonly buttonKinds: Record<'default' | 'primaryOutline', ThyButtonType> = {
    default: 'outline-default',
    primaryOutline: 'outline-primary'
  };
  protected readonly schema = signal(clonePageSchema(createTableDemoPageSchema()));
  protected readonly status = signal('Ready');

  protected resetTable(): void {
    this.schema.set(clonePageSchema(createTableDemoPageSchema()));
    this.status.set('Table data reset');
  }

  protected clearTable(): void {
    this.schema.set(clonePageSchema(createTableDemoPageSchema([])));
    this.status.set('Table data cleared');
  }

  protected async runSearch(): Promise<void> {
    const runtime = this.renderer()?.runtime();
    if (!runtime) {
      return;
    }

    runtime.setState({ tableData: [] });
    await runtime.executeActionById('search-action');
    this.status.set(`Search restored ${demoOrderRows.length} rows`);
  }
}
