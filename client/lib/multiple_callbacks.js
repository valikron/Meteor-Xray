var evtNames = ['created', 'rendered', 'destroyed'];
var methodNames = ['Created', 'Rendered', 'Destroyed'];


_.each(evtNames, function(evtName, i) {
    Template[evtName] = function(tplName, callback) {
        var _base, namespace = '_' + evtName + '_callbacks';
        Template[namespace] || (Template[namespace] = {});
        (_base = Template[namespace])[tplName] || (_base[tplName] = []);
        return Template[namespace][tplName].push(callback);
    };

    var _bootstrap = function () {
        return _.each(Template, function(tpl, tplName) {
            if (tpl.kind === 'Template_' + tplName) {
                var superFunc = Template[tplName][evtName] || function () {};
                return Template[tplName][evtName] = function() {
                    var self = this,
                        callbacks = null,
                        nameSpace = '_' + evtName + '_callbacks';

                    self.templateName = tplName;

                    superFunc.bind(self)();

                    if (Template.hasOwnProperty(nameSpace)) {
                        callbacks = _.union(Template[nameSpace][tplName], Template[nameSpace][null]);
                    }

                    return _.each(callbacks, function(func) {
                        return func && func.bind(self)();
                    });
                };
            }
        });
    };

    var bootstrap = Meteor._wrapAsync(_bootstrap)

    Template['bootstrap' + methodNames[i] + 'Callbacks'] = bootstrap;
});

Meteor.startup(function () {
    Template.bootstrapCreatedCallbacks();
    Template.bootstrapRenderedCallbacks();
    Template.bootstrapDestroyedCallbacks();
});



