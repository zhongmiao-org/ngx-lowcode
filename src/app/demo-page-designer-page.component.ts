import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxLowcodeDesignerComponent } from 'ngx-lowcode-designer';
import { getDemoProjectI18n } from 'ngx-lowcode-i18n';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyCardModule } from 'ngx-tethys/card';
import { ThyStatisticModule } from 'ngx-tethys/statistic';
import { ThyTagModule } from 'ngx-tethys/tag';
import { DemoDslSnapshotRecord } from './demo-snapshot-store.service';
import { DemoWorkspaceService } from './demo-workspace.service';

@Component({
  selector: 'app-demo-page-designer-page',
  imports: [FormsModule, NgxLowcodeDesignerComponent, ThyCardModule, ThyButtonModule, ThyStatisticModule, ThyTagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <thy-card thyBordered="false" class="page-panel">
      <div class="page-panel__header">
        <div>
          <p class="page-panel__eyebrow">{{ copy().pageNavDesigner }}</p>
          <h2>{{ copy().generatedPageTitle }}</h2>
          <div class="page-panel__meta">
            <thy-tag thyColor="primary" thyTheme="weak-fill" thySize="sm">{{ workspace.schema().pageMeta.id }}</thy-tag>
            <thy-tag thyColor="success" thyTheme="weak-fill" thySize="sm">{{ workspace.previewRoutePath() }}</thy-tag>
          </div>
        </div>
        <div class="page-panel__actions">
          <button thyButton="outline-primary" size="sm" (click)="workspace.generateQueryPage()">{{ copy().generateQueryPage }}</button>
          <button thyButton="primary" size="sm" (click)="workspace.generateCrudPage()">{{ copy().generateCrudPage }}</button>
          <button thyButton="outline-primary" size="sm" (click)="workspace.resetWorkspace()">{{ copy().resetWorkspace }}</button>
        </div>
      </div>

      <div class="page-panel__stats">
        <thy-statistic thyShape="card" thyColor="primary" [thyValue]="workspace.schema().datasources.length" [thyTitle]="copy().pageDatasources"></thy-statistic>
        <thy-statistic thyShape="card" thyColor="info" [thyValue]="workspace.schema().actions.length" [thyTitle]="copy().pageActions"></thy-statistic>
        <thy-statistic thyShape="card" thyColor="warning" [thyValue]="workspace.nodeCount()" [thyTitle]="copy().pageNodeCount"></thy-statistic>
      </div>

      <thy-card thyBordered="false" class="traceback-panel">
        <div class="traceback-panel__header">
          <div>
            <p class="page-panel__eyebrow">{{ copy().dslVersioningTitle }}</p>
            <h3>{{ copy().dslVersioningSubtitle }}</h3>
          </div>
          <label class="traceback-panel__toggle">
            <input type="checkbox" [ngModel]="autoSnapshot()" (ngModelChange)="setAutoSnapshot($event)" />
            <span>{{ copy().autoSnapshotToggle }}</span>
          </label>
        </div>
        <div class="traceback-panel__actions">
          <button thyButton="outline-primary" size="sm" (click)="saveSnapshot()">{{ copy().createSnapshot }}</button>
          <button thyButton="outline-primary" size="sm" (click)="exportSnapshot()">{{ copy().exportDsl }}</button>
          <label class="traceback-panel__import">
            <input type="file" accept="application/json" (change)="onImportFile($event)" />
            <span>{{ copy().importDsl }}</span>
          </label>
          <button thyButton="outline-default" size="sm" (click)="refreshSnapshots()">{{ copy().refreshSnapshots }}</button>
        </div>
        <div class="traceback-panel__list">
          @if (snapshots().length === 0) {
            <p class="traceback-panel__empty">{{ copy().snapshotEmpty }}</p>
          } @else {
            @for (item of snapshots(); track item.id) {
              <div class="traceback-panel__item">
                <div>
                  <strong>{{ item.label }}</strong>
                  <p>{{ item.timestamp }} · {{ item.checksum }}</p>
                </div>
                <div class="traceback-panel__item-actions">
                  <button thyButton="outline-primary" size="sm" (click)="restoreSnapshot(item.id)">{{ copy().restoreSnapshot }}</button>
                  <button thyButton="outline-default" size="sm" (click)="removeSnapshot(item.id)">{{ copy().deleteSnapshot }}</button>
                </div>
              </div>
            }
          }
        </div>
      </thy-card>

      <ngx-lowcode-designer
        [schema]="workspace.schema()"
        [locale]="workspace.locale()"
        [designerConfig]="{ title: copy().workspaceTitle, allowDeleteRoot: false }"
        (schemaChange)="workspace.schema.set($event)"
        (save)="workspace.lastCommand.set('save emitted')"
        (previewRequest)="workspace.lastCommand.set('preview emitted')"
        (publishRequest)="workspace.lastCommand.set('publish emitted')"
      >
      </ngx-lowcode-designer>
    </thy-card>
  `,
  styles: [
    `
      .page-panel {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #dbe4ff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        padding: 12px;
      }
      .page-panel__header,
      .page-panel__actions {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .page-panel__eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        font-weight: 700;
        color: #0f766e;
      }
      .page-panel__meta {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 6px;
      }
      .page-panel__stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 10px 0;
      }
      .traceback-panel {
        margin: 10px 0;
        border: 1px solid #bfdbfe;
        border-radius: 12px;
        background: #f8fbff;
      }
      .traceback-panel__header,
      .traceback-panel__actions,
      .traceback-panel__item,
      .traceback-panel__item-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }
      .traceback-panel__toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }
      .traceback-panel__actions {
        margin: 8px 0;
      }
      .traceback-panel__import {
        position: relative;
        display: inline-flex;
        align-items: center;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 2px 10px;
        font-size: 12px;
        line-height: 26px;
        background: #fff;
        cursor: pointer;
      }
      .traceback-panel__import input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
      }
      .traceback-panel__list {
        display: grid;
        gap: 6px;
      }
      .traceback-panel__item {
        border: 1px solid #dbeafe;
        border-radius: 10px;
        padding: 8px;
        background: #ffffff;
      }
      .traceback-panel__item p {
        margin: 2px 0 0;
        font-size: 11px;
        color: #64748b;
      }
      .traceback-panel__empty {
        margin: 0;
        font-size: 12px;
        color: #64748b;
      }
      @media (max-width: 900px) {
        .page-panel__stats {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class DemoPageDesignerPageComponent implements OnDestroy {
  protected readonly workspace = inject(DemoWorkspaceService);
  protected readonly copy = computed(() => getDemoProjectI18n(this.workspace.locale()));
  protected readonly snapshots = signal<DemoDslSnapshotRecord[]>([]);
  protected readonly autoSnapshot = signal(true);
  private autoSnapshotTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.refreshSnapshots();
    effect(() => {
      this.workspace.snapshotFingerprint();
      if (!this.autoSnapshot()) {
        return;
      }
      this.scheduleAutoSnapshot();
    });
  }

  protected setAutoSnapshot(value: boolean): void {
    this.autoSnapshot.set(Boolean(value));
    this.workspace.lastCommand.set(`auto snapshot: ${value ? 'on' : 'off'}`);
  }

  protected async saveSnapshot(): Promise<void> {
    await this.workspace.saveSnapshotPoint('manual');
    await this.refreshSnapshots();
  }

  protected async refreshSnapshots(): Promise<void> {
    this.snapshots.set(await this.workspace.listSnapshotPoints());
  }

  protected async restoreSnapshot(id: string): Promise<void> {
    try {
      await this.workspace.restoreSnapshotPoint(id);
      await this.refreshSnapshots();
    } catch (error) {
      this.workspace.lastCommand.set((error as Error).message);
    }
  }

  protected async removeSnapshot(id: string): Promise<void> {
    await this.workspace.deleteSnapshotPoint(id);
    await this.refreshSnapshots();
  }

  protected exportSnapshot(): void {
    const text = this.workspace.exportCurrentSnapshotJson('exported');
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `dsl-snapshot-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.workspace.lastCommand.set('dsl exported');
  }

  protected async onImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      await this.workspace.importSnapshotJsonAndRestore(text);
      await this.refreshSnapshots();
    } catch (error) {
      this.workspace.lastCommand.set((error as Error).message);
    } finally {
      input.value = '';
    }
  }

  private scheduleAutoSnapshot(): void {
    if (this.autoSnapshotTimer) {
      clearTimeout(this.autoSnapshotTimer);
    }
    this.autoSnapshotTimer = setTimeout(async () => {
      await this.workspace.saveSnapshotPoint('auto');
      await this.refreshSnapshots();
    }, 1500);
  }

  ngOnDestroy(): void {
    if (this.autoSnapshotTimer) {
      clearTimeout(this.autoSnapshotTimer);
      this.autoSnapshotTimer = null;
    }
  }
}
