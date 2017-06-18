import xs, { Stream } from 'xstream';
import { VNode } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';

import { Sources as RootSources } from './interfaces';
import { SelectedItem } from './app';

export type Sources = RootSources & {
  onion: StateSource<State>;
};
export type Sinks = { DOM: Stream<VNode>; onion: Stream<Reducer> };
export type Reducer = (prev: State) => State;
export type State = SelectedItem;

export function InfoSection(sources: Sources): Sinks {
  const vdom$: Stream<VNode> = view(sources.onion.state$);

  return {
    DOM: vdom$,
    onion: xs.never()
  };
}

function view(state$: Stream<State>): Stream<VNode> {
  const init$ = xs.of(<div />);
  const vdom$ = state$.map(state => <div>{state.exhibition}</div>);
  return xs.merge(init$, vdom$);
}
