import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { createDefaultPageSchema } from 'ngx-lowcode-core-utils';
import { NgxLowcodePageSchema, NgxLowcodeNodeSchema } from 'ngx-lowcode-core-types';
import { NgxLowcodeDesignerComponent } from 'ngx-lowcode-designer';
import { NgxLowcodeDesignerLocale } from 'ngx-lowcode-i18n';
import { NgxLowcodeRendererComponent } from 'ngx-lowcode-renderer';
import { mockPageSchema } from 'ngx-lowcode-testing';
import { ThyIconRegistry } from 'ngx-tethys/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxLowcodeDesignerComponent, NgxLowcodeRendererComponent],
  template: `
    <div class="demo-shell">
      <section class="demo-shell__hero">
        <p class="demo-shell__eyebrow">ngx-lowcode</p>
        <div class="demo-shell__hero-top">
          <h1>{{ copy().heroTitle }}</h1>
          <div class="demo-shell__locale-switch">
            <button type="button" class="demo-shell__control" (click)="locale.set('zh-CN')">中文</button>
            <button type="button" class="demo-shell__control" (click)="locale.set('en-US')">EN</button>
          </div>
        </div>
        <p>
          {{ copy().heroDescription }}
        </p>
      </section>

      <section class="demo-shell__designer">
        <div class="demo-shell__controls">
          <button type="button" class="demo-shell__control" (click)="loadPreset('orders')">{{ copy().ordersPreset }}</button>
          <button type="button" class="demo-shell__control" (click)="loadPreset('landing')">{{ copy().landingPreset }}</button>
          <button type="button" class="demo-shell__control" (click)="loadPreset('blank')">{{ copy().blankPreset }}</button>
        </div>

        <ngx-lowcode-designer
          [schema]="schema()"
          [locale]="locale()"
          [designerConfig]="{ title: 'Host Designer', allowDeleteRoot: false }"
          (schemaChange)="schema.set($event)"
          (save)="lastCommand.set('save emitted')"
          (previewRequest)="lastCommand.set('preview emitted')"
          (publishRequest)="lastCommand.set('publish emitted')">
        </ngx-lowcode-designer>
      </section>

      <section class="demo-shell__preview">
        <div class="demo-shell__preview-header">
          <div>
            <p class="demo-shell__eyebrow">{{ copy().rendererOnly }}</p>
            <h2>{{ copy().hostPreview }}</h2>
          </div>
          <span>{{ lastCommand() }}</span>
        </div>

        <div class="demo-shell__meta">
          <div>
            <strong>{{ schema().pageMeta.title }}</strong>
            <span>{{ schema().pageMeta.description || copy().noPageDescription }}</span>
          </div>
          <div>
            <strong>{{ nodeCount() }}</strong>
            <span>{{ copy().nodes }}</span>
          </div>
          <div>
            <strong>{{ schema().datasources.length }}</strong>
            <span>{{ copy().datasources }}</span>
          </div>
          <div>
            <strong>{{ schema().actions.length }}</strong>
            <span>{{ copy().actions }}</span>
          </div>
        </div>

        <ngx-lowcode-renderer [schema]="schema()"></ngx-lowcode-renderer>
      </section>
    </div>
  `,
  styles: [
    `
      .demo-shell {
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 35%),
          linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
        padding: 24px;
        color: #0f172a;
      }
      .demo-shell__hero {
        max-width: 760px;
        margin: 0 auto 24px;
      }
      .demo-shell__hero h1 {
        margin: 0 0 12px;
        font-size: 40px;
        line-height: 1.05;
      }
      .demo-shell__hero-top {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
      }
      .demo-shell__locale-switch {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .demo-shell__hero p {
        margin: 0;
        color: #475467;
      }
      .demo-shell__eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 12px;
        font-weight: 700;
        color: #1d4ed8;
        margin-bottom: 10px;
      }
      .demo-shell__designer {
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
        margin-bottom: 24px;
      }
      .demo-shell__controls {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        padding: 18px 18px 0;
        background: rgba(255, 255, 255, 0.92);
      }
      .demo-shell__control {
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #0f172a;
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 13px;
      }
      .demo-shell__preview {
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid #d0d5dd;
        border-radius: 24px;
        padding: 20px;
      }
      .demo-shell__preview-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        margin-bottom: 12px;
      }
      .demo-shell__preview-header h2 {
        margin: 0;
      }
      .demo-shell__preview-header span {
        color: #475467;
      }
      .demo-shell__meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }
      .demo-shell__meta div {
        display: grid;
        gap: 4px;
        padding: 14px 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
      }
      .demo-shell__meta strong {
        font-size: 20px;
      }
      .demo-shell__meta span {
        color: #475467;
        font-size: 13px;
      }
    `
  ]
})
export class AppComponent {
  private readonly iconRegistry = inject(ThyIconRegistry);
  private readonly sanitizer = inject(DomSanitizer);
  readonly schema = signal<NgxLowcodePageSchema>(structuredClone(mockPageSchema));
  readonly lastCommand = signal('ready');
  readonly locale = signal<NgxLowcodeDesignerLocale>('zh-CN');
  readonly nodeCount = computed(() => this.countNodes(this.schema().layoutTree));
  readonly copy = computed(() => demoCopy[this.locale() as keyof typeof demoCopy]);

  constructor() {
    this.iconRegistry.addSvgIconSet(this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/defs/svg/sprite.defs.svg'));
  }

  loadPreset(preset: 'orders' | 'landing' | 'blank'): void {
    if (preset === 'orders') {
      this.schema.set(structuredClone(mockPageSchema));
      this.lastCommand.set(this.copy().ordersLoaded);
      return;
    }

    if (preset === 'landing') {
      this.schema.set(createLandingSchema());
      this.lastCommand.set(this.copy().landingLoaded);
      return;
    }

    const blankSchema = createDefaultPageSchema();
    blankSchema.pageMeta = {
      id: 'blank-page',
      title: this.locale() === 'zh-CN' ? '空白工作区' : 'Blank Workspace',
      description:
        this.locale() === 'zh-CN'
          ? '设计器应自动把它归一成 page 根节点。'
          : 'Designer should normalize this into a page root automatically.'
    };
    this.schema.set(blankSchema);
    this.lastCommand.set(this.copy().blankLoaded);
  }

  private countNodes(nodes: NgxLowcodeNodeSchema[]): number {
    return nodes.reduce((total, node) => total + 1 + this.countNodes(node.children ?? []), 0);
  }
}

const demoCopy = {
  'zh-CN': {
    heroTitle: '面向 Angular 宿主的页面式低代码构建器',
    heroDescription: '上半部分是设计器组件，下半部分只使用 renderer 渲染相同 schema，用来快速做宿主级联调和冒烟验证。',
    ordersPreset: '加载订单查询示例',
    landingPreset: '加载落地页示例',
    blankPreset: '加载空白 Schema',
    rendererOnly: '仅渲染器',
    hostPreview: '宿主预览',
    noPageDescription: '暂无页面描述',
    nodes: '节点',
    datasources: '数据源',
    actions: '动作',
    ordersLoaded: '已加载订单示例',
    landingLoaded: '已加载落地页示例',
    blankLoaded: '已加载空白 Schema'
  },
  'en-US': {
    heroTitle: 'Library-first page builder for Angular hosts',
    heroDescription: 'The top area embeds the designer library. The bottom area renders the same schema using only the renderer package for fast host-level smoke testing.',
    ordersPreset: 'Load Orders Demo',
    landingPreset: 'Load Landing Demo',
    blankPreset: 'Load Blank Schema',
    rendererOnly: 'renderer only',
    hostPreview: 'Host Preview',
    noPageDescription: 'No page description',
    nodes: 'nodes',
    datasources: 'datasources',
    actions: 'actions',
    ordersLoaded: 'orders demo loaded',
    landingLoaded: 'landing demo loaded',
    blankLoaded: 'blank schema loaded'
  }
} as const satisfies Record<NgxLowcodeDesignerLocale, Record<string, string>>;

function createLandingSchema(): NgxLowcodePageSchema {
  return {
    schemaVersion: '1.0.0',
    pageMeta: {
      id: 'landing-page',
      title: 'Growth Landing',
      description: 'A content-focused preset for manual visual testing.'
    },
    state: {
      heroTitle: 'Launch internal tools without rebuilding screens'
    },
    datasources: [],
    actions: [],
    layoutTree: [
      {
        id: 'landing-root',
        componentType: 'section',
        props: {
          title: 'Growth Landing Root',
          layoutMode: 'grid',
          thyCols: 24,
          thyGap: 20,
          thyResponsive: 'screen',
          minHeight: 180,
          padding: 24
        },
        style: {
          background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)'
        },
        children: [
          {
            id: 'hero-text',
            componentType: 'text',
            props: {
              text: '{{ state.heroTitle }}',
              thySpan: '24 md:14'
            },
            style: {
              color: '#1d4ed8',
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '12px'
            }
          },
          {
            id: 'hero-subtitle',
            componentType: 'text',
            props: {
              text: 'Use the designer on top to change copy, spacing, actions and runtime state.',
              thySpan: '24 md:10'
            },
            style: {
              color: '#475467'
            }
          }
        ]
      }
    ]
  };
}
