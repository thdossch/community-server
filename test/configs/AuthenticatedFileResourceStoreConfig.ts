import {
  AuthenticatedLdpHandler,
  BasicResponseWriter,
  CompositeAsyncHandler,
  HttpHandler,
  MethodPermissionsExtractor,
  RdfToQuadConverter,
  ResourceStore,
  UnsecureWebIdExtractor,
  QuadToRdfConverter,
} from '../../index';
import { ServerConfig } from '../configs/ServerConfig';
import {
  getFileResourceStore,
  getConvertingStore,
  getBasicRequestParser,
  getOperationHandler,
  getWebAclAuthorizer,
} from './Util';

/**
 * AuthenticatedFileResourceStoreConfig works with
 * - a WebAclAuthorizer
 * - a FileResourceStore wrapped in a converting store (rdf to quad & quad to rdf)
 * - GET, POST, PUT & DELETE operation handlers
 */

export class AuthenticatedFileResourceStoreConfig implements ServerConfig {
  public store: ResourceStore;

  public constructor() {
    this.store = getConvertingStore(
      getFileResourceStore(),
      [ new QuadToRdfConverter(),
        new RdfToQuadConverter() ],
    );
  }

  public getHttpHandler(): HttpHandler {
    const requestParser = getBasicRequestParser();

    const credentialsExtractor = new UnsecureWebIdExtractor();
    const permissionsExtractor = new CompositeAsyncHandler([
      new MethodPermissionsExtractor(),
    ]);

    const operationHandler = getOperationHandler(this.store, { get: true, post: true, put: true, delete: true });

    const responseWriter = new BasicResponseWriter();
    const authorizer = getWebAclAuthorizer(this.store);

    const handler = new AuthenticatedLdpHandler({
      requestParser,
      credentialsExtractor,
      permissionsExtractor,
      authorizer,
      operationHandler,
      responseWriter,
    });

    return handler;
  }
}
