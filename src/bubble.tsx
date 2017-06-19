import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';
import { style, classes } from 'typestyle';
import { em, px, percent } from 'csx';

import { Sources as RootSources } from './interfaces';
import { Action } from './app';

export type Sources = RootSources & { onion: StateSource<State> };
export type Sinks = {
  DOM: Stream<VNode>;
  onion: Stream<Reducer>;
  action: Stream<Action>;
};
export type Reducer = (prev: State) => State;
export type State = {
  exhibitionTitle: string;
  thumbnail: string;
  color: string;
  isUpcoming: boolean;
};

namespace Styles {
  export const bubbleClass = style({
    display: 'inline-block',
    margin: em(0.5),
    textDecoration: 'none'
  });

  export const bubbleImageClass = style({
    height: px(120),
    width: px(120),
    borderRadius: percent(50),
    padding: px(10)
  });

  export const bubbleOverlayClass = style({
    fontWeight: 'bold',
    fontSize: 'large',
    textTransform: 'uppercase',
    position: 'relative',
    top: px(84),
    width: px(120),
    textAlign: 'center'
  });

  export const clickableClass = style();
}

export function Bubble(sources: Sources): Sinks {
  const vdom$: Stream<VNode> = view(sources.onion.state$);
  const action$ = intent(sources.onion.state$, sources.DOM);

  return {
    DOM: vdom$,
    onion: xs.never(),
    action: action$
  };
}

function intent(state$: Stream<State>, domSource: DOMSource): Stream<Action> {
  const click$ = domSource
    .select('.' + Styles.clickableClass)
    .events('click', { preventDefault: true });

  // tslint:disable-next-line:no-unused-variable
  const action$ = xs.combine(click$, state$).map<Action>(([_, state]) => ({
    type: 'SET_SELECTION',
    payload: { exhibitionTitle: state.exhibitionTitle, color: state.color }
  }));

  return action$;
}

function view(state$: Stream<State>): Stream<VNode> {
  return state$.map(({ exhibitionTitle, color, thumbnail, isUpcoming }) =>
    <a href="#info" id={exhibitionTitle} className={Styles.bubbleClass}>
      {isUpcoming
        ? <div
            className={classes(
              Styles.bubbleOverlayClass,
              Styles.clickableClass
            )}
            style={{ color: color } as any}
          >
            Coming Soon
          </div>
        : undefined}
      <img
        src={thumbnail}
        className={classes(Styles.clickableClass, Styles.bubbleImageClass)}
        style={{ backgroundColor: color } as any}
      />
    </a>
  );
}
