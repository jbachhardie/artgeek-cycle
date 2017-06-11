import xs, { Stream } from 'xstream';
import isolate from '@cycle/isolate';
import { StateSource, pick, mix } from 'cycle-onionify';

import { Sources, Sinks } from './interfaces';
import { BubbleState, Bubble } from './bubble';

export type BubbleMenuSources = Sources & {
  onion: StateSource<BubbleMenuState>;
};
export type BubbleMenuSinks = Sinks & { onion: Stream<Reducer> };
export type Reducer = (prev: BubbleMenuState) => BubbleMenuState;
export type BubbleMenuState = Array<BubbleState>;

export function BubbleMenu(sources: BubbleMenuSources): BubbleMenuSinks {
  const array$ = sources.onion.state$;

  const childrenSinks$ = array$.map(array =>
    array.map((item, i) => isolate(Bubble, i)(sources))
  );

  const vdom$ = childrenSinks$
    .compose(pick(sinks => sinks.DOM))
    .compose(mix(xs.combine));

  const reducer$ = childrenSinks$
    .compose(pick(sinks => sinks.onion))
    .compose(mix(xs.merge));

  return {
    DOM: vdom$,
    onion: reducer$
  };
}
