import xs, { Stream } from 'xstream';
import { VNode } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';
import { style, media } from 'typestyle';
import { px, percent } from 'csx';
import { padding } from 'csstips';

import { getTextWidth } from './util';
import { Sources as RootSources, Exhibition } from './interfaces';

export type Sources = RootSources & {
  onion: StateSource<State>;
};
export type Sinks = { DOM: Stream<VNode>; onion: Stream<Reducer> };
export type Reducer = (prev: State) => State;
export type State = Exhibition;

namespace Styles {
  const borderWidth = 20;
  const innerCircleWidth = 640 - borderWidth * 2;
  export const containerClass = style(
    {
      background: 'white'
    },
    media(
      { minWidth: 0, maxWidth: 599 },
      { borderRadius: px(20), position: 'static' }
    ),
    media(
      { minWidth: 600, maxWidth: 1149 },
      { borderRadius: px(50), position: 'static' }
    ),
    media(
      { minWidth: 1150 },
      {
        borderRadius: percent(50),
        position: 'absolute',
        height: px(innerCircleWidth),
        width: px(innerCircleWidth),
        top: px(borderWidth),
        left: px(borderWidth)
      }
    )
  );
  export const imageClass = style(
    {},
    media(
      { minWidth: 0, maxWidth: 599 },
      {
        width: percent(100),
        height: 'auto',
        borderRadius: [px(20), px(20), 0, 0].join(' ')
      }
    ),
    media(
      { minWidth: 600, maxWidth: 1149 },
      {
        width: percent(100),
        height: 'auto',
        borderRadius: [px(50), px(50), 0, 0].join(' ')
      }
    ),
    media(
      { minWidth: 1150 },
      {
        width: px(innerCircleWidth),
        height: px(innerCircleWidth / 2),
        borderRadius: [px(innerCircleWidth), px(innerCircleWidth), 0, 0].join(
          ' '
        )
      }
    )
  );
  export const headingClass = style(
    {},
    padding(0, 10),
    media({ minWidth: 1150 }, { textAlign: 'center' })
  );
  export const flowedBlurbClass = style(
    { textAlign: 'center', display: 'none' },
    media({ minWidth: 1150 }, { display: 'inherit' })
  );
  export const blockBlurbClass = style(
    {},
    padding(0, 10, 20, 10),
    media({ minWidth: 1150 }, { display: 'none' })
  );
}

export function Component(sources: Sources): Sinks {
  const vdom$: Stream<VNode> = view(sources.onion.state$);

  return {
    DOM: vdom$,
    onion: xs.never()
  };
}

function view(state$: Stream<State>): Stream<VNode> {
  const vdom$ = state$.map(({ blurb, image, title }) =>
    <div className={Styles.containerClass}>
      <img src={image.fields.file.url} className={Styles.imageClass} />
      <div>
        <h3 className={Styles.headingClass}>{title}</h3>
        <div className={Styles.flowedBlurbClass}>
          {flowText(blurb, {
            radius: 300,
            initialOffset: 60,
            padding: 20
          }).map(line => <div>{line}</div>)}
        </div>
        <div className={Styles.blockBlurbClass}>{blurb}</div>
      </div>
    </div>
  );
  return vdom$;
}

function flowText(
  text: string,
  {
    radius,
    initialOffset,
    padding
  }: { radius: number; initialOffset: number; padding: number }
): Array<string> {
  const lines = [];
  const words = text.split(' ');
  let width = getWidth(radius, initialOffset);
  let line: Array<string> = [];
  for (const i in words) {
    line.push(words[i]);
    if (getTextWidth(line.join(' '), '16px sans-serif') + padding > width) {
      const newLine = line.pop();
      lines.push(line.join(' '));
      line = newLine ? [newLine] : [];
      width = getWidth(radius, initialOffset + lines.length * 18.5);
    }
  }
  lines.push(line.join(' '));
  return lines;
}

function getWidth(radius: number, offset: number): number {
  return Math.sqrt(Math.pow(radius, 2) - Math.pow(offset, 2)) * 2;
}
