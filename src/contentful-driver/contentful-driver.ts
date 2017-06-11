import xs, { Stream, MemoryStream } from 'xstream';
import { Driver } from '@cycle/run';
import { adapt } from '@cycle/run/lib/adapt';
import { MainContentfulSource } from './source';
import {
  ContentfulSource,
  ResponseStream,
  RequestOptions,
  Response,
  ResponseContent
} from './interfaces';
import {
  createClient,
  CreateClientParams,
  ContentfulClientApi
} from 'contentful';

export function optionsToClient(
  reqOptions: RequestOptions,
  client: ContentfulClientApi
): Promise<Response> {
  let clientPromise: Promise<ResponseContent>;
  if (reqOptions.method === 'getEntry') {
    clientPromise = reqOptions.id
      ? client.getEntry(reqOptions.id, reqOptions.query)
      : Promise.reject(new Error('Method getEntry requires id field'));
  } else if (reqOptions.method === 'getEntries') {
    clientPromise = client.getEntries(reqOptions.query);
  } else {
    clientPromise = Promise.reject(new Error('Invalid method'));
  }
  return clientPromise.then<Response>(res => ({
    request: reqOptions,
    content: res
  }));
}

export function createResponse$(
  reqOptions: RequestOptions,
  client: ContentfulClientApi
): Stream<Response> {
  return xs.fromPromise<Response>(optionsToClient(reqOptions, client));
}

export type ResponseMemoryStream = MemoryStream<Response> & ResponseStream;

function requestInputToResponse$(
  reqOptions: RequestOptions,
  client: ContentfulClientApi
): ResponseMemoryStream {
  let response$ = createResponse$(reqOptions, client).remember();
  response$ = adapt(response$);
  Object.defineProperty(response$, 'request', {
    value: reqOptions,
    writable: false
  });
  return response$ as ResponseMemoryStream;
}

export function makeContentfulDriver(
  params: CreateClientParams
): Driver<Stream<RequestOptions>, ContentfulSource> {
  const client = createClient(params);
  function contentfulDriver(
    request$: Stream<RequestOptions>,
    name: string
  ): ContentfulSource {
    const response$$ = request$.map(x => requestInputToResponse$(x, client));
    const contentfulSource = new MainContentfulSource(response$$, name, []);
    response$$.addListener({
      next: () => {},
      error: () => {},
      complete: () => {}
    });
    return contentfulSource;
  }
  return contentfulDriver;
}
