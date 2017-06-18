import xs, { Stream } from 'xstream';
import { VNode } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';

import { Sources } from './interfaces';
import { SelectedItem } from './app';

export type InfoSectionSources = Sources & {
  onion: StateSource<InfoSectionState>;
};
export type InfoSectionSinks = { DOM: Stream<VNode>; onion: Stream<Reducer> };
export type Reducer = (prev: InfoSectionState) => InfoSectionState;
export type InfoSectionState = SelectedItem;

export function InfoSection(sources: InfoSectionSources): InfoSectionSinks {
  const vdom$: Stream<VNode> = view(sources.onion.state$);

  return {
    DOM: vdom$,
    onion: xs.never()
  };
}

function view(state$: Stream<InfoSectionState>): Stream<VNode> {
  const init$ = xs.of(<div />);
  const vdom$ = state$.map(state => <div>{state.exhibition}</div>);
  return xs.merge(init$, vdom$);
}
