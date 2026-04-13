import { NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';

export function interpolateTemplate(template: string, runtime: NgxLowcodeRuntimeContext): string {
  return template.replace(/\{\{\s*state\.([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = runtime.state()[key];
    return value === undefined || value === null ? '' : String(value);
  });
}
