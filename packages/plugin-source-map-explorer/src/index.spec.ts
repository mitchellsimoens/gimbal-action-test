import realdeepmerge from 'deepmerge';
import { PluginOptions } from '@/typings/config/plugin';
import { Context } from '@/typings/context';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type Deepmerge = (x: any, y: any, opts?: any) => any;

const contextMock: unknown = {};
const context = contextMock as Context;

const pluginOptions: PluginOptions = {
  context,
  dir: 'foo',
};

beforeEach((): void => {
  jest.resetModules();
});

describe('@modus/gimbal-plugin-source-map-explorer', (): void => {
  it('should register module', async (): Promise<void> => {
    const deepmergeMock = jest.fn();
    const registerModule = jest.fn();

    jest.doMock(
      'deepmerge',
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      (): Deepmerge => (x: any, y: any, opts?: any): any => {
        deepmergeMock(x, y, opts);

        return realdeepmerge(x, y, opts);
      },
    );

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    jest.doMock('./mod', (): any => ({
      registerModule,
    }));

    const { default: plugin } = await import('./index');

    await plugin(pluginOptions, {
      bundles: [],
    });

    expect(deepmergeMock).toHaveBeenCalledWith(
      {
        bundles: ['**/*.js'],
      },
      {
        bundles: [],
      },
      {
        arrayMerge: expect.any(Function),
      },
    );

    expect(registerModule).toHaveBeenCalledWith(
      {
        context,
        dir: 'foo',
      },
      {
        bundles: ['**/*.js'],
      },
    );
  });

  it('should order bundles properly', async (): Promise<void> => {
    const deepmergeMock = jest.fn();
    const registerModule = jest.fn();

    jest.doMock(
      'deepmerge',
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      (): Deepmerge => (x: any, y: any, opts?: any): any => {
        deepmergeMock(x, y, opts);

        return realdeepmerge(x, y, opts);
      },
    );

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    jest.doMock('./mod', (): any => ({
      registerModule,
    }));

    const { default: plugin } = await import('./index');

    await plugin(pluginOptions, {
      bundles: [
        {
          path: '**/main.*.js',
          thresholds: {
            'App.js': '450 B',
            'index.js': '100 B',
            'logo.svg': '250 B',
            'serviceWorker.js': '300 B',
            '<unmapped>': '150 B',
          },
        },
        {
          path: '**/2.*.js',
          thresholds: {
            'react/index.js': '50 B',
            'object-assign/index.js': '1 KB',
            'react-dom/index.js': '300 B',
            'react/cjs/react.production.min.js': '7 KB',
            'react-dom/cjs/react-dom.production.min.js': '110 KB',
            'scheduler/index.js': '50 B',
            'scheduler/cjs/scheduler.production.min.js': '5 KB',
            'webpack/buildin/global.js': '150 B',
            '<unmapped>': '150 B',
          },
        },
        '!precache-manifest*',
        '!service-worker.js',
        '!**/runtime*.js',
      ],
    });

    expect(deepmergeMock).toHaveBeenCalledWith(
      {
        bundles: ['**/*.js'],
      },
      {
        bundles: [
          {
            path: '**/main.*.js',
            thresholds: {
              'App.js': '450 B',
              'index.js': '100 B',
              'logo.svg': '250 B',
              'serviceWorker.js': '300 B',
              '<unmapped>': '150 B',
            },
          },
          {
            path: '**/2.*.js',
            thresholds: {
              'react/index.js': '50 B',
              'object-assign/index.js': '1 KB',
              'react-dom/index.js': '300 B',
              'react/cjs/react.production.min.js': '7 KB',
              'react-dom/cjs/react-dom.production.min.js': '110 KB',
              'scheduler/index.js': '50 B',
              'scheduler/cjs/scheduler.production.min.js': '5 KB',
              'webpack/buildin/global.js': '150 B',
              '<unmapped>': '150 B',
            },
          },
          '!precache-manifest*',
          '!service-worker.js',
          '!**/runtime*.js',
        ],
      },
      {
        arrayMerge: expect.any(Function),
      },
    );

    expect(registerModule).toHaveBeenCalledWith(
      {
        context,
        dir: 'foo',
      },
      {
        bundles: [
          {
            path: '**/main.*.js',
            thresholds: {
              'App.js': '450 B',
              'index.js': '100 B',
              'logo.svg': '250 B',
              'serviceWorker.js': '300 B',
              '<unmapped>': '150 B',
            },
          },
          {
            path: '**/2.*.js',
            thresholds: {
              'react/index.js': '50 B',
              'object-assign/index.js': '1 KB',
              'react-dom/index.js': '300 B',
              'react/cjs/react.production.min.js': '7 KB',
              'react-dom/cjs/react-dom.production.min.js': '110 KB',
              'scheduler/index.js': '50 B',
              'scheduler/cjs/scheduler.production.min.js': '5 KB',
              'webpack/buildin/global.js': '150 B',
              '<unmapped>': '150 B',
            },
          },
          '**/*.js',
          '!precache-manifest*',
          '!service-worker.js',
          '!**/runtime*.js',
        ],
      },
    );
  });

  it('should order bundles properly with overwriting default catch all', async (): Promise<void> => {
    const deepmergeMock = jest.fn();
    const registerModule = jest.fn();

    jest.doMock(
      'deepmerge',
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      (): Deepmerge => (x: any, y: any, opts?: any): any => {
        deepmergeMock(x, y, opts);

        return realdeepmerge(x, y, opts);
      },
    );

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    jest.doMock('./mod', (): any => ({
      registerModule,
    }));

    const { default: plugin } = await import('./index');

    await plugin(pluginOptions, {
      bundles: [
        '!precache-manifest*',
        '!service-worker.js',
        '!**/runtime*.js',
        {
          path: '**/*.js',
          thresholds: {
            foo: '1 KB',
          },
        },
        {
          path: '**/main.*.js',
          thresholds: {
            'App.js': '450 B',
            'index.js': '100 B',
            'logo.svg': '250 B',
            'serviceWorker.js': '300 B',
            '<unmapped>': '150 B',
          },
        },
        {
          path: '**/2.*.js',
          thresholds: {
            'react/index.js': '50 B',
            'object-assign/index.js': '1 KB',
            'react-dom/index.js': '300 B',
            'react/cjs/react.production.min.js': '7 KB',
            'react-dom/cjs/react-dom.production.min.js': '110 KB',
            'scheduler/index.js': '50 B',
            'scheduler/cjs/scheduler.production.min.js': '5 KB',
            'webpack/buildin/global.js': '150 B',
            '<unmapped>': '150 B',
          },
        },
      ],
    });

    expect(deepmergeMock).toHaveBeenCalledWith(
      {
        bundles: ['**/*.js'],
      },
      {
        bundles: [
          '!precache-manifest*',
          '!service-worker.js',
          '!**/runtime*.js',
          {
            path: '**/*.js',
            thresholds: {
              foo: '1 KB',
            },
          },
          {
            path: '**/main.*.js',
            thresholds: {
              'App.js': '450 B',
              'index.js': '100 B',
              'logo.svg': '250 B',
              'serviceWorker.js': '300 B',
              '<unmapped>': '150 B',
            },
          },
          {
            path: '**/2.*.js',
            thresholds: {
              'react/index.js': '50 B',
              'object-assign/index.js': '1 KB',
              'react-dom/index.js': '300 B',
              'react/cjs/react.production.min.js': '7 KB',
              'react-dom/cjs/react-dom.production.min.js': '110 KB',
              'scheduler/index.js': '50 B',
              'scheduler/cjs/scheduler.production.min.js': '5 KB',
              'webpack/buildin/global.js': '150 B',
              '<unmapped>': '150 B',
            },
          },
        ],
      },
      {
        arrayMerge: expect.any(Function),
      },
    );

    expect(registerModule).toHaveBeenCalledWith(
      {
        context,
        dir: 'foo',
      },
      {
        bundles: [
          {
            path: '**/main.*.js',
            thresholds: {
              'App.js': '450 B',
              'index.js': '100 B',
              'logo.svg': '250 B',
              'serviceWorker.js': '300 B',
              '<unmapped>': '150 B',
            },
          },
          {
            path: '**/2.*.js',
            thresholds: {
              'react/index.js': '50 B',
              'object-assign/index.js': '1 KB',
              'react-dom/index.js': '300 B',
              'react/cjs/react.production.min.js': '7 KB',
              'react-dom/cjs/react-dom.production.min.js': '110 KB',
              'scheduler/index.js': '50 B',
              'scheduler/cjs/scheduler.production.min.js': '5 KB',
              'webpack/buildin/global.js': '150 B',
              '<unmapped>': '150 B',
            },
          },
          {
            path: '**/*.js',
            thresholds: {
              foo: '1 KB',
            },
          },
          '!precache-manifest*',
          '!service-worker.js',
          '!**/runtime*.js',
        ],
      },
    );
  });
});
