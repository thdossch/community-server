import { AsyncHandler } from '../../../src/util/AsyncHandler';
import { CompositeAsyncHandler } from '../../../src/util/CompositeAsyncHandler';
import { StaticAsyncHandler } from '../../util/StaticAsyncHandler';

describe('A CompositeAsyncHandler', (): void => {
  describe('with no handlers', (): void => {
    it('can never handle data.', async(): Promise<void> => {
      const handler = new CompositeAsyncHandler([]);

      await expect(handler.canHandle(null)).rejects.toThrow(Error);
    });

    it('errors if its handle function is called.', async(): Promise<void> => {
      const handler = new CompositeAsyncHandler([]);

      await expect(handler.handle(null)).rejects.toThrow(Error);
    });
  });

  describe('with multiple handlers', (): void => {
    let handlerTrue: AsyncHandler<any, any>;
    let handlerFalse: AsyncHandler<any, any>;
    let canHandleFn: jest.Mock<Promise<void>, [any]>;
    let handleFn: jest.Mock<Promise<void>, [any]>;

    beforeEach(async(): Promise<void> => {
      handlerTrue = new StaticAsyncHandler(true, null);
      handlerFalse = new StaticAsyncHandler(false, null);

      canHandleFn = jest.fn(async(input: any): Promise<any> => input);
      handleFn = jest.fn(async(input: any): Promise<any> => input);
      handlerTrue.canHandle = canHandleFn;
      handlerTrue.handle = handleFn;
    });

    it('can handle data if a handler supports it.', async(): Promise<void> => {
      const handler = new CompositeAsyncHandler([ handlerFalse, handlerTrue ]);

      await expect(handler.canHandle(null)).resolves.toBeUndefined();
    });

    it('can not handle data if no handler supports it.', async(): Promise<void> => {
      const handler = new CompositeAsyncHandler([ handlerFalse, handlerFalse ]);

      await expect(handler.canHandle(null)).rejects.toThrow('[Not supported., Not supported.]');
    });

    it('handles data if a handler supports it.', async(): Promise<void> => {
      const handler = new CompositeAsyncHandler([ handlerFalse, handlerTrue ]);

      await expect(handler.handle('test')).resolves.toEqual('test');
      expect(canHandleFn).toHaveBeenCalledTimes(1);
      expect(handleFn).toHaveBeenCalledTimes(1);
    });

    it('errors if the handle function is called but no handler supports the data.', async(): Promise<void> => {
      const handler = new CompositeAsyncHandler([ handlerFalse, handlerFalse ]);

      await expect(handler.handle('test')).rejects.toThrow('All handlers failed.');
    });

    it('only calls the canHandle function once of its handlers when handleSafe is called.', async(): Promise<void> => {
      const handler = new CompositeAsyncHandler([ handlerFalse, handlerTrue ]);

      await expect(handler.handleSafe('test')).resolves.toEqual('test');
      expect(canHandleFn).toHaveBeenCalledTimes(1);
      expect(handleFn).toHaveBeenCalledTimes(1);
    });

    it('throws the canHandle error when calling handleSafe if the data is not supported.', async(): Promise<void> => {
      const handler = new CompositeAsyncHandler([ handlerFalse, handlerFalse ]);

      await expect(handler.handleSafe(null)).rejects.toThrow('[Not supported., Not supported.]');
    });
  });
});
