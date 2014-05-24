var xrayVisible = false;
var rayCounter = 0;

Meteor.startup(function() {
    UI.materialize(Template.xray, document.body);
    Session.set('xray-label', 'xray on');
});

Template.xray.label = function() {
    return Session.get('xray-label');
};

Template.xray.events({
    'click button': function(e, tpl) {
        var regions;

        if (!xrayVisible) {
            regions = document.body.querySelectorAll('.xray');

            Session.set('xray-label', 'xray off');

            _.each(regions, function(region) {
                region.className = region.className.replace('xray', 'xray-visible');
            });

            xrayVisible = !xrayVisible;
        } else {
            regions = document.body.querySelectorAll('.xray-visible');

            Session.set('xray-label', 'xray on');

            _.each(regions, function(region) {
                region.className = region.className.replace('xray-visible', 'xray');
            });

            xrayVisible = !xrayVisible;
        }
    }
});

var attributeListFromObject = function(object) {
    var result = [];
    _.each(object, function(value, name) {
        if (value && name) {
            result.push({
                keyName: name,
                returnType: (typeof value === 'function') ? ((value() instanceof Array) ? 'array' : typeof value()) : typeof value
            });
        }
    });

    return result;
};

var store_boundary = function(box) {
    var box_area = {};

    offset = box.offset();

    box_area = {
        x1: offset.left,
        y1: offset.top,
        x2: offset.left + box.width(),
        y2: offset.top + box.height(),
        width: box.width(),
        height: box.height()
    };

    return box_area;
};

var is_mouse_in_area = function(pos, box_area) {
    if (pos[0] >= box_area.x1 && pos[0] <= box_area.x2) {
        if (pos[1] >= box_area.y1 && pos[1] <= box_area.y2) {
            return true;
        }
    }
    return false;
};

var renderAttributeListToDiv = function(name, list, parent) {
    if (list.length) {
        var container = document.createElement('DIV');
        container.innerHTML = name + ':';
        container.className = ' xray-extra-devider';

        _.each(list, function(item) {
            var attribute = document.createElement('DIV');
            attribute.className = ' xray-extra-value';
            attribute.innerHTML = '<span class="xray-keyName"> ' + item.keyName + ' </span> : ' + item.returnType;
            container.appendChild(attribute);
        });

        parent.appendChild(container);
    }
};

// render and put in the document
var renderToDiv = function(options) {
    options = options || {};

    rayCounter++;

    var div = document.createElement('DIV');
    var innderDiv = document.createElement('DIV');
    innderDiv.className = 'xray-label';
    div.appendChild(innderDiv);

    var extra = document.createElement('DIV');
    var performTimeLabel = document.createElement('DIV');
    performTimeLabel.innerHTML = 'Rendertime: <span class="xray-keyName">' + (options.performTime / 1000) + 's</span>';
    performTimeLabel.className = ' xray-extra-devider';
    extra.appendChild(performTimeLabel);
    extra.className = 'xray-extra';
    innderDiv.appendChild(extra);


    renderAttributeListToDiv('Attributes', options.attributesList, extra);
    renderAttributeListToDiv('Helpers', options.helpersList, extra);
    renderAttributeListToDiv('Events', options.events, extra);

    div.className = ' xray-label-container xray-id-' + rayCounter;
    UI.materialize(options.tplName, innderDiv);
    return div;
};


Template.created(null, function() {
    var self = this;
    self.createdTime = new Date();
});

var xrayRegionsLength = 0;
var xrayRegions = [];
Template.rendered(null, function() {
    var self = this;

    self.performTime = (new Date()) - self.createdTime;


    if (self.templateName !== 'xray') {
        // get direct childs
        var childs = self.findAll('>*');
        var mousePos = [0, 0];
        var attributes = _.omit(self.__component__.__proto__, [
            'guid',
            '__helperHost',
            'created',
            'destroyed',
            '_events',
            'events',
            '__proto__',
            'render',
            'rendered',
            'set',
            'parent',
            'preserve',
            'dom',
            'extend',
            'get',
            'helpers',
            'instantiate',
            'isDestroyed',
            'isInited',
            'kind',
            'lookup',
            'lookupTemplate',
            'notifyParented'
        ]);

        var renderOptions = {};

        renderOptions.tplName = self.templateName;
        renderOptions.performTime = self.performTime;
        renderOptions.attributesList = attributeListFromObject(attributes);
        renderOptions.helpersList = attributeListFromObject(self.__component__.__proto__.helpers);
        renderOptions.events = attributeListFromObject(self.__component__.__proto__.events);

        _.each(childs, function(child) {
            var templateLabel = renderToDiv(renderOptions);
            xrayRegions.push(templateLabel);
            child.className += ' xray';
            child.insertBefore(templateLabel, child.firstNode);
        });

        document.addEventListener('mousemove', function(evt) {
            evt = (evt) ? evt : ((window.event) ? window.event : "");

            var minSize = {};
            mousePos[0] = evt.pageX;
            mousePos[1] = evt.pageY;

            _.each(xrayRegions, function(elm) {

                elm.box_area = store_boundary($(elm));

                if (is_mouse_in_area(mousePos, elm.box_area)) {

                    if (!minSize.width || !minSize.height || elm.box_area.width < minSize.width || elm.box_area.height < minSize.height) {
                        minSize.width = elm.box_area.width;
                        minSize.height = elm.box_area.height;
                    }

                    elm.active = true;

                    _.each(xrayRegions, function(lastActive) {
                        if (lastActive.active) {
                            if (lastActive.box_area.width > minSize.width || lastActive.box_area.height > minSize.height) {
                                lastActive.style.zIndex = 1;
                                lastActive.style.border = '';
                                lastActive.style.borderRadius = 0;
                                lastActive.className = lastActive.className.replace(' xray-active', '');
                            } else {
                                elm.style.zIndex = 9999;
                                elm.style.border = '4px solid rgb(101, 188, 245)';
                                elm.className = elm.className.replace(' xray-inactive', '');
                                if (lastActive.className.indexOf('xray-active') < 0) {
                                    elm.className += ' xray-active';
                                }

                            }
                        }
                    });

                } else {
                    if (elm.active) {
                        elm.active = false;
                        elm.style.zIndex = null;
                        elm.style.border = '';
                        elm.className = elm.className.replace(' xray-active', ' xray-inactive');
                    }
                }

            });
        }, false);

    }
});