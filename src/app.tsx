import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import isolate from '@cycle/isolate';
import {
  RequestOptions,
  ContentfulSource,
  Response
} from './contentful-driver';
import { Entry, EntryCollection } from 'contentful';
import { StateSource, Lens } from 'cycle-onionify';

import { Sources as RootSources, Exhibition, Gallery } from './interfaces';

import {
  BubbleMenu,
  BubbleMenuSources,
  BubbleMenuState,
  BubbleMenuSinks
} from './bubble-menu';

import {
  InfoSection,
  InfoSectionSources,
  InfoSectionState,
  InfoSectionSinks
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
  payload: string;
}

export type Action = SetSelection;

export type Sources = RootSources & { onion: StateSource<State> };

export type Sinks = {
  DOM: Stream<VNode>;
  contentful: Stream<RequestOptions>;
  onion: Stream<Reducer>;
};

export type Reducer = (prev?: State) => State;

export function App(sources: Sources): Sinks {
  const setupBubbleMenu = () => {
    const bubbleLens: Lens<State, BubbleMenuState> = {
      get: state => {
        if (state && state.config) {
          return state.exhibitions.map((item, index) => ({
            id: item.title,
            thumbnail: item.thumbnail.fields.file.url,
            isUpcoming: new Date(item.begins) > new Date(),
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
    })((sources as any) as BubbleMenuSources);

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

  const { request$, action$ } = intent(sources.onion.state$, sources.DOM);
  const reducer$ = model(action$, sources.contentful);
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
): { request$: Stream<RequestOptions>; action$: Stream<Action> } {
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

  const buildAction$ = () => {
    return xs.never();
  };

  return {
    request$: buildRequest$(),
    action$: buildAction$()
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

  return xs.merge(init$, loadConfig$, loadExhibitions$);
}

function view(childVDom$: Stream<[VNode, VNode]>): Stream<VNode> {
  return childVDom$.map(([bubbleMenu, infoSection]) =>
    <div>
      <section>
        <h1>The ArtGeek Guide <strong>To Dundee</strong></h1>
      </section>
      <section>
        <h2>This month's exhibits</h2>
        {bubbleMenu}
      </section>
      <section>
        {infoSection}
      </section>
    </div>
  );
}
