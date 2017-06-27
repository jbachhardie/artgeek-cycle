import xs, { Stream } from 'xstream';
import { VNode } from '@cycle/dom';
import isolate from '@cycle/isolate';
import { StateSource, Lens } from 'cycle-onionify';

import { Sources as RootSources } from './interfaces';
import { SelectedItem } from './app';
import * as ExhibitionInfo from './exhibition-info';
import * as LocationInfo from './location-info';
import { style, media } from 'typestyle';
import { percent, px } from 'csx';
import { padding } from 'csstips';

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
    const exhibitionInfoLens: Lens<State, ExhibitionInfo.State> = {
      get: state => {
        if (state) {
          return state.exhibition;
        } else {
          return undefined;
        }
      },
      set: (state, childState) => state
    };

    const exhibitionInfoSinks: ExhibitionInfo.Sinks = isolate(
      ExhibitionInfo.Component,
      {
        onion: exhibitionInfoLens
      }
    )(sources);

    return exhibitionInfoSinks;
  };

  const setupLocationInfo = () => {
    const locationInfoLens: Lens<State, LocationInfo.State> = {
      get: state => {
        if (state) {
          return { color: state.color, gallery: state.gallery };
        } else {
          return undefined;
        }
      },
      set: (state, childState) => state
    };

    const locationInfoSinks: LocationInfo.Sinks = isolate(
      LocationInfo.Component,
      {
        onion: locationInfoLens
      }
    )(sources);

    return locationInfoSinks;
  };

  const exhibitionInfoSinks = setupExhibitionInfo();
  const locationInfoSinks = setupLocationInfo();

  const vdom$: Stream<VNode> = view(
    xs.combine(
      sources.onion.state$,
      exhibitionInfoSinks.DOM,
      locationInfoSinks.DOM
    )
  );

  return {
    DOM: vdom$,
    onion: xs.never()
  };
}

function view(combined$: Stream<[State, VNode, VNode]>): Stream<VNode> {
  const vdom$ = combined$.map(
    ([state, exhibitionInfoVDom, locationInfoVDom]) => {
      if (state.exhibition) {
        return (
          <div
            className={Styles.containerClass}
            style={{ backgroundColor: state.color } as any}
          >
            {exhibitionInfoVDom}
            {locationInfoVDom}
          </div>
        );
      }
      return <div />;
    }
  );
  return vdom$.startWith(<div />);
}
