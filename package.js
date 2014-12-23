Package.describe({
  summary: 'Reveal template names in your meteor project',
  version: "0.2.0",
  // this package should be disabled in production
  debugOnly: true
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.0');

  api.use(['templating', 'underscore'], ['client']);

  api.addFiles([
    'client/lib/polyfills.js',
    'client/lib/multiple_callbacks.js',
    'client/xray.html',
    'client/xray.css',
    'client/xray.js'
  ], ['client']);

  if (api.export) api.export('Xray');
});

Package.onTest(function (api) {
  api.use([
    'tinytest',
    'test-helpers',
    'templating',
    'underscore',
    'session',
    'deps'
  ], 'client');

  api.addFiles('client/lib/multiple_callbacks.js', ['client']);

  api.addFiles([
    'test/test-templates.html',
    'test/multiple_callback_test.js'
  ], ['client']);
});
