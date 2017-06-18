import xs, { Stream } from 'xstream';
import { VNode } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';
import { style, media, types as TypeStyle } from 'typestyle';
import { px, rem, percent } from 'csx';
import { padding, margin } from 'csstips';

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
}

export function ExhibitionInfo(sources: Sources): Sinks {
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
        <h3>{title}</h3>
        <div>{blurb}</div>
      </div>
    </div>
  );
  return vdom$;
}
