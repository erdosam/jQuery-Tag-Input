/**
 * $("<jquery-selector>").TagInput(); => create a UI tag input. Not the
 * TagInput object per se!! $("<jquery-selector>").TagInput("option", "<key>"); =>
 * get the tags inserted $("<jquery-selector>").TagInput("getValues"); =>
 * get the setting value $("<jquery-selector>").TagInput("option", "<key>"); =>
 * set the setting value $("<jquery-selector>").TagInput("option", "<key>", "<string>"); =>
 * 
 * @base jquery-1.6.2.js
 * @base jquery.ui.autocomplete for AutocompleteTagInput
 * 
 * @author Dunnowho
 * @email dunnowho@yahoo.com
 */

(function(win, doc, $) {

    var inputField;
    var that;
    var CLASS_NAME = "TagInput";
    var keys = {
        ENTER : 13,
        BACKSPACE : 8,
        TAB: 9,
        SPACE: 32,
        ARROW_LEFT : 37,
        ARROW_UP : 38,
        ARROW_RIGHT : 39,
        ARROW_DOWN : 40
    };

    function TagInput() {
        this.cssClass = {
            container : "erd-tag_input_container",
            tagsContainer : "erd-tag_list_container",
            inputBox : "erd-tag_input_box",
            input : "erd-tag_input_field",
            hasTag : "hasTagInput"
        };
        this._defaults = {
            fieldName : "taginput-field",
            preventTagDuplication : true,
            separatorKey: "ENTER"
        };
    }

    $.extend(
        TagInput.prototype, {
            _optionTagInput : function(_target, _key, _val) {
                var inst = this._getInst(_target);
                if (arguments.length == 2 && typeof _key == 'string') {
                    return (inst ? this._get(inst, _key) : null);
                }
                //TODO: provide algo for setter
            },
            _getValuesTagInput : function (_target) {
                var r = [];
                var inst = this._getInst(_target);
                $(".erd-tag_item_inline input", inst.container).each(function () {
                    r.push($(this).val());
                });
                return r;
            },
            _createInputTag : function(_target, _opt) {
                var nodeName = _target.nodeName.toLowerCase();
                var jTarget = $(_target);
                if (!_target.id) {
                    this.uuid += 1;
                    _target.id ="erd-taginput" +this.uuid;
                }
                var inst = this._newInst(jTarget, _opt);
                inst.settings = $.extend({}, _opt || {});
                if (nodeName == "input") {
                    if (this._getInst(_target)) {
                        return;
                    }
                    this._buildInputTag(inst);
                    $.data(_target, CLASS_NAME, inst);
                }
            },
            _buildInputTag : function (_inst) {
                _inst.input.after(_inst.container);
                _inst.container.append(
                        _inst.tagscontainer, 
                        _inst.inputbox, 
                        $('<div style="clear: both; height:0px;width:0px;">&nbsp;</div>'));
                _inst.input.appendTo(_inst.inputbox);
                _inst.input.attr("size", 1).val('');
                _inst.input.attr("maxlength", 64);
                /*start binding */
                _inst.container.click(function () {
                    _inst.input.focus();
                });
                _inst.input.keydown(this._keyDown)
                    .keypress(this._keyPress)
                    .keyup(this._keyUp)
                    .focus(this._focus)
                    .bind("blur", this._unfocus);
            },
            /* Create a new instance object. */
            _newInst : function(_target) {
                var id = _target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1');
                return {
                    id : id,
                    input : _target,
                    container : $('<div></div>').addClass(this.cssClass.container),
                    tagscontainer : $('<div></div>').addClass(this.cssClass.tagsContainer),
                    inputbox : $('<div></div>').addClass(this.cssClass.inputBox)
                };
            },
            /**
             * Retrieve the instance data for the target control.
             * 
             * @param target
             *            element - the target input field or
             *            division or span
             * @return object - the associated instance data
             * @throws error if a jQuery problem getting data
             */
            _getInst : function(_target) {
                try {
                    return $.data(_target, CLASS_NAME);
                } catch (err) {
                    throw 'Missing instance data for this '.CLASS_NAME;
                }
            },
            /* Get a setting value, defaulting if necessary. */
            _get: function(_inst, _name) {
                return _inst.settings[_name] !== undefined ?
                    _inst.settings[_name] : this._defaults[_name];
            },
            _appendNewTag : function (_target, _inst) {
                var input = $(_target);
                var val = input.val().trim().replace(/\s{2,}/g, ' ');
                var noDuplication = this._get(_inst, "preventTagDuplication");
                
                if (!val.trim().length) {
                    //nothing to add if the value is empty
                    return false;
                }
                
                if (noDuplication) {
                    var isPrevent = false;
                    $(".erd-tag_remove_btn", _inst.container).each(function () {
                        isPrevent = $(this).attr("href") == '#'+val;
                        return !isPrevent;
                    });
                    if (isPrevent) {
                        return false;
                    }
                }
                
                var hiddenInput = $('<input type="hidden" />').attr({
                    name: this._get(_inst, "fieldName")+"[]",
                    value: val
                });
                var tagEl = $('<span></span>').addClass("erd-tag_item_inline r5px").text(val);
                var tagRemoverEl = $('<a></a>').addClass("erd-tag_remove_btn").attr("href", "#"+val);
                var self = this;
                
                _inst = typeof _inst != "undefined" ? _inst : this._getInst(_target);
                _inst.tagscontainer.append(tagEl.append(tagRemoverEl, hiddenInput));
                tagRemoverEl.click(function (_e) {
                    self._removeTag(_e.target);
                    return false;
                });
                //emptying the input box
                input.val('');
            },
            _removeTag : function (_target) {
                $(_target).parent().remove();
                return false;
            },
            _removeLastTag : function (_inst) {
                var target = _inst.container;
                this._removeTag($(".erd-tag_item_inline .erd-tag_remove_btn", target).last());
            },
            /* handling key code */
            _keyDown : function (_event) {
                var target = $(_event.target);
                var isHandled = false;
                var inst = $.tagInput._getInst(_event.target);
                var val = target.val();
                var separator = keys[(target.TagInput("option", "separatorKey") +"").toUpperCase()] || keys.ENTER;
                
                switch (_event.keyCode) {
                    case separator:
                        //console.info("Key is down " +target.val());
                        if (val) {
                            isHandled = true;
                            $.tagInput._appendNewTag(_event.target, inst);
                        }
                        break;
                    case keys.BACKSPACE:
                        if (!val) {
                            isHandled = true;
                            $.tagInput._removeLastTag(inst);
                        }
                        break;
                    case keys.ARROW_LEFT:
                    case keys.ARROW_UP:
                    case keys.ARROW_RIGHT:
                    case keys.ARROW_DOWN:
                    default:
                        break;
                }
                //var inst = $.tagInput._getInst(_event.target);
                target.attr("size", target.val().length+1);
                
                if (isHandled) {
                    _event.preventDefault();
                    _event.stopPropagation();
                }
            },
            _keyPress : function (_event) {
                var target = $(_event.target);
                //console.info("Key is press");
            },
            _keyUp : function (_event) {
                var target = $(_event.target);
                target.attr("size", target.val().length+1);
                //console.info("Key is up");
            },
            _focus : function (_event) {
                var target = $(_event.target);
                var inst = $.tagInput._getInst(_event.target);
                inst.container.parent().addClass("erd-focus-element");
            },
            _unfocus : function (_event) {
                var target = $(_event.target);
                var inst = $.tagInput._getInst(_event.target);
                inst.container.parent().removeClass("erd-focus-element");
            }
        });
    
    $.fn.TagInput = function(_arg) {
        that = this;
        if (!this.length) {
            return this;
        }
        var args = Array.prototype.slice.call(arguments, 1);
        if (typeof _arg == "string" && _arg == "getValues") {
            return $.tagInput["_" +_arg +"TagInput"].apply($.tagInput, [this[0]].concat(args));
        }
        if (_arg == "option" && arguments.length == 2 && typeof arguments[1] == "string") {
            return $.tagInput["_" +_arg +"TagInput"].apply($.tagInput, [this[0]].concat(args));
        }
        // TODO: set setter and constructor here
        
     // return jquery element object
        return this.each(function () {
            $.tagInput._createInputTag(this, _arg);
        });
    };
    
    /**
     * Required jQuery autocomplete
     */
    $.fn.AutocompleteTagInput = function (_arg) {
        var cache = {};
        var lastXhr;
        var self = this;
        var options = {
            fromSourceOnly : false,
            openOnFocus: false,
            minLength : 0,
            sourceUrl : "/test-ajax.php",
            select : function (_event, _ui) {
                if (!_event.keyCode || typeof _event.keyCode == "undefined") {
                    //$(_event.target).val(_ui.item.label);
                    var inst = $.tagInput._getInst(_event.target);
                    $.tagInput._appendNewTag(_event.target, inst);
                    $(_event.target).val("");
                  //TODO: add any conditionals here so user except you can customize the plugin
                    setTimeout(function () {
                        if (options.openOnFocus) {
                            inst.input.autocomplete("search", "");
                        }
                    }, 100);
                }
                return false;
            },
            parseSource : function (_result) {
                if (_result.constructor == Array && typeof _result[0] == "string") {
                    return _result;
                }
                var r = [];
                for (var i in _result) {
                    r.push(_result[i].label);
                }
                return r;
            },
            source : function (_req, _res) {
                var t = _req.term;
                var a = self.TagInput("getValues");
                if ( t in cache) {
                    _res(array_diff(options.parseSource(cache[t]), a));
                    return;
                }
                if (typeof options.data != "undefined") {
                    $.extend(_req, options.data);
                }
                lastXhr = $.getJSON(options.sourceUrl, _req, function (_d, _s, _x) {
                    cache[t] = _d;
                    _x === lastXhr && _res(array_diff(options.parseSource(_d), a));
                });
            }
        };
        
        $.extend(options, _arg);
        options.autoFocus = options.fromSourceOnly;
        
        this.TagInput(_arg);
        this.autocomplete(options);
        
        //TODO: add any conditionals here so user except you can customize the plugin
        if (options.openOnFocus) {
            this.focus(function () {
                self.trigger("AutocompleteTagInput.search");
            })
            .bind("AutocompleteTagInput.search", function () {
                self.autocomplete("search", "");
            });
        }
        
        if (options.fromSourceOnly) {
            this.keyPress(function (_event) {
                if (_event.keyCode == keys.ENTER) {
                    
                }
            });
        }
        
        function array_diff (arr1) {
            var retArr = [],
                argl = arguments.length,
                k1 = '',
                i = 1,
                k = '',
                arr = {};
         
            arr1keys: for (k1 in arr1) {
                for (i = 1; i < argl; i++) {
                    arr = arguments[i];
                    for (k in arr) {
                        if (arr[k] === arr1[k1]) {
                            // If it reaches here, it was found in at least one array, so try next value
                            continue arr1keys;
                        }
                    }
                    retArr.push(arr1[k1]);
                }
            }
             return retArr;
        }
    };
    
    $.tagInput = new TagInput();
    $.tagInput.uuid = new Date().getTime();

})(window, document, jQuery);