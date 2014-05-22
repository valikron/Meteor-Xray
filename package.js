Package.describe({
    summary: 'Reveal template names in your meteor project'
});

Package.on_use(function(api) {
    api.use(['templating', 'underscore'], ['client']);

    api.add_files([
        'client/lib/polyfills.js',
        'client/lib/multiple_callbacks.js',
        'client/xray.html',
        'client/xray.css',
        'client/xray.js'
    ], ['client']);

    if (api.export) api.export('Xray');
});

Package.on_test(function(api) {
    api.use([
        'tinytest',
        'test-helpers',
        'templating',
        'underscore',
        'session',
        'deps'
    ], 'client');

    api.add_files('client/lib/multiple_callbacks.js', ['client']);

    api.add_files([
        'test/test-templates.html',
        'test/multiple_callback_test.js'
    ], ['client']);

});