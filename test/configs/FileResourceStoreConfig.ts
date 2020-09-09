import {
  AcceptPreferenceParser,
  AclManager,
  AuthenticatedLdpHandler,
  CompositeAsyncHandler,
  HttpHandler,
  InteractionController,
  MetadataController,
  Operation,
  QuadToTurtleConverter,
  RepresentationConvertingStore,
  ResourceStore,
  ResponseDescription,
  RuntimeConfig,
  TurtleToQuadConverter,
} from '../..';
import { UnsecureWebIdExtractor } from '../../src/authentication/UnsecureWebIdExtractor';
import { AllowEverythingAuthorizer } from '../../src/authorization/AllowEverythingAuthorizer';
import { UrlBasedAclManager } from '../../src/authorization/UrlBasedAclManager';
import { BasicRequestParser } from '../../src/ldp/http/BasicRequestParser';
import { BasicResponseWriter } from '../../src/ldp/http/BasicResponseWriter';
import { BasicTargetExtractor } from '../../src/ldp/http/BasicTargetExtractor';
import { RawBodyParser } from '../../src/ldp/http/RawBodyParser';
import { DeleteOperationHandler } from '../../src/ldp/operations/DeleteOperationHandler';
import { GetOperationHandler } from '../../src/ldp/operations/GetOperationHandler';
import { PostOperationHandler } from '../../src/ldp/operations/PostOperationHandler';
import { PutOperationHandler } from '../../src/ldp/operations/PutOperationHandler';
import { MethodPermissionsExtractor } from '../../src/ldp/permissions/MethodPermissionsExtractor';
import { FileResourceStore } from '../../src/storage/FileResourceStore';
import { ServerConfig } from '../configs/ServerConfig';

// This is the configuration from bin/server.ts

export class FileResourceStoreConfig implements ServerConfig {
  public store: ResourceStore;
  public aclManager: AclManager;

  public constructor() {
    this.store = new FileResourceStore(
      new RuntimeConfig({
        base: 'http://test.com',
        rootFilepath: 'uploads/',
      }),
      new InteractionController(),
      new MetadataController(),
    );

    this.aclManager = new UrlBasedAclManager();
  }

  public getHandler(): HttpHandler {
    const requestParser = new BasicRequestParser({
      targetExtractor: new BasicTargetExtractor(),
      preferenceParser: new AcceptPreferenceParser(),
      bodyParser: new RawBodyParser(),
    });

    const credentialsExtractor = new UnsecureWebIdExtractor();
    const permissionsExtractor = new CompositeAsyncHandler([
      new MethodPermissionsExtractor(),
    ]);
    const authorizer = new AllowEverythingAuthorizer();

    const converter = new CompositeAsyncHandler([
      new QuadToTurtleConverter(),
      new TurtleToQuadConverter(),
    ]);
    const convertingStore = new RepresentationConvertingStore(this.store, converter);

    const operationHandler = new CompositeAsyncHandler<
    Operation,
    ResponseDescription
    >([
      new GetOperationHandler(convertingStore),
      new PostOperationHandler(convertingStore),
      new DeleteOperationHandler(convertingStore),
      new PutOperationHandler(convertingStore),
    ]);

    const responseWriter = new BasicResponseWriter();

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