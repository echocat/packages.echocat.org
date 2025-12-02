import { describe, expect, it } from 'vitest';
import type { Environment } from './common';
import { handler } from './index';

const testEnvironment: Environment = {
   GITHUB_ACCESS_USER: 'testGithubAccessUser',
   GITHUB_ACCESS_TOKEN: 'testGithubAccessToken',
   KV: {
      put() {
         throw `Not implemented!`;
      },
      get() {
         throw `Not implemented!`;
      },
      list() {
         throw `Not implemented!`;
      },
      delete() {
         throw `Not implemented!`;
      },
      // @ts-expect-error
      getWithMetadataetadata() {
         throw `Not implemented!`;
      },
   },
};

describe('handler', () => {
   describe('fetch()', () => {
      it('should handle GET /latest/ and redirect to /', async () => {
         const result = await handler.fetch(new Request('http://falcon', { method: 'GET' }), testEnvironment);
         expect(result.status).toBe(301);
         expect(result.headers.get('Location')).toBe('https://github.com/echocat/packages.echocat.org');
      });
   });
});
