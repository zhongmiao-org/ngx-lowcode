import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNgxLowcodeMaterials } from '@zhongmiao/ngx-lowcode-materials';
import { AppComponent } from './app.component';
import { routes } from './app.routes';

describe('demo app routing shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNgxLowcodeMaterials(),
        provideRouter(routes),
        provideLocationMocks()
      ]
    }).compileComponents();
  });

  it('renders the home route with navigation cards', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('商业演示级低代码工作台');
    const links = fixture.debugElement.queryAll(By.css('a[routerlink]'));
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  it('navigates to separate studio routes for model, datasource, permission, designer, preview and route config', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(AppComponent);

    await router.navigateByUrl('/studio/model');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('数据模型');

    await router.navigateByUrl('/studio/datasource');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('数据源列表');

    await router.navigateByUrl('/studio/permission');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('权限策略设计');

    await router.navigateByUrl('/studio/page/designer');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('设计器');

    await router.navigateByUrl('/studio/page/preview');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('渲染预览');

    await router.navigateByUrl('/studio/page/route-config');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('路由配置');
  });
});
