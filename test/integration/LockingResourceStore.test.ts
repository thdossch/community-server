import { promises as fs } from 'fs';
import * as url from 'url';
import { MockResponse } from 'node-mocks-http';
import { FileResourceStoreConfig } from '../../configs/FileResourceStoreConfig';
import { call, callFile } from '../util/Util';

describe('A server using a FileResourceStore', (): void => {
  describe('without acl', (): void => {
    const config = new FileResourceStoreConfig();
    const handler = config.getHandler();

    it('can add a file to the store, read it and delete it.', async(): Promise<
    void
    > => {
      // POST
      let requestUrl = new URL('http://test.com/');

      const fileData = await fs.readFile('test/testfiles/testfile1.txt');

      let response: MockResponse<any> = await callFile(
        handler,
        requestUrl,
        'POST',
        { 'content-type': 'application/octet-stream', slug: 'testfile1.txt', 'transfer-encoding': 'chunked' },
        fileData,
      );

      expect(response.statusCode).toBe(200);
      expect(response._getData()).toHaveLength(0);
      const id = response._getHeaders().location;
      expect(id).toContain(url.format(requestUrl));

      // GET
      requestUrl = new URL(id);
      response = await call(handler, requestUrl, 'GET', { accept: 'text/*' }, []);
      expect(response.statusCode).toBe(200);
      expect(response._getHeaders().location).toBe(id);
      expect(response._getBuffer().toString()).toContain('TESTFILE1');

      // DELETE
      response = await call(handler, requestUrl, 'DELETE', {}, []);
      expect(response.statusCode).toBe(200);
      expect(response._getData()).toHaveLength(0);
      expect(response._getHeaders().location).toBe(url.format(requestUrl));

      // GET
      response = await call(handler, requestUrl, 'GET', { accept: 'text/*' }, []);
      expect(response.statusCode).toBe(404);
      expect(response._getData()).toContain('NotFoundHttpError');
    });
  });
});
