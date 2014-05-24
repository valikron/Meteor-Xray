var xrayVisible = false;
var rayCount = 0;
var sysProperties = ['guid','__helperHost','created','destroyed','_events','events','__proto__','render','rendered','set','parent','preserve','dom','extend','get','helpers','instantiate','isDestroyed','isInited','kind','lookup','lookupTemplate','notifyParented'];
var xrayRegions = [];

Meteor.startup(function() {
    UI.materialize(Template.xray, document.body);
    Session.set('xray-label', 'xray on');
});

var attrListFromObject = function(object) {
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
    var offset = box.offset();

    var area = {
        x1: offset.left,
        y1: offset.top,
        x2: offset.left + box.width(),
        y2: offset.top + box.height(),
        width: box.width(),
        height: box.height()
    };

    return area;
};

var is_mouse_in_area = function(pos, area) {
    if (pos[0] >= area.x1 && pos[0] <= area.x2) {
        if (pos[1] >= area.y1 && pos[1] <= area.y2) {
            return true;
        }
    }
    return false;
};

var cleanupElement = function (elm, resetIndex) {
    elm.active = false;
    elm.style.zIndex = resetIndex;
    elm.style.border = '';
    elm.className = elm.className.replace(' xray-active', '');
};

var renderAttrListToDiv = function(name, list, parent) {
    if (list.length) {
        var container = document.createElement('DIV');
        var attribute;

        container.innerHTML = name + ':';
        container.className = ' xray-extra-devider';

        _.each(list, function(item) {
            attribute = document.createElement('DIV');
            attribute.className = 'xray-extra-value';
            attribute.innerHTML = '<span class="xray-keyName"> ' + item.keyName + ' </span> : ' + item.returnType;
            container.appendChild(attribute);
        });

        parent.appendChild(container);
    }
};

// render and put in the document
var renderToDiv = function(options) {
    options = options || {};

    var div = document.createElement('DIV'),
        innderDiv = document.createElement('DIV'),
        extra = document.createElement('DIV'),
        performTimeLabel = document.createElement('DIV');

    rayCount++;

    innderDiv.className = 'xray-label';
    div.appendChild(innderDiv);
    performTimeLabel.innerHTML = 'Rendertime: <span class="xray-keyName">' + (options.performTime / 1000) + 's</span>';
    performTimeLabel.className = ' xray-extra-devider';
    extra.appendChild(performTimeLabel);
    extra.className = 'xray-extra';
    innderDiv.appendChild(extra);

    renderAttrListToDiv('Attributes', options.attributesList, extra);
    renderAttrListToDiv('Helpers', options.helpersList, extra);
    renderAttrListToDiv('Events', options.events, extra);

    div.className = ' xray-label-container xray-id-' + rayCount;
    UI.materialize(options.tplName, innderDiv);
    return div;
};

Template.xray.label = function() {
    return Session.get('xray-label');
};

Template.xray.events({
    'click button': function(e, tpl) {
        var regions = document.body.querySelectorAll( (xrayVisible) ? '.xray-visible' : '.xray' );
        e.stopPropagation();

        Session.set('xray-label', (xrayVisible) ? 'xray on' : 'xray off');

        _.each(regions, function(region) {
            if (xrayVisible) {
                region.className = region.className.replace(' xray-visible', ' xray');
            } else {
                region.className = region.className.replace(' xray', ' xray-visible');
            }
        });

        xrayVisible = !xrayVisible;

        if(!xrayVisible) {
            _.each(xrayRegions, function(elm) {
                cleanupElement(elm, null);
            });
        }
    }
});

var renderActiveRegion = function(evt) {
    if (!xrayVisible)
        return;

    evt = (evt) ? evt : ((window.event) ? window.event : "");

    var mp = [0, 0],
        min = {};

    mp[0] = evt.pageX;
    mp[1] = evt.pageY;

    _.each(xrayRegions, function(region) {
        region.area = store_boundary($(region));

        if (is_mouse_in_area(mp, region.area)) {

            if (!min.width || !min.height || region.area.width < min.width || region.area.height < min.height) {
                min.width = region.area.width;
                min.height = region.area.height;
            }

            region.active = true;

            _.each(xrayRegions, function(lastActive) {
                if (lastActive.active) {
                    if (lastActive.area.width > min.width || lastActive.area.height > min.height) {
                        cleanupElement(lastActive, 1);
                    } else {
                        region.style.zIndex = 9999;
                        if (lastActive.className.indexOf('xray-active') < 0) {
                            region.className += ' xray-active';
                        }

                    }
                }
            });

        } else if (region.active) {
            cleanupElement(region, null);
        }

    });
};

Template.rendered(null, function() {
    var self = this;
    var proto = self.__component__.__proto__;

    if (self.templateName !== 'xray') {

        var childs = self.findAll('>*'),
            attributes = _.omit(proto, sysProperties),
            renderOptions = {},
            templateLabel;

        renderOptions.tplName = self.templateName;
        renderOptions.performTime = self.performTime;
        renderOptions.attributesList = attrListFromObject(attributes);
        renderOptions.helpersList = attrListFromObject(proto.helpers);
        renderOptions.events = attrListFromObject(proto.events);

        _.each(childs, function(child) {
            templateLabel = renderToDiv(renderOptions);
            xrayRegions.push(templateLabel);
            child.className += ' xray';
            child.insertBefore(templateLabel, child.firstNode);
        });

        document.addEventListener('mousemove', renderActiveRegion, false);
    }
});