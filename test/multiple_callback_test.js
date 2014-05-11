// render and put in the document
var renderToDiv = function (comp) {
    var div = document.createElement("DIV");
    UI.materialize(comp, div);
    return div;
};

Template.test_layout.renderQueue = function () {
    return Session.get('renderQueue');
};

Template.template_a.created = function () {
    Tinytest.add('DefaultCallbacks - Created test', function (test) {
        test.ok();
    });
};

Template.template_a.rendered = function () {
    Tinytest.add('DefaultCallbacks - Rendered test', function (test) {
        test.ok();
    });
    Session.set('renderQueue', {a : false});
};

Template.template_a.destroyed = function () {
    Tinytest.add('DefaultCallbacks - Destroyed test', function (test) {
        test.ok();
    });
};

var div = renderToDiv(Template.test_layout);

Session.set('renderQueue', {a : true});


testAsyncMulti("MultipleCallbacks - Created test", [
    function (test, expect) {

        Template.created('template_b', expect(function () {

            test.ok();

        }));

        Session.set('renderQueue', {b : true});
    }
]);


testAsyncMulti("MultipleCallbacks - Rendered test", [
    function (test, expect) {

        Template.rendered('template_c', expect(function () {

            test.ok();

        }));

        Session.set('renderQueue', {c : true});
    }
]);

testAsyncMulti("MultipleCallbacks - Destroyed test", [
    function (test, expect) {


        Template.template_d.rendered = function () {
            Deps.afterFlush(function(){
                Session.set('renderQueue', {d : false});
            });
        };

        Template.destroyed('template_d', expect(function () {
            Deps.afterFlush(function(){
                test.ok();
            });
        }));

        Deps.afterFlush(function(){
            Session.set('renderQueue', {d : true});
        });

    }
]);
