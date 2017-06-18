import xs, { Stream } from 'xstream';
import { VNode } from '@cycle/dom';
import isolate from '@cycle/isolate';
import { StateSource, Lens } from 'cycle-onionify';

import { Sources as RootSources } from './interfaces';
import { SelectedItem } from './app';
import {
  ExhibitionInfo,
  State as ExhibitionInfoState,
  Sinks as ExhibitionInfoSinks,
  Sources as ExhibitionInfoSources
} from './exhibition-info';
import { style, media } from 'typestyle';
import { percent, px } from 'csx';
import { padding } from 'csstips/lib';

export type Sources = RootSources & {
  onion: StateSource<State>;
};
export type Sinks = { DOM: Stream<VNode>; onion: Stream<Reducer> };
export type Reducer = (prev: State) => State;
export type State = SelectedItem;

namespace Styles {
  export const containerClass = style(
    {
      margin: 'auto',
      position: 'relative'
    },
    media(
      { minWidth: 0, maxWidth: 599 },
      { borderRadius: px(20), width: percent(100), height: 'auto' },
      padding(20)
    ),
    media(
      { minWidth: 600, maxWidth: 1149 },
      { borderRadius: '50px 50px 0 0', maxWidth: px(640), width: percent(90) },
      padding(20)
    ),
    media(
      { minWidth: 1150 },
      { borderRadius: percent(50), width: px(640), height: px(640) },
      padding(0)
    )
  );
}

export function InfoSection(sources: Sources): Sinks {
  const setupExhibitionInfo = () => {
    const exhibitionInfoLens: Lens<State, ExhibitionInfoState> = {
      get: state => {
        if (state) {
          return state.exhibition;
        } else {
          return undefined;
        }
      },
      set: (state, childState) => state
    };

    const exhibitionInfoSinks: ExhibitionInfoSinks = isolate(ExhibitionInfo, {
      onion: exhibitionInfoLens
    })(sources);

    return exhibitionInfoSinks;
  };

  const exhibitionInfoSinks = setupExhibitionInfo();
  const vdom$: Stream<VNode> = view(
    sources.onion.state$,
    exhibitionInfoSinks.DOM
  );

  return {
    DOM: vdom$,
    onion: xs.never()
  };
}

function view(
  state$: Stream<State>,
  exhibitionInfoVDom$: Stream<VNode>
): Stream<VNode> {
  const vdom$ = xs
    .combine(state$, exhibitionInfoVDom$)
    .map(([state, exhibitionInfoVDom]) => {
      if (state.exhibition) {
        return (
          <div
            className={Styles.containerClass}
            style={{ backgroundColor: state.color } as any}
          >
            {exhibitionInfoVDom}
          </div>
        );
      }
      return <div />;
    });
  return vdom$.startWith(<div />);
}
