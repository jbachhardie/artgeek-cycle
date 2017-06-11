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

import { Sources, Sinks, Exhibition } from './interfaces';

import { BubbleMenu, BubbleMenuSources, BubbleMenuState } from './bubble-menu';
import { BubbleState } from './bubble';

export type AppSources = Sources & { onion: StateSource<AppState> };
export type AppSinks = Sinks & { onion: Stream<Reducer> };
export type Reducer = (prev: AppState) => AppState;
export interface AppConfig {
  title: string;
  colors: Array<string>;
}
export type AppState = {
  config?: AppConfig;
  exhibitions: Array<Exhibition>;
  bubbles: BubbleMenuState;
};

export function App(sources: AppSources): AppSinks {
  const bubbleLens: Lens<AppState, BubbleMenuState> = {
    get: state => {
      if (state && state.config) {
        return state.exhibitions.map((item, index) =>
          exhibitionToBubble(item, state.config!.colors[index])
        );
      } else {
        return undefined;
      }
    },
    set: (state, childState) => state
  };
  const bubbleMenuSinks = isolate(BubbleMenu, { onion: bubbleLens })(
    (sources as any) as BubbleMenuSources
  );
  const request$: Stream<RequestOptions> = requests(sources.onion.state$);
  const reducer$: Stream<Reducer> = model(sources.DOM, sources.contentful);
  const vdom$: Stream<VNode> = view(bubbleMenuSinks.DOM);

  return {
    contentful: request$,
    DOM: vdom$,
    onion: xs.merge(reducer$, (bubbleMenuSinks.onion as any) as Stream<Reducer>)
  };
}

function requests(state$: Stream<AppState>): Stream<RequestOptions> {
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
}

function loadConfig(res: Response): Reducer {
  const config: AppConfig = (res.content as Entry<AppConfig>).fields;
  return prevState => ({ ...prevState, config: config });
}

function loadExhibitions(res: Response): Reducer {
  const exhibitions = (res.content as EntryCollection<Exhibition>).items.map(
    item => item.fields
  );
  return prevState => ({ ...prevState, exhibitions: exhibitions });
}

function exhibitionToBubble(e: Exhibition, color: string): BubbleState {
  return {
    id: e.title,
    thumbnail: e.thumbnail.fields.file.url,
    isUpcoming: new Date(e.begins) > new Date(),
    color: color
  };
}

function model(DOM: DOMSource, contentful: ContentfulSource): Stream<Reducer> {
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

function view(childVDom$: Stream<VNode>): Stream<VNode> {
  return childVDom$.map(childVDom =>
    <div>
      <section>
        <h1>The ArtGeek Guide <strong>To Dundee</strong></h1>
      </section>
      <section>
        <h2>This month's exhibits</h2>
        {childVDom}
      </section>
    </div>
  );
}
