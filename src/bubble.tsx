import xs, { Stream } from 'xstream';
import { VNode } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';
import { style } from 'typestyle';
import { em, px, percent, rem } from 'csx';

import { Sources as RootSources } from './interfaces';

export type Sources = RootSources & { onion: StateSource<State> };
export type Sinks = { DOM: Stream<VNode>; onion: Stream<Reducer> };
export type Reducer = (prev: State) => State;
export type State = {
  id: string;
  thumbnail: string;
  color: string;
  isUpcoming: boolean;
};

export const bubbleClass = style({
  display: 'inline-block',
  margin: em(0.5),
  textDecoration: 'none'
});

export const bubbleImageClass = style({
  height: px(100),
  width: px(100),
  borderRadius: percent(50),
  padding: rem(0.6)
});

export function Bubble(sources: Sources): Sinks {
  const vdom$: Stream<VNode> = view(sources.onion.state$);

  return {
    DOM: vdom$,
    onion: xs.never()
  };
}

function view(state$: Stream<State>): Stream<VNode> {
  return state$.map(({ id, color, thumbnail, isUpcoming }) =>
    <a href="#info" id={id} className={bubbleClass}>
      {isUpcoming ? <div>Coming Soon</div> : undefined}
      <img
        src={thumbnail}
        className={bubbleImageClass}
        style={{ backgroundColor: color } as any}
      />
    </a>
  );
}
