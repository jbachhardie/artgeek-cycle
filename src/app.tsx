import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import isolate from '@cycle/isolate';
import * as moment from 'moment';
import { Entry, EntryCollection } from 'contentful';
import { StateSource, Lens } from 'cycle-onionify';
import { style, media, types as TypeStyle } from 'typestyle';
import { px, rem } from 'csx';
import { padding, vertical, verticallySpaced } from 'csstips';

import { Sources as RootSources, Exhibition, Gallery } from './interfaces';

import {
  RequestOptions,
  ContentfulSource,
  Response
} from './contentful-driver';

import {
  BubbleMenu,
  State as BubbleMenuState,
  Sinks as BubbleMenuSinks
} from './bubble-menu';

import {
  InfoSection,
  Sources as InfoSectionSources,
  State as InfoSectionState,
  Sinks as InfoSectionSinks
} from './info-section';

export interface AppConfig {
  title: string;
  colors: Array<string>;
}

export type SelectedItem = {
  color: string;
  exhibition: Exhibition;
  gallery: Gallery;
};

export type State = {
  config?: AppConfig;
  exhibitions: Array<Exhibition>;
  bubbles: BubbleMenuState;
  selection?: SelectedItem;
};

export interface SetSelection {
  type: 'SET_SELECTION';
  payload: { exhibitionTitle: string; color: string };
}

export type Action = SetSelection;

export type Sources = RootSources & { onion: StateSource<State> };

export type Sinks = {
  DOM: Stream<VNode>;
  contentful: Stream<RequestOptions>;
  onion: Stream<Reducer>;
};

export type Reducer = (prev?: State) => State | undefined;

namespace Styles {
  const headingStyle: TypeStyle.CSSProperties = {
    color: '#462065',
    textTransform: 'uppercase'
  };

  export const appClass = style(
    { maxWidth: px(1200), margin: 'auto' },
    padding(0, rem(2)),
    vertical,
    verticallySpaced(20)
  );

  export const titleHeadingClass = style(
    {
      textAlign: 'center',
      marginBottom: 0
    },
    headingStyle,
    media({ minWidth: 600 }, { fontSize: rem(5) }),
    media({ minWidth: 0, maxWidth: 599 }, { fontSize: rem(2.5) })
  );

  export const headingHighlightClass = style({
    color: '#fe7a5a',
    fontWeight: 'bold'
  });

  export const menuSectionClass = style({
    maxWidth: px(1200),
    textAlign: 'center'
  });
  export const menuHeadingClass = style({ textAlign: 'left' }, headingStyle);

  export const infoSectionClass = style({ paddingTop: rem(4) });
}

export function App(sources: Sources): Sinks {
  const setupBubbleMenu = () => {
    const bubbleLens: Lens<State, BubbleMenuState> = {
      get: state => {
        if (state && state.config) {
          return state.exhibitions
            .filter(item => {
              return moment(item.ends).hour(23).isAfter(moment());
            })
            .map((item, index) => ({
              exhibitionTitle: item.title,
              thumbnail: item.thumbnail.fields.file.url,
              isUpcoming: moment(item.begins).isAfter(moment()),
              color: state.config!.colors[index]
            }));
        } else {
          return undefined;
        }
      },
      set: (state, childState) => state
    };

    const bubbleMenuSinks: BubbleMenuSinks = isolate(BubbleMenu, {
      onion: bubbleLens
    })((sources as any) as Sources);

    return bubbleMenuSinks;
  };

  const setupInfoSection = () => {
    const infoSectionLens: Lens<State, InfoSectionState> = {
      get: state => {
        if (state) {
          return state.selection;
        } else {
          return undefined;
        }
      },
      set: (state, childState) => state
    };

    const infoSectionSinks: InfoSectionSinks = isolate(InfoSection, {
      onion: infoSectionLens
    })((sources as any) as InfoSectionSources);

    return infoSectionSinks;
  };

  const bubbleMenuSinks = setupBubbleMenu();
  const infoSectionSinks = setupInfoSection();

  const { request$ } = intent(sources.onion.state$, sources.DOM);
  const reducer$ = model(bubbleMenuSinks.action, sources.contentful);
  const vdom$ = view(xs.combine(bubbleMenuSinks.DOM, infoSectionSinks.DOM));

  return {
    contentful: request$,
    DOM: vdom$,
    onion: xs.merge(reducer$, (bubbleMenuSinks.onion as any) as Stream<Reducer>)
  };
}

function intent(
  state$: Stream<State>,
  domSource: DOMSource
): { request$: Stream<RequestOptions> } {
  const buildRequest$ = () => {
    const initConfig$: Stream<RequestOptions> = xs.of<RequestOptions>({
      method: 'getEntry',
      id: '5zSFnoooRqmIWqOUyEsWgo',
      category: 'config'
    });
    const initExhibitions$: Stream<RequestOptions> = xs.of<RequestOptions>({
      method: 'getEntries',
      category: 'exhibitions',
      query: {
        content_type: 'exhibition'
      }
    });

    return xs.merge(initConfig$, initExhibitions$);
  };

  return {
    request$: buildRequest$()
  };
}

function model(
  action$: Stream<Action>,
  contentful: ContentfulSource
): Stream<Reducer> {
  const loadConfig = (res: Response): Reducer => {
    const config: AppConfig = (res.content as Entry<AppConfig>).fields;
    return prevState => ({ ...prevState, config: config });
  };

  const loadExhibitions = (res: Response): Reducer => {
    const exhibitions = (res.content as EntryCollection<Exhibition>).items.map(
      item => item.fields
    );
    return prevState => ({ ...prevState, exhibitions: exhibitions });
  };

  const init$: Stream<Reducer> = xs.of<Reducer>(() => ({
    exhibitions: [],
    bubbles: []
  }));

  const loadConfig$ = contentful.select('config').flatten().map(loadConfig);

  const loadExhibitions$ = contentful
    .select('exhibitions')
    .flatten()
    .map(loadExhibitions);

  const setSelection$ = action$
    .filter(({ type }) => type === 'SET_SELECTION')
    .map<Reducer>(({ payload }) => prevState => {
      if (prevState && prevState.config) {
        const selectedExhibition = prevState.exhibitions.find(
          item => item.title === payload.exhibitionTitle
        );
        if (selectedExhibition) {
          return {
            ...prevState,
            selection: {
              exhibition: selectedExhibition,
              gallery: selectedExhibition.gallery.fields,
              color: payload.color
            }
          };
        }
      }
      return prevState;
    });

  return xs.merge(init$, loadConfig$, loadExhibitions$, setSelection$);
}

function view(childVDom$: Stream<[VNode, VNode]>): Stream<VNode> {
  return childVDom$.map(([bubbleMenu, infoSection]) =>
    <div className={Styles.appClass}>
      <section>
        <h1 className={Styles.titleHeadingClass}>
          The ArtGeek Guide
          {' '}
          <strong className={Styles.headingHighlightClass}>
            To Dundee
          </strong>
        </h1>
      </section>
      <section className={Styles.menuSectionClass}>
        <h2 className={Styles.menuHeadingClass}>This month's exhibits</h2>
        {bubbleMenu}
      </section>
      <section className={Styles.infoSectionClass}>
        {infoSection}
      </section>
    </div>
  );
}
