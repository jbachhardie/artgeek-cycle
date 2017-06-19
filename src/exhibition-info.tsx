import xs, { Stream } from 'xstream';
import { VNode } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';
import { style, media } from 'typestyle';
import { px, percent } from 'csx';

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
      fill: 'white',
      position: 'static'
    },
    media({ minWidth: 0, maxWidth: 599 }, { borderRadius: px(20) }),
    media({ minWidth: 600, maxWidth: 1149 }, { borderRadius: px(50) }),
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
        width: 'auto',
        height: 'auto',
        borderRadius: [px(20), px(20), 0, 0].join(' ')
      }
    ),
    media(
      { minWidth: 600, maxWidth: 1149 },
      {
        width: 'auto',
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
    <svg attrs-class={Styles.containerClass}>
      <circle cx="300px" cy="300px" r="300px" />
      <image
        {...{ 'xlink:href': image.fields.file.url }}
        className={Styles.imageClass}
      />
      <text y="15px" style={{ fill: 'black' } as any}>{title}</text>
      <text y="15px" style={{ fill: 'black' } as any}>{blurb}</text>
    </svg>
  );
  return vdom$;
}
