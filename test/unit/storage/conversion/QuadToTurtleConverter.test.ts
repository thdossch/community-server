import arrayifyStream from 'arrayify-stream';
import { CONTENT_TYPE } from '../../../../src/util/MetadataTypes';
import { QuadToTurtleConverter } from '../../../../src/storage/conversion/QuadToTurtleConverter';
import { Readable } from 'stream';
import { Representation } from '../../../../src/ldp/representation/Representation';
import { RepresentationMetadata } from '../../../../src/ldp/representation/RepresentationMetadata';
import { RepresentationPreferences } from '../../../../src/ldp/representation/RepresentationPreferences';
import { ResourceIdentifier } from '../../../../src/ldp/representation/ResourceIdentifier';
import streamifyArray from 'streamify-array';
import { CONTENT_TYPE_QUADS, DATA_TYPE_BINARY } from '../../../../src/util/ContentTypes';
import { namedNode, triple } from '@rdfjs/data-model';

describe('A QuadToTurtleConverter', (): void => {
  const converter = new QuadToTurtleConverter();
  const identifier: ResourceIdentifier = { path: 'path' };
  const metadata = new RepresentationMetadata();
  metadata.add(CONTENT_TYPE, CONTENT_TYPE_QUADS);

  it('can handle quad to turtle conversions.', async(): Promise<void> => {
    const representation = { metadata } as Representation;
    const preferences: RepresentationPreferences = { type: [{ value: 'text/turtle', weight: 1 }]};
    await expect(converter.canHandle({ identifier, representation, preferences })).resolves.toBeUndefined();
  });

  it('converts quads to turtle.', async(): Promise<void> => {
    const representation = {
      data: streamifyArray([ triple(
        namedNode('http://test.com/s'),
        namedNode('http://test.com/p'),
        namedNode('http://test.com/o'),
      ) ]),
      metadata,
    } as Representation;
    const preferences: RepresentationPreferences = { type: [{ value: 'text/turtle', weight: 1 }]};
    const result = await converter.handle({ identifier, representation, preferences });
    expect(result).toEqual({
      data: expect.any(Readable),
      dataType: DATA_TYPE_BINARY,
      metadata: expect.any(RepresentationMetadata),
    });
    expect(result.metadata.get(CONTENT_TYPE)?.value).toEqual('text/turtle');
    await expect(arrayifyStream(result.data)).resolves.toContain(
      '<http://test.com/s> <http://test.com/p> <http://test.com/o>',
    );
  });
});
