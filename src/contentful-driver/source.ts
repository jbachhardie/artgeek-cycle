import { Stream, MemoryStream } from 'xstream';
import { ContentfulSource } from './interfaces';
import { DevToolEnabledSource } from '@cycle/run';
import { adapt } from '@cycle/run/lib/adapt';
import { Response, ResponseStream, RequestOptions } from './interfaces';

export class MainContentfulSource implements ContentfulSource {
  constructor(
    private _res$$: Stream<MemoryStream<Response> & ResponseStream>,
    private _name: string,
    private _namespace: Array<string> = []
  ) {}

  public filter(
    predicate: (request: RequestOptions) => boolean
  ): ContentfulSource {
    const filteredResponse$$ = this._res$$.filter(r$ => predicate(r$.request));
    return new MainContentfulSource(
      filteredResponse$$,
      this._name,
      this._namespace
    );
  }

  public select(category?: string): any {
    const res$$ = category
      ? this._res$$.filter(
          res$ => res$.request && res$.request.category === category
        )
      : this._res$$;
    const out: DevToolEnabledSource = adapt(res$$);
    out._isCycleSource = this._name;
    return out;
  }

  public isolateSource(
    httpSource: ContentfulSource,
    scope: string | undefined
  ): ContentfulSource {
    if (scope === undefined) {
      return httpSource;
    }
    return httpSource.filter(
      (request: RequestOptions) =>
        Array.isArray(request._namespace) &&
        request._namespace.indexOf(scope) !== -1
    );
  }

  public isolateSink(
    request$: Stream<RequestOptions>,
    scope: string | undefined
  ): Stream<RequestOptions> {
    if (scope === undefined) {
      return request$;
    }
    return request$.map((req: RequestOptions) => {
      req._namespace = req._namespace || [];
      req._namespace.push(scope);
      return req;
    });
  }
}
