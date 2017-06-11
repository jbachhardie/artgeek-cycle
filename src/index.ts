import xs from 'xstream';
import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';
import { makeContentfulDriver } from './contentful-driver';
import onionify from 'cycle-onionify';

import { Component, Sources, RootSinks } from './interfaces';
import { App } from './app';

const main: Component = onionify(App);

const drivers: any = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
  contentful: makeContentfulDriver({
    accessToken:
      'a9eca5be56c5c684c02249acc9e65ccafe8caebd8135d3612a11ddb24496fbcd',
    space: '43cqz5fm9g1u'
  })
};
export const driverNames: string[] = Object.keys(drivers);

// Cycle apps (main functions) are allowed to return any number of sinks streams
// This sets defaults for all drivers that are not used by the app
const defaultSinks: (s: Sources) => RootSinks = sources => ({
  ...driverNames.map(n => ({ [n]: xs.never() })).reduce(Object.assign, {}),
  ...main(sources)
});

run(defaultSinks, drivers);
