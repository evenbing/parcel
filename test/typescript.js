const assert = require('assert');
const fs = require('fs');
const {bundle, run, assertBundleTree} = require('./utils');

describe('typescript', function() {
  it('should produce a ts bundle using ES6 imports', async function() {
    let b = await bundle(__dirname + '/integration/typescript/index.ts');

    assert.equal(b.assets.size, 2);
    assert.equal(b.childBundles.size, 1);

    let output = run(b);
    assert.equal(typeof output.count, 'function');
    assert.equal(output.count(), 3);
  });

  it('should produce a ts bundle using commonJS require', async function() {
    let b = await bundle(
      __dirname + '/integration/typescript-require/index.ts'
    );

    assert.equal(b.assets.size, 2);
    assert.equal(b.childBundles.size, 1);

    let output = run(b);
    assert.equal(typeof output.count, 'function');
    assert.equal(output.count(), 3);
  });

  it('should support json require', async function() {
    let b = await bundle(__dirname + '/integration/typescript-json/index.ts');

    assert.equal(b.assets.size, 2);
    assert.equal(b.childBundles.size, 1);

    let output = run(b);
    assert.equal(typeof output.count, 'function');
    assert.equal(output.count(), 3);
  });

  it('should support env variables', async function() {
    let b = await bundle(__dirname + '/integration/typescript-env/index.ts');

    assert.equal(b.assets.size, 1);
    assert.equal(b.childBundles.size, 1);

    let output = run(b);
    assert.equal(typeof output.env, 'function');
    assert.equal(output.env(), 'test');
  });

  it('should support importing a URL to a raw asset', async function() {
    let b = await bundle(__dirname + '/integration/typescript-raw/index.ts');

    assertBundleTree(b, {
      name: 'index.js',
      assets: ['index.ts', 'test.txt'],
      childBundles: [
        {
          type: 'map'
        },
        {
          type: 'txt',
          assets: ['test.txt'],
          childBundles: []
        }
      ]
    });

    let output = run(b);
    assert.equal(typeof output.getRaw, 'function');
    assert(/^\/dist\/[0-9a-f]+\.txt$/.test(output.getRaw()));
    assert(fs.existsSync(__dirname + output.getRaw()));
  });

  it('should minify in production mode', async function() {
    let b = await bundle(
      __dirname + '/integration/typescript-require/index.ts',
      {production: true}
    );

    assert.equal(b.assets.size, 2);
    assert.equal(b.childBundles.size, 1);

    let output = run(b);
    assert.equal(typeof output.count, 'function');
    assert.equal(output.count(), 3);

    let js = fs.readFileSync(__dirname + '/dist/index.js', 'utf8');
    assert(!js.includes('local.a'));
  });

  it('should support loading tsconfig.json', async function() {
    let b = await bundle(__dirname + '/integration/typescript-config/index.ts');

    let output = run(b);
    assert.equal(output, 2);

    let js = fs.readFileSync(__dirname + '/dist/index.js', 'utf8');
    assert(!js.includes('/* test comment */'));
  });

  it('should support compiling JSX', async function() {
    await bundle(__dirname + '/integration/typescript-jsx/index.tsx');

    let file = fs.readFileSync(__dirname + '/dist/index.js', 'utf8');
    assert(file.includes('React.createElement("div"'));
  });

  it('should use esModuleInterop by default', async function() {
    let b = await bundle(
      __dirname + '/integration/typescript-interop/index.ts'
    );

    assertBundleTree(b, {
      name: 'index.js',
      assets: ['index.ts', 'commonjs-module.js'],
      childBundles: [
        {
          type: 'map'
        }
      ]
    });

    let output = run(b);
    assert.equal(typeof output.test, 'function');
    assert.equal(output.test(), 'test passed');
  });
});
