import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getDemoProjectI18n } from '@zhongmiao/ngx-lowcode-i18n';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyCardModule } from 'ngx-tethys/card';
import { DemoPermissionApiConfig, DemoPermissionScope, DemoWorkspaceService } from './demo-workspace.service';

@Component({
  selector: 'app-demo-permission-api-page',
  imports: [FormsModule, ThyCardModule, ThyButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="permission-page">
      <thy-card thyBordered="false" class="permission-page__panel">
        <div class="permission-page__header">
          <div>
            <p class="permission-page__eyebrow">{{ copy().permissionStage }}</p>
            <h2>{{ copy().apiDesignerTitle }}</h2>
          </div>
          <div class="permission-page__actions">
            <button thyButton="outline-primary" size="sm" (click)="resetDraft()">Reset</button>
            <button thyButton="primary" size="sm" (click)="saveDraft()">Save</button>
          </div>
        </div>

        <div class="permission-page__grid">
          <label class="permission-page__field">
            <span>Query Endpoint</span>
            <input [ngModel]="draft().queryEndpoint" (ngModelChange)="updateQueryEndpoint($event)" />
          </label>
          <label class="permission-page__field">
            <span>Mutation Endpoint</span>
            <input [ngModel]="draft().mutationEndpoint" (ngModelChange)="updateMutationEndpoint($event)" />
          </label>
          <label class="permission-page__field">
            <span>State Key: tenantId</span>
            <input [ngModel]="draft().stateKeys.tenantId" (ngModelChange)="updateStateKey('tenantId', $event)" />
          </label>
          <label class="permission-page__field">
            <span>State Key: userId</span>
            <input [ngModel]="draft().stateKeys.userId" (ngModelChange)="updateStateKey('userId', $event)" />
          </label>
          <label class="permission-page__field">
            <span>State Key: roles</span>
            <input [ngModel]="draft().stateKeys.roles" (ngModelChange)="updateStateKey('roles', $event)" />
          </label>
          <label class="permission-page__field">
            <span>State Key: selectedRecordId</span>
            <input
              [ngModel]="draft().stateKeys.selectedRecordId"
              (ngModelChange)="updateStateKey('selectedRecordId', $event)"
            />
          </label>
          <label class="permission-page__field permission-page__field--full">
            <span>orgIdStateKeys (comma-separated)</span>
            <input [(ngModel)]="orgIdStateKeysText" />
          </label>
        </div>
      </thy-card>

      <thy-card thyBordered="false" class="permission-page__panel">
        <div class="permission-page__header">
          <div>
            <p class="permission-page__eyebrow">{{ copy().permissionStage }}</p>
            <h2>{{ copy().permissionSectionTitle }}</h2>
          </div>
        </div>

        <div class="permission-page__grid">
          <label class="permission-page__field permission-page__field--full">
            <span>Roles (comma-separated)</span>
            <input [(ngModel)]="rolesText" />
          </label>
          <label class="permission-page__field">
            <span>Permission Scope</span>
            <select [ngModel]="draft().permissionScope" (ngModelChange)="updatePermissionScope($event)">
              <option value="SELF">SELF</option>
              <option value="DEPT">DEPT</option>
              <option value="DEPT_AND_CHILDREN">DEPT_AND_CHILDREN</option>
              <option value="CUSTOM_ORG_SET">CUSTOM_ORG_SET</option>
              <option value="TENANT_ALL">TENANT_ALL</option>
            </select>
          </label>
          <label class="permission-page__field">
            <span>Default OrgId</span>
            <input [ngModel]="draft().selectedOrgId" (ngModelChange)="updateSelectedOrgId($event)" />
          </label>
          <label class="permission-page__field permission-page__field--full">
            <span>Custom Org Set (comma-separated)</span>
            <input [(ngModel)]="customOrgIdsText" />
          </label>
        </div>
      </thy-card>
    </div>
  `,
  styles: [
    `
      .permission-page {
        display: grid;
        gap: 12px;
      }
      .permission-page__panel {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #dbe4ff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        padding: 12px;
      }
      .permission-page__header,
      .permission-page__actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .permission-page__eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        font-weight: 700;
        color: #0f766e;
      }
      .permission-page__grid {
        margin-top: 10px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .permission-page__field {
        display: grid;
        gap: 4px;
        font-size: 12px;
      }
      .permission-page__field--full {
        grid-column: 1 / -1;
      }
      .permission-page__field input,
      .permission-page__field select {
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 6px 8px;
        background: #fff;
      }
      @media (max-width: 980px) {
        .permission-page__grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class DemoPermissionApiPageComponent {
  protected readonly workspace = inject(DemoWorkspaceService);
  protected readonly copy = computed(() => getDemoProjectI18n(this.workspace.locale()));
  protected readonly draft = signal<DemoPermissionApiConfig>(this.workspace.permissionApiConfig());
  protected rolesText = '';
  protected customOrgIdsText = '';
  protected orgIdStateKeysText = '';

  constructor() {
    effect(() => {
      const config = this.workspace.permissionApiConfig();
      this.draft.set(structuredClone(config));
      this.rolesText = config.roles.join(', ');
      this.customOrgIdsText = config.customOrgIds.join(', ');
      this.orgIdStateKeysText = config.orgIdStateKeys.join(', ');
    });
  }

  protected resetDraft(): void {
    const config = this.workspace.permissionApiConfig();
    this.draft.set(structuredClone(config));
    this.rolesText = config.roles.join(', ');
    this.customOrgIdsText = config.customOrgIds.join(', ');
    this.orgIdStateKeysText = config.orgIdStateKeys.join(', ');
  }

  protected saveDraft(): void {
    const current = this.draft();
    this.workspace.updatePermissionApiConfig({
      queryEndpoint: current.queryEndpoint.trim() || '/query',
      mutationEndpoint: current.mutationEndpoint.trim() || '/mutation',
      selectedOrgId: current.selectedOrgId.trim(),
      permissionScope: this.toScope(current.permissionScope),
      roles: this.parseTextList(this.rolesText),
      customOrgIds: this.parseTextList(this.customOrgIdsText),
      orgIdStateKeys: this.parseTextList(this.orgIdStateKeysText),
      stateKeys: {
        tenantId: current.stateKeys.tenantId.trim() || 'tenantId',
        userId: current.stateKeys.userId.trim() || 'userId',
        roles: current.stateKeys.roles.trim() || 'roles',
        selectedRecordId: current.stateKeys.selectedRecordId.trim() || 'selectedOrderId'
      }
    });
  }

  protected updateQueryEndpoint(value: string): void {
    this.draft.update((draft) => ({ ...draft, queryEndpoint: String(value) }));
  }

  protected updateMutationEndpoint(value: string): void {
    this.draft.update((draft) => ({ ...draft, mutationEndpoint: String(value) }));
  }

  protected updateSelectedOrgId(value: string): void {
    this.draft.update((draft) => ({ ...draft, selectedOrgId: String(value) }));
  }

  protected updatePermissionScope(value: string): void {
    this.draft.update((draft) => ({ ...draft, permissionScope: this.toScope(String(value)) }));
  }

  protected updateStateKey(key: keyof DemoPermissionApiConfig['stateKeys'], value: string): void {
    this.draft.update((draft) => ({
      ...draft,
      stateKeys: {
        ...draft.stateKeys,
        [key]: String(value)
      }
    }));
  }

  private parseTextList(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private toScope(value: string): DemoPermissionScope {
    if (
      value === 'SELF' ||
      value === 'DEPT' ||
      value === 'DEPT_AND_CHILDREN' ||
      value === 'CUSTOM_ORG_SET' ||
      value === 'TENANT_ALL'
    ) {
      return value;
    }
    return 'DEPT';
  }
}
