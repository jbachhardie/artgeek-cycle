import { Stream, MemoryStream } from 'xstream';
import { Entry, EntryCollection } from 'contentful';

export interface Attachment {
  name: string;
  path?: string;
  filename?: string;
}

export interface AgentOptions {
  key: string;
  cert: string;
}

export interface BaseRequestOptions {
  category?: string;
  _namespace?: Array<string>;
}
export interface GetEntryOptions extends BaseRequestOptions {
  method: 'getEntry';
  id: string;
  query?: any;
}
export interface GetEntriesOptions extends BaseRequestOptions {
  method: 'getEntries';
  query?: any;
}

export type RequestOptions = GetEntryOptions | GetEntriesOptions;

export interface ResponseStream {
  request: RequestOptions;
}

export type ResponseContent = Entry<any> | EntryCollection<any>;
export interface Response {
  request: RequestOptions;
  content: ResponseContent;
}

export interface ContentfulSource {
  filter<S extends ContentfulSource>(
    predicate: (request: RequestOptions) => boolean
  ): S;
  select(category?: string): Stream<MemoryStream<Response> & ResponseStream>;
  isolateSource(source: ContentfulSource, scope: string): ContentfulSource;
  isolateSink(
    sink: Stream<RequestOptions>,
    scope: string
  ): Stream<RequestOptions>;
}
