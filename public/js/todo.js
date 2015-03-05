var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="./d.ts/jquery/jquery.d.ts" />
/// <reference path="./d.ts/jqueryui/jqueryui.d.ts" />
/// <reference path="./d.ts/handlebars.d.ts" />
/// <reference path="./d.ts/moment.d.ts" />
/// <reference path="./d.ts/es6-promise.d.ts" />
/// <reference path="./d.ts/semanticui.d.ts" />
/// <reference path="./d.ts/pikaday.d.ts" />
/// <reference path="./d.ts/jquery-plugin/jquery.timepicker.d.ts" />
/// <reference path="./d.ts/masonry.d.ts" />
var Wrapper = (function () {
    function Wrapper() {
        this.$wrapper = $('.js-wrapper');
    }
    Wrapper.prototype.adjustWrapperHeight = function () {
        var height = $(document).height();
        if (height < window.innerHeight) {
            height = window.innerHeight;
        }
        this.$wrapper.css('height', height);
    };
    Wrapper.prototype.open = function (options) {
        if (options.clickHandler) {
            this.clickHandler = options.clickHandler;
            this.$wrapper.bind('click', this.clickHandler);
        }
        this.$wrapper.show();
        $(window).bind('resize', this.adjustWrapperHeight);
        this.adjustWrapperHeight();
        this.$wrapper.addClass('blur');
    };
    Wrapper.prototype.close = function () {
        var _this = this;
        this.$wrapper.removeClass('blur');
        $(window).unbind('resize', this.adjustWrapperHeight);
        setTimeout(function () {
            _this.$wrapper.hide();
        }, 300);
        if (this.clickHandler) {
            this.$wrapper.unbind('click', this.clickHandler);
        }
    };
    return Wrapper;
})();
var TodoMessage = (function () {
    function TodoMessage() {
        this.template = $('.js-todo-message-template').html();
        this.$message = $(this.template);
        $('.js-todo-message-box').append(this.$message);
    }
    TodoMessage.prototype.show = function (options) {
        var _this = this;
        this.$message.find('.js-message-content').text(options.message);
        this.$message.show();
        this.$message.addClass('active');
        this.$message.find('.js-message-close').click(function () {
            _this.hide();
        });
        if (options.undoCallback) {
            var this_ = this;
            this.$message.find('.js-undo-link').click(function () {
                $(this).unbind('click');
                options.undoCallback();
                this_.hide();
            });
        }
        else {
            this.$message.find('.js-undo-wrap').hide();
        }
        setTimeout(function () {
            _this.hide();
        }, 5000);
    };
    TodoMessage.prototype.hide = function () {
        var _this = this;
        this.$message.removeClass('active');
        setTimeout(function () {
            _this.$message.remove();
        }, 200);
    };
    return TodoMessage;
})();
var TodoState;
(function (TodoState) {
    TodoState[TodoState["AVAILABLE"] = 0] = "AVAILABLE";
    TodoState[TodoState["ARCHIVED"] = 1] = "ARCHIVED";
    TodoState[TodoState["DELETED"] = 2] = "DELETED";
})(TodoState || (TodoState = {}));
var Todo = (function () {
    function Todo(attributes) {
        this.id = attributes.id;
        this.title = attributes.title;
        this.url = attributes.url;
        this.memo = attributes.memo;
        if (attributes.timeLimit) {
            this.timeLimit = attributes.timeLimit;
            var m = moment(this.timeLimit, "YYYY/MM/DD HH:mm Z");
            this.timeLimitFormatted = m.format('YYYY/MM/DD HH:mm');
            this.timeLimitDate = m.format('YYYY/MM/DD');
            this.timeLimitTime = m.format('HH:mm');
        }
        this.state = attributes.state || 0 /* AVAILABLE */;
        this.isAvailableState = this.state == 0 /* AVAILABLE */;
        this.isArchivedState = this.state == 1 /* ARCHIVED */;
        this.isDeletedState = this.state == 2 /* DELETED */;
    }
    Todo.prototype.getTimeLimitLocalWithTimeZone = function () {
        return this.timeLimit ? moment.utc(this.timeLimit, 'YYYY/MM/DD HH:mm').local().format('YYYY/MM/DD HH:mm Z') : '';
    };
    Todo.prototype.parse = function (json) {
        this.id = json.id;
        this.title = json.title;
        this.memo = json.memo;
        this.timeLimit = json.timeLimit;
        this.state = json.state;
    };
    Todo.prototype.get = function (id) {
        return new Promise(function (done, reject) {
            $.ajax({
                type: 'GET',
                url: '/get',
                data: { id: id }
            }).then(done, reject);
        });
    };
    Todo.prototype.add = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var postData = {
                title: _this.title,
                url: _this.url,
                memo: _this.memo,
                timeLimit: _this.getTimeLimitLocalWithTimeZone()
            };
            $.ajax({
                type: 'POST',
                url: '/create',
                data: postData
            }).done(function (data) {
                resolve(new Todo(JSON.parse(data).todo));
            }).fail(function (jqXHR, textStatus, errorThrown) {
                reject(JSON.parse(jqXHR.responseText).error);
            });
        });
    };
    Todo.prototype.update = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var postData = {
                id: _this.id,
                title: _this.title,
                url: _this.url,
                memo: _this.memo,
                timeLimit: _this.getTimeLimitLocalWithTimeZone()
            };
            $.ajax({
                type: 'POST',
                url: '/update',
                data: postData
            }).done(function (data) {
                resolve(new Todo(JSON.parse(data).todo));
            }).fail(function (jqXHR, textStatus, errorThrown) {
                reject(JSON.parse(jqXHR.responseText).error);
            });
        });
    };
    Todo.prototype.changeState = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var postData = {
                id: _this.id,
                state: _this.state
            };
            $.ajax({
                type: 'POST',
                url: '/update',
                data: postData
            }).done(function (data) {
                resolve(new Todo(JSON.parse(data).todo));
            }).fail(function (data) {
                reject(JSON.parse(data).error);
            });
        });
    };
    Todo.prototype.remove = function () {
        this.state = 2 /* DELETED */;
        this.previousState = 0 /* AVAILABLE */;
        return this.changeState();
    };
    Todo.prototype.archive = function () {
        this.state = 1 /* ARCHIVED */;
        this.previousState = 0 /* AVAILABLE */;
        return this.changeState();
    };
    Todo.prototype.restore = function () {
        this.state = 0 /* AVAILABLE */;
        this.previousState = 2 /* DELETED */;
        return this.changeState();
    };
    Todo.prototype.unarchive = function () {
        this.state = 0 /* AVAILABLE */;
        this.previousState = 1 /* ARCHIVED */;
        return this.changeState();
    };
    Todo.prototype.undo = function () {
        var previousState = this.state;
        this.state = this.previousState;
        this.previousState = previousState;
        return this.changeState();
    };
    return Todo;
})();
var TodoView = (function () {
    function TodoView(model) {
        var _this = this;
        this.model = model;
        this.source = $('.js-todo-template').html();
        this.template = Handlebars.compile(this.source);
        this.$el = $(this.template(this.model));
        this.$el.find('i.icon').popup();
        this.$el.find('.js-todo-url').attr('href', this.model.url).click(function (evt) {
            evt.stopPropagation();
        });
        this.$el.mouseover(function () {
            _this.$el.find('.js-todo-buttons').addClass('active');
        }).mouseout(function () {
            _this.$el.find('.js-todo-buttons').removeClass('active');
        });
        if (this.$el.is('.editable')) {
            this.$el.click(function (evt) {
                evt.stopPropagation();
                _this.openUpdateForm();
            });
        }
        this.$el.find('.js-todo-buttons').click(function (evt) {
            evt.stopPropagation();
        });
        this.$el.find('.js-delete-todo-button').click(function () {
            _this.deleteTodo();
        });
        this.$el.find('.js-archive-todo-button').click(function () {
            _this.archiveTodo();
        });
        this.$el.find('.js-restore-todo-button').click(function () {
            _this.restoreTodo();
        });
        this.$el.find('.js-unarchive-todo-button').click(function () {
            _this.unarchiveTodo();
        });
    }
    TodoView.prototype.openUpdateForm = function () {
        new TodoUpdateForm(this.model.id).open();
    };
    TodoView.prototype.deleteTodo = function () {
        var _this = this;
        this.model.remove().then(function () {
            Page.todoViewList.remove(_this.model.id);
            new TodoMessage().show({
                message: 'Todo moved to Trash',
                undoCallback: function () {
                    _this.model.undo();
                    Page.todoViewList.redisplay(_this);
                }
            });
        }).catch(function (data) {
            new TodoMessage().show({ message: 'Failed!' });
        });
    };
    TodoView.prototype.archiveTodo = function () {
        var _this = this;
        this.model.archive().then(function () {
            Page.todoViewList.remove(_this.model.id);
            new TodoMessage().show({
                message: 'Todo archived',
                undoCallback: function () {
                    _this.model.undo();
                    Page.todoViewList.redisplay(_this);
                }
            });
        }).catch(function () {
            new TodoMessage().show({ message: 'Failed!' });
        });
    };
    TodoView.prototype.restoreTodo = function () {
        var _this = this;
        this.model.restore().then(function () {
            Page.todoViewList.remove(_this.model.id);
            new TodoMessage().show({
                message: 'Todo restored',
                undoCallback: function () {
                    _this.model.undo();
                    Page.todoViewList.redisplay(_this);
                }
            });
        }).catch(function () {
            new TodoMessage().show({ message: 'Failed!' });
        });
    };
    TodoView.prototype.unarchiveTodo = function () {
        var _this = this;
        this.model.unarchive().then(function () {
            Page.todoViewList.remove(_this.model.id);
            new TodoMessage().show({
                message: 'Todo unarchived',
                undoCallback: function () {
                    _this.model.undo();
                    Page.todoViewList.redisplay(_this);
                }
            });
        }).catch(function () {
            new TodoMessage().show({ message: 'Failed!' });
        });
    };
    return TodoView;
})();
var TodoViewList = (function () {
    function TodoViewList() {
        var _this = this;
        this.list = {};
        this.$el = $('.js-todo-grid-container');
        this.fetch().then(function (data) {
            var todoList = _this.parse(data);
            for (var i = 0; i < todoList.length; i++) {
                var todoView = new TodoView(new Todo(todoList[i]));
                _this.list[todoList[i].id] = todoView;
                _this.$el.append(todoView.$el);
            }
            Loading.close();
            _this.masonry = new Masonry(_this.$el.get(0), {
                columnWidth: 300,
                itemSelector: '.js-todo',
                "isFitWidth": true
            });
            _this.masonry.layout();
            _this.onChangeLayout();
        }).catch(function (data) {
            console.error(data);
            alert('Error! Please Reload...');
        });
    }
    TodoViewList.prototype.fetch = function () {
        return new Promise(function (done, reject) {
            $.ajax({
                type: 'GET',
                url: '/api' + location.pathname
            }).then(done, reject);
        });
    };
    TodoViewList.prototype.parse = function (data) {
        return JSON.parse(data).todoList;
    };
    TodoViewList.prototype.onChangeLayout = function () {
        var todoCount = $('.js-todo:visible').length;
        if (todoCount == 0) {
            EmptyTodoMessage.open();
        }
        else {
            EmptyTodoMessage.close();
        }
        if (todoCount <= 3) {
            this.$el.addClass('few-todo');
        }
        else {
            this.$el.removeClass('few-todo');
        }
    };
    TodoViewList.prototype.get = function (id) {
        return this.list[id];
    };
    TodoViewList.prototype.set = function (todoView) {
        this.list[todoView.model.id] = todoView;
    };
    TodoViewList.prototype.add = function (todo) {
        var todoView = new TodoView(todo);
        this.set(todoView);
        this.$el.prepend(todoView.$el);
        this.masonry.prepended(todoView.$el);
        this.onChangeLayout();
    };
    TodoViewList.prototype.update = function (todo) {
        var todoView = new TodoView(todo);
        this.get(todo.id).$el.html(todoView.$el.html());
        todoView.$el = this.get(todo.id).$el;
        this.masonry.layout();
        this.set(todoView);
        this.onChangeLayout();
    };
    TodoViewList.prototype.remove = function (id) {
        this.get(id).$el.hide();
        this.masonry.layout();
        delete this.list[id];
        this.onChangeLayout();
    };
    TodoViewList.prototype.redisplay = function (todoView) {
        this.set(todoView);
        todoView.$el.show();
        this.masonry.layout();
        this.onChangeLayout();
    };
    return TodoViewList;
})();
var TodoForm = (function () {
    function TodoForm(options) {
        var _this = this;
        // Initialize
        var source = $('.js-todo-form-template').html();
        var template = Handlebars.compile(source);
        var todo = options.todo;
        this.$el = $(template(todo)).removeClass('js-todo-form-template').addClass(options.formClassName);
        this.$el.find('.js-todo-button').text(options.buttonName);
        if (todo && todo.timeLimit) {
            this.$el.find('.ui.checkbox').checkbox('check');
        }
        this.changeTimeLimitFields();
        // Initialize DatePicker
        new Pikaday({
            field: this.$el.find('.js-datepicker')[0],
            format: 'YYYY/MM/DD'
        });
        // Initialize TimePicker
        this.$el.find('.js-timepicker').timepicker({ 'timeFormat': 'H:i' });
        // Initialize toggle checkbox
        this.$el.find('.ui.checkbox').checkbox();
        this.$el.find('input[name="timeLimitToggle"]').change(function () {
            _this.changeTimeLimitFields();
        });
        this.$el.click(function (evt) {
            evt.stopPropagation();
        });
        this.$el.find('.pika-single').click(function (evt) {
            evt.stopPropagation();
        });
        this.$el.submit(function () {
            return false;
        });
    }
    TodoForm.prototype.changeTimeLimitFields = function () {
        var datepickerField = this.$el.find('.datepicker-field');
        var timepickerField = this.$el.find('.timepicker-field');
        if (this.$el.find('input[name="timeLimitToggle"]').is(':checked')) {
            datepickerField.css('visibility', 'visible');
            timepickerField.css('visibility', 'visible');
        }
        else {
            datepickerField.css('visibility', 'hidden');
            timepickerField.css('visibility', 'hidden');
        }
    };
    TodoForm.prototype.formConvertToTodo = function () {
        var attributes = {};
        attributes.id = this.$el.find('.js-todo-id').val();
        attributes.title = this.getTitle();
        attributes.url = this.$el.find('input.js-todo-url').val();
        attributes.memo = this.$el.find('textarea.js-todo-memo').val();
        var isSetTimeLimit = this.$el.find('input.js-todo-time-limit-checkbox').is(':checked');
        if (isSetTimeLimit) {
            var m = moment();
            var date = this.$el.find('input.js-todo-date').val() || m.format('YYYY/MM/DD');
            var time = this.$el.find('input.js-todo-time').val() || '00:00';
            attributes.timeLimit = moment(date + ' ' + time + ' ' + m.format('Z'), 'YYYY/MM/DD/ HH:mm Z').utc().format('YYYY/MM/DD HH:mm');
        }
        return new Todo(attributes);
    };
    TodoForm.prototype.getTitle = function () {
        return this.$el.find('input.js-todo-title').val();
    };
    TodoForm.prototype.setTitle = function (title) {
        this.$el.find('input.js-todo-title').val(title);
    };
    TodoForm.prototype.displayErrorMessage = function (errors) {
        if (!errors) {
            return;
        }
        var validateMessage = new ValidateMessage();
        errors.forEach(function (error) {
            validateMessage.addMessage(error);
        });
        validateMessage.show();
    };
    return TodoForm;
})();
var TodoCreateForm = (function (_super) {
    __extends(TodoCreateForm, _super);
    function TodoCreateForm() {
        var _this = this;
        _super.call(this, { formClassName: 'js-todo-create-form', buttonName: 'Add' });
        this.$el.find('.js-todo-button').click(function () {
            _this.addTodo();
        });
    }
    TodoCreateForm.prototype.open = function () {
        var _this = this;
        this.closeHandler = function (evt) {
            if ($(evt.target).closest('.pika-single').length > 0 || $(evt.target).closest('.ui-timepicker-wrapper').length > 0) {
                return;
            }
            _this.close();
        };
        $(document).click(this.closeHandler);
        $('.js-todo-form-fake').after(this.$el);
        this.$el.find('input.js-todo-title').focus();
    };
    TodoCreateForm.prototype.close = function () {
        $('.js-todo-form-fake').show();
        this.$el.remove();
        $(document).unbind('click', this.closeHandler);
    };
    TodoCreateForm.prototype.addTodo = function () {
        var _this = this;
        new ValidateMessage().close();
        var todo = this.formConvertToTodo();
        todo.add().then(function (todo) {
            _this.close();
            Page.todoViewList.add(todo);
        }).catch(function (error) {
            _this.displayErrorMessage(error);
        });
    };
    return TodoCreateForm;
})(TodoForm);
var TodoUpdateForm = (function (_super) {
    __extends(TodoUpdateForm, _super);
    function TodoUpdateForm(todoId) {
        var _this = this;
        _super.call(this, {
            todo: Page.todoViewList.get(todoId).model,
            formClassName: 'js-todo-update-form',
            buttonName: 'Update'
        });
        this.wrapper = new Wrapper();
        this.todoView = Page.todoViewList.get(todoId);
        this.$el.find('.js-todo-button').click(function () {
            _this.updateTodo();
        });
    }
    TodoUpdateForm.prototype.closeHandler = function (evt, this_) {
        if ($(evt.target).closest('.pika-single').length > 0 || $(evt.target).closest('.ui-timepicker-wrapper').length > 0) {
            return;
        }
        this_.close();
    };
    TodoUpdateForm.prototype.updateTodo = function () {
        var _this = this;
        new ValidateMessage().close();
        var todo = this.formConvertToTodo();
        todo.update().then(function (todo) {
            Page.todoViewList.update(new Todo(todo));
            _this.close();
        }).catch(function (error) {
            _this.displayErrorMessage(error);
        });
    };
    TodoUpdateForm.prototype.open = function () {
        var _this = this;
        $('body').append(this.$el);
        this.wrapper.open({
            'clickHandler': function (evt) {
                _this.closeHandler(evt, _this);
            }
        });
        this.$el.css('opacity', '0').addClass('todo-update-form').css({
            'top': (($(window).height() / 2 - this.$el.height() / 2) + $(window).scrollTop()),
            'left': ($(window).width() / 2) - (this.$el.width() / 2)
        }).find('input.js-todo-title').focus();
        this.todoView.$el.effect("transfer", { to: this.$el }, 200, function () {
            _this.$el.css('opacity', '');
        });
    };
    TodoUpdateForm.prototype.close = function () {
        this.wrapper.close();
        this.$el.effect("transfer", { to: this.todoView.$el }, 200);
        this.$el.remove();
    };
    return TodoUpdateForm;
})(TodoForm);
var ValidateMessage = (function () {
    function ValidateMessage() {
        this.$el = $('form:visible .js-validate-error');
    }
    ValidateMessage.prototype.addMessage = function (error) {
        var $message = $('<li>').text(error.Message);
        this.$el.find('ul').append($message);
    };
    ValidateMessage.prototype.show = function () {
        this.$el.show();
    };
    ValidateMessage.prototype.close = function () {
        this.$el.find('li').remove();
        this.$el.hide();
    };
    return ValidateMessage;
})();
var EmptyTodoMessage = (function () {
    function EmptyTodoMessage() {
    }
    EmptyTodoMessage.open = function () {
        $('.js-todo-grid').append($('.js-empty-todo').show());
    };
    EmptyTodoMessage.close = function () {
        $('.js-empty-todo').hide();
    };
    return EmptyTodoMessage;
})();
var Loading = (function () {
    function Loading() {
    }
    Loading.close = function () {
        $('.js-loading').remove();
    };
    return Loading;
})();
var Page = (function () {
    function Page() {
        $('.js-menu').click(function () {
            $('.left.sidebar').sidebar('toggle');
        });
        $('.js-todo-form-fake input[name="title-fake"]').focus(function () {
            $('.js-todo-form-fake').hide();
            new TodoCreateForm().open();
        });
        $('.js-empty-trash').click(function () {
            $('.js-empty-trash-modal').modal({
                onApprove: function () {
                    location.href = "/emptyTrash";
                }
            }).modal('show');
        });
        // Todo: change to trigger pattern
        Page.todoViewList = new TodoViewList();
    }
    return Page;
})();
(function () {
    "use strict";
    $(function () {
        Handlebars.registerHelper('breaklines', function (text) {
            text = Handlebars.Utils.escapeExpression(text);
            text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
            return new Handlebars.SafeString(text);
        });
        new Page();
    });
})();
