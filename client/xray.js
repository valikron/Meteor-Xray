Meteor.startup(function() {
    UI.materialize(Template.xray, document.body);
    Session.set('xray-label', 'xray on');
});

Template.xray.label = function() {
    return Session.get('xray-label');
};

var xrayVisible = false;

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

function attributeListFromObject(object){
    var result = [];
    _.each(object, function (value, name) {
        if(value && name){
            result.push({
                keyName : name,
                returnType: (typeof value === 'function') ? ((value() instanceof Array) ? 'array' : typeof value()) : typeof value
            });
        }
    });

    return result;
}

function store_boundary(box) {
    var B = box,
        box_area = {};

    O = B.offset();

    box_area = {
        x1: O.left,
        y1: O.top,
        x2: O.left + B.width(),
        y2: O.top + B.height(),
        width: B.width(),
        height: B.height()
    };

    return box_area;
}

function is_mouse_in_area(pos, box_area) {
    var C = pos, B = box_area;
    if (C[0] >= B.x1 && C[0] <= B.x2) {
        if (C[1] >= B.y1 && C[1] <= B.y2) {
            return true;
        }
    }
    return false;
}

var rayCounter = 0;

// render and put in the document
var renderToDiv = function( options ) {
    options = options || {};

    rayCounter++;

    var div = document.createElement('DIV');
    var innderDiv = document.createElement('DIV');
    innderDiv.className = 'xray-label';
    div.appendChild(innderDiv);

    var extra = document.createElement('DIV');
    var performTime = document.createElement('DIV');
    var performTimeLabel = document.createElement('DIV');
    performTime.innerHTML = (options.performTime / 1000) + 's';
    performTimeLabel.innerHTML = 'Rendertime: ';
    performTimeLabel.className = ' xray-extra-devider';
    extra.appendChild(performTimeLabel);
    extra.appendChild(performTime);
    extra.className = 'xray-extra';
    innderDiv.appendChild(extra);


    if(options.attributesList.length){
        var attributesList = document.createElement('DIV');
        attributesList.innerHTML = 'Attributes:';
        attributesList.className = ' xray-extra-devider';

        _.each(options.attributesList, function (attr){
            var attribute = document.createElement('DIV');
            attribute.className = ' xray-extra-value';
            attribute.innerHTML = ' + ' + attr.keyName + ' : ' + attr.returnType;
            attributesList.appendChild(attribute);
        });
        
        extra.appendChild(attributesList);
    }

    if(options.helpersList.length){
        var helpersList = document.createElement('DIV');
        helpersList.innerHTML = 'Helpers:';
        helpersList.className = ' xray-extra-devider';

        _.each(options.helpersList, function (attr){
            var attribute = document.createElement('DIV');
            attribute.className = ' xray-extra-value';
            attribute.innerHTML = ' + ' + attr.keyName + ' : ' + attr.returnType;
            helpersList.appendChild(attribute);
        });
        
        extra.appendChild(helpersList);
    }

    if(options.events.length){
        var events = document.createElement('DIV');
        events.innerHTML = 'Events:';
        events.className = ' xray-extra-devider';

        _.each(options.events, function (attr){
            var attribute = document.createElement('DIV');
            attribute.className = ' xray-extra-value';
            attribute.innerHTML = ' "' + attr.keyName + '"' + ' : ' + attr.returnType;
            events.appendChild(attribute);
        });
        
        extra.appendChild(events);
    }

    div.className = ' xray-label-container xray-id-' + rayCounter;
    UI.materialize(options.tplName , innderDiv);
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
    self.renderedTime = new Date();

    self.performTime = self.renderedTime - self.createdTime;


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
            child.className += ' xray';
            var templateLabel = renderToDiv(renderOptions);
            xrayRegions.push(templateLabel);
            child.insertBefore(templateLabel, child.firstNode);
        });


        document.addEventListener('mousemove', function(evt) {
            evt = (evt) ? evt : ((window.event) ? window.event : "");

            var C = mousePos; // one global lookup
            C[0] = evt.pageX;
            C[1] = evt.pageY;
            var minSize = {};
            _.each(xrayRegions, function(elm) {

                elm.box_area = store_boundary($(elm));

                if (is_mouse_in_area(C, elm.box_area)) {
                    if (!minSize.width || elm.box_area.width < minSize.width || elm.box_area.height < minSize.height) {
                        minSize.width = elm.box_area.width;
                        minSize.height = elm.box_area.height;
                    }

                    elm.active = true;

                    _.each(xrayRegions, function(lastActive) {
                        if(lastActive.active){
                            if(lastActive.box_area.width > minSize.width || lastActive.box_area.height > minSize.height){
                                lastActive.style.zIndex = 1;
                                lastActive.style.border = '';
                                lastActive.style.borderRadius = 0;
                                lastActive.className = lastActive.className.replace(' xray-active', '');
                                lastActive.className = lastActive.className.replace(' xray-active', ' xray-inactive');
                            } else {
                                elm.style.zIndex = 9999;
                                elm.style.border = '4px solid rgb(101, 188, 245)';
                                elm.className = elm.className.replace(' xray-inactive', '');
                                elm.className = elm.className.replace(' xray-active', '');
                                elm.className += ' xray-active';
                            }
                        } 
                    });
                    
                } else {
                    if(elm.active){
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