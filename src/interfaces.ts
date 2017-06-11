import { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import { HTTPSource, RequestOptions } from '@cycle/http';
import {
  ContentfulSource,
  RequestOptions as ContentfulRequestOptions
} from './contentful-driver';
import { Asset, Entry } from 'contentful';

export type Sources = {
  DOM: DOMSource;
  HTTP: HTTPSource;
  contentful: ContentfulSource;
};

export type RootSinks = {
  DOM: Stream<VNode>;
  HTTP: Stream<RequestOptions>;
  contentful: Stream<ContentfulRequestOptions>;
};

export type Sinks = Partial<RootSinks>;
export type Component = (s: Sources) => Sinks;

export interface Gallery {
  name: string;
  blurb?: string;
  location: string;
  times?: Array<string>;
  thumbnail: Asset;
}
export interface Exhibition {
  title: string;
  blurb: string;
  begins: string;
  ends: string;
  times?: Array<string>;
  image: Asset;
  thumbnail: Asset;
  gallery: Entry<Gallery>;
}
