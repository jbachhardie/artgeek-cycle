import xs, { Stream } from 'xstream';
import { VNode } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';
import { style, media, classes } from 'typestyle';
import { px, percent, rem, url } from 'csx';

import { Sources as RootSources, Gallery } from './interfaces';

export type Sources = RootSources & {
  onion: StateSource<State>;
};
export type Sinks = { DOM: Stream<VNode>; onion: Stream<Reducer> };
export type Reducer = (prev: State) => State;
export type State = { gallery: Gallery; color: string };

namespace Styles {
  export const containerClass = style(
    {
      position: 'absolute',
      borderRadius: percent(50),
      fontSize: rem(6)
    },
    media({ minWidth: 0, maxWidth: 599 }, { width: px(100), height: px(100) }),
    media(
      { minWidth: 600, maxWidth: 1149 },
      { top: 0, left: 0, width: px(200), height: px(200) }
    ),
    media(
      { minWidth: 1150 },
      { top: px(-30), left: px(-110), width: px(200), height: px(200) }
    )
  );
  export const imageClass = style(
    {
      position: 'absolute',
      borderRadius: percent(50),
      width: px(80),
      height: px(80),
      top: px(10),
      left: px(10),
      fontSize: rem(3)
    },
    media(
      { minWidth: 600 },
      {
        width: px(160),
        height: px(160),
        top: px(20),
        left: px(20),
        fontSize: 'inherit'
      }
    )
  );
  export const iconClass = style({
    position: 'absolute',
    left: px(50),
    top: px(20)
  });
}

export function Component(sources: Sources): Sinks {
  const vdom$: Stream<VNode> = view(sources.onion.state$);

  return {
    DOM: vdom$,
    onion: xs.never()
  };
}

function view(state$: Stream<State>): Stream<VNode> {
  const vdom$ = state$.map(({ gallery, color }) =>
    <a
      href={gallery.location}
      target="_blank"
      style={{ backgroundColor: color } as any}
      className={Styles.containerClass}
    >
      <div
        className={Styles.imageClass}
        style={
          { backgroundImage: url(gallery.thumbnail.fields.file.url) } as any
        }
      >
        <div className={Styles.iconClass}>
          <i
            className={classes('fa', 'fa-map-marker')}
            style={{ color: color } as any}
          />
        </div>
      </div>
    </a>
  );
  return vdom$;
}
