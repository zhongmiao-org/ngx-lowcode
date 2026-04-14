import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
  output
} from '@angular/core';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { json } from '@codemirror/lang-json';

@Component({
  selector: 'ngx-lowcode-json-editor',
  templateUrl: './ngx-lowcode-json-editor.component.html',
  styleUrl: './ngx-lowcode-json-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxLowcodeJsonEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorHost', { static: true }) private editorHost?: ElementRef<HTMLDivElement>;

  readonly value = input('');
  readonly valueChange = output<string>();

  private editorView: EditorView | null = null;
  private suppressEmit = false;

  constructor() {
    effect(() => {
      const nextValue = this.value();
      const editorView = this.editorView;
      if (!editorView) {
        return;
      }

      const currentValue = editorView.state.doc.toString();
      if (nextValue === currentValue) {
        return;
      }

      this.suppressEmit = true;
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: nextValue
        }
      });
      this.suppressEmit = false;
    });
  }

  ngAfterViewInit(): void {
    const host = this.editorHost?.nativeElement;
    if (!host) {
      return;
    }

    this.editorView = new EditorView({
      state: this.createEditorState(this.value()),
      parent: host
    });
  }

  ngOnDestroy(): void {
    this.editorView?.destroy();
  }

  private createEditorState(doc: string): EditorState {
    return EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        json(),
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '12px',
            fontFamily: "'SFMono-Regular', 'Menlo', monospace"
          },
          '.cm-scroller': {
            overflow: 'auto'
          },
          '.cm-content': {
            padding: '12px 0'
          },
          '.cm-gutters': {
            backgroundColor: '#f8fafc',
            borderRight: '1px solid #e4e7ec'
          }
        }),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || this.suppressEmit) {
            return;
          }
          this.valueChange.emit(update.state.doc.toString());
        })
      ]
    });
  }
}
