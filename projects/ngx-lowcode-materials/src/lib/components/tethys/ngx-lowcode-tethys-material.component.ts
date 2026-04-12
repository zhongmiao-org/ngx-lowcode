import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';
import { ThyAlertModule } from 'ngx-tethys/alert';
import { ThyAnchorModule } from 'ngx-tethys/anchor';
import { ThyAvatarModule } from 'ngx-tethys/avatar';
import { ThyBreadcrumbModule } from 'ngx-tethys/breadcrumb';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyCardModule } from 'ngx-tethys/card';
import { ThyCheckboxModule } from 'ngx-tethys/checkbox';
import { ThyDatePickerModule } from 'ngx-tethys/date-picker';
import { ThyDividerModule } from 'ngx-tethys/divider';
import { ThyFormModule } from 'ngx-tethys/form';
import { ThyIconModule } from 'ngx-tethys/icon';
import { ThyImageModule } from 'ngx-tethys/image';
import { ThyInputNumberModule } from 'ngx-tethys/input-number';
import { ThyListModule } from 'ngx-tethys/list';
import { ThyMenuModule } from 'ngx-tethys/menu';
import { ThyProgressModule } from 'ngx-tethys/progress';
import { ThyRadioModule } from 'ngx-tethys/radio';
import { ThySpaceModule } from 'ngx-tethys/space';
import { ThyStatisticModule } from 'ngx-tethys/statistic';
import { ThySwitchModule } from 'ngx-tethys/switch';
import { ThyTabsModule } from 'ngx-tethys/tabs';
import { ThyTagModule } from 'ngx-tethys/tag';
import { ThyUploadModule } from 'ngx-tethys/upload';

@Component({
  selector: 'ngx-lowcode-tethys-material',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ThyAlertModule,
    ThyAnchorModule,
    ThyAvatarModule,
    ThyBreadcrumbModule,
    ThyButtonModule,
    ThyCardModule,
    ThyCheckboxModule,
    ThyDatePickerModule,
    ThyDividerModule,
    ThyFormModule,
    ThyIconModule,
    ThyImageModule,
    ThyInputNumberModule,
    ThyListModule,
    ThyMenuModule,
    ThyProgressModule,
    ThyRadioModule,
    ThySpaceModule,
    ThyStatisticModule,
    ThySwitchModule,
    ThyTabsModule,
    ThyTagModule,
    ThyUploadModule
  ],
  templateUrl: './ngx-lowcode-tethys-material.component.html',
  styleUrl: './ngx-lowcode-tethys-material.component.scss'
})
export class NgxLowcodeTethysMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly hostStyle = computed<Record<string, string | number>>(() => ({
    ...(this.node().style ?? {})
  }));
  readonly componentType = computed(() => this.node().componentType);
  readonly title = computed(() => String(this.node().props['title'] ?? this.node().props['label'] ?? ''));
  readonly fieldLabel = computed(() => String(this.node().props['label'] ?? this.node().props['title'] ?? ''));
  readonly subtitle = computed(() => String(this.node().props['subtitle'] ?? this.node().props['description'] ?? ''));
  readonly text = computed(() => String(this.node().props['text'] ?? ''));
  readonly href = computed(() => String(this.node().props['href'] ?? '#'));
  readonly iconName = computed(() => String(this.node().props['iconName'] ?? 'mail'));
  readonly imageSrc = computed(() => String(this.node().props['src'] ?? 'https://via.placeholder.com/480x240?text=Image'));
  readonly stateKey = computed(() => String(this.node().props['stateKey'] ?? ''));
  readonly uploadedFiles = computed<string[]>(() => {
    const value = this.runtime().state()[this.stateKey()];
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }
    return [];
  });
  readonly selectValue = computed(() => this.runtime().state()[this.stateKey()] ?? null);
  readonly checkboxValue = computed(() => Boolean(this.runtime().state()[this.stateKey()] ?? false));
  readonly switchValue = computed(() => Boolean(this.runtime().state()[this.stateKey()] ?? false));
  readonly numberValue = computed(() => Number(this.runtime().state()[this.stateKey()] ?? this.node().props['value'] ?? 0));
  readonly dateValue = computed(() => this.runtime().state()[this.stateKey()] ?? null);
  readonly progressValue = computed(() => Number(this.node().props['value'] ?? 68));
  readonly statisticValue = computed<string | number>(() => {
    const value = this.node().props['value'];
    return typeof value === 'number' || typeof value === 'string' ? value : 1128;
  });
  readonly alertType = computed<'primary' | 'success' | 'warning' | 'danger' | 'info'>(() => {
    const value = String(this.node().props['type'] ?? 'info');
    return ['primary', 'success', 'warning', 'danger', 'info'].includes(value) ? (value as any) : 'info';
  });
  readonly tagTheme = computed<'fill' | 'outline' | 'weak-fill'>(() => {
    const value = String(this.node().props['theme'] ?? 'weak-fill');
    return value === 'fill' || value === 'outline' ? value : 'weak-fill';
  });
  readonly tagColor = computed(() => String(this.node().props['color'] ?? 'primary'));
  readonly menuItems = computed(() => this.parseItems(this.node().props['items'], ['概览', '详情', '设置']));
  readonly breadcrumbItems = computed(() => this.parseItems(this.node().props['items'], ['首页', '项目', '详情']));
  readonly tabItems = computed(() => this.parseItems(this.node().props['items'], ['概览', '分析', '日志']));
  readonly listItems = computed(() => this.parseItems(this.node().props['items'], ['列表项 A', '列表项 B', '列表项 C']));
  readonly anchorItems = computed(() => this.parseItems(this.node().props['items'], ['基础信息', '操作记录', '附件']));
  readonly radioItems = computed(() => this.parseItems(this.node().props['items'], ['选项一', '选项二', '选项三']));

  updateState(value: unknown): void {
    if (!this.stateKey()) {
      return;
    }
    this.runtime().setState({ [this.stateKey()]: value });
  }

  uploadFiles(event: File[] | FileList | Event): void {
    const files = Array.isArray(event)
      ? event
      : event instanceof FileList
        ? Array.from(event)
        : [];
    if (!this.stateKey()) {
      return;
    }
    this.runtime().setState({
      [this.stateKey()]: files.map((file) => file.name)
    });
  }

  private parseItems(value: unknown, fallback: string[]): string[] {
    if (Array.isArray(value)) {
      const normalized = value.map((item) => String(item).trim()).filter(Boolean);
      return normalized.length ? normalized : fallback;
    }
    const source = String(value ?? '').trim();
    if (!source) {
      return fallback;
    }
    const normalized = source
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    return normalized.length ? normalized : fallback;
  }
}
