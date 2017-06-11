import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';

import { Sources, Sinks } from './interfaces';

export type BubbleSources = Sources & { onion: StateSource<BubbleState> };
export type BubbleSinks = Sinks & { onion: Stream<Reducer> };
export type Reducer = (prev: BubbleState) => BubbleState;
export type BubbleState = {
  id: string;
  thumbnail: string;
  color: string;
  isUpcoming: boolean;
};

export function Bubble(sources: BubbleSources): BubbleSinks {
  const vdom$: Stream<VNode> = view(sources.onion.state$);

  return {
    DOM: vdom$,
    onion: xs.never()
  };
}

function view(state$: Stream<BubbleState>): Stream<VNode> {
  return state$.map(({ id, thumbnail, color, isUpcoming }) =>
    <a href="#info" id={id}>
      {isUpcoming ? <div>Coming Soon</div> : undefined}
      <img src={thumbnail} />
    </a>
  );
}