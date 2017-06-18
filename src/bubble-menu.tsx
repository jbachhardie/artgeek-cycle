import xs, { Stream } from 'xstream';
import isolate from '@cycle/isolate';
import { StateSource, pick, mix } from 'cycle-onionify';

import { Sources as RootSources } from './interfaces';
import { State as BubbleState, Bubble } from './bubble';
import { VNode } from '@cycle/dom/lib';
import { Action } from './app';

export type Sources = RootSources & {
  onion: StateSource<State>;
};
export type Sinks = {
  DOM: Stream<VNode>;
  onion: Stream<Reducer>;
  action: Stream<Action>;
};
export type Reducer = (prev: State) => State;
export type State = Array<BubbleState>;

export function BubbleMenu(sources: Sources): Sinks {
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

  const action$ = childrenSinks$
    .compose(pick(sinks => sinks.action))
    .compose(mix(xs.merge));

  return {
    DOM: vdom$,
    onion: reducer$,
    action: action$
  };
}
