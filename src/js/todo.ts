/// <reference path="./d.ts/jquery/jquery.d.ts" />
/// <reference path="./d.ts/jqueryui/jqueryui.d.ts" />
/// <reference path="./d.ts/handlebars.d.ts" />
/// <reference path="./d.ts/moment.d.ts" />
/// <reference path="./d.ts/es6-promise.d.ts" />
/// <reference path="./d.ts/semanticui.d.ts" />
/// <reference path="./d.ts/pikaday.d.ts" />
/// <reference path="./d.ts/jquery-plugin/jquery.timepicker.d.ts" />
/// <reference path="./d.ts/masonry.d.ts" />
class Wrapper {
    private $wrapper = $('.js-wrapper');

    private adjustWrapperHeight() {
        var height = $(document).height();
        if (height < window.innerHeight) {
            height = window.innerHeight;
        }
        this.$wrapper.css('height', height);
    }

    private clickHandler:(evt:JQueryEventObject) => void;

    open(options:{clickHandler:(evt:JQueryEventObject)=>void}) {

        if (options.clickHandler) {
            this.clickHandler = options.clickHandler;
            this.$wrapper.bind('click', this.clickHandler);
        }
        this.$wrapper.show();
        $(window).bind('resize', this.adjustWrapperHeight);
        this.adjustWrapperHeight();
        this.$wrapper.addClass('blur');

    }

    close() {
        this.$wrapper.removeClass('blur');
        $(window).unbind('resize', this.adjustWrapperHeight);
        setTimeout(()=> {
            this.$wrapper.hide();
        }, 300);
        if (this.clickHandler) {
            this.$wrapper.unbind('click', this.clickHandler);
        }
    }

}

class TodoMessage {
    private template = $('.js-todo-message-template').html();
    private $message = $(this.template);

    constructor() {
        $('.js-todo-message-box').append(this.$message);
    }

    show(options:{message:string; undoCallback?:()=>void}) {
        this.$message.find('.js-message-content').text(options.message);
        this.$message.show();
        this.$message.addClass('active');
        this.$message.find('.js-message-close').click(()=> {
            this.hide();
        });
        if (options.undoCallback) {
            var this_ = this;
            this.$message.find('.js-undo-link').click(function () {
                $(this).unbind('click');
                options.undoCallback();
                this_.hide();
            });
        } else {
            this.$message.find('.js-undo-wrap').hide();
        }
        setTimeout(()=> {
            this.hide();
        }, 5000);
    }

    hide() {
        this.$message.removeClass('active');
        setTimeout(()=> {
            this.$message.remove();
        }, 200);
    }
}
enum TodoState {
    AVAILABLE = 0,
    ARCHIVED = 1,
    DELETED = 2
}
class Todo {
    id:number;
    title:string;
    url:string;
    memo:string;
    timeLimit:string; //utc
    timeLimitFormatted:string;
    timeLimitDate:string;
    timeLimitTime:string;
    state:TodoState;
    previousState:TodoState;
    isAvailableState:boolean;
    isArchivedState:boolean;
    isDeletedState:boolean;

    constructor(attributes:{id:number; title:string; url:string; memo:string; timeLimit:string; state?:TodoState}) {
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
        this.state = attributes.state;
        this.isAvailableState = attributes.state == TodoState.AVAILABLE;
        this.isArchivedState = attributes.state == TodoState.ARCHIVED;
        this.isDeletedState = attributes.state == TodoState.DELETED;
    }

    getTimeLimitLocalWithTimeZone() {
        return this.timeLimit ? moment.utc(this.timeLimit, 'YYYY/MM/DD HH:mm').local().format('YYYY/MM/DD HH:mm Z') : '';
    }

    parse(json:{id:number; title:string ; url :string; memo :string; timeLimit: string; state :number}) {
        this.id = json.id;
        this.title = json.title;
        this.memo = json.memo;
        this.timeLimit = json.timeLimit;
        this.state = json.state;
    }

    get(id:number) {
        return new Promise((done, reject) => {
            $.ajax({
                type: 'GET',
                url: '/get',
                data: {id: id}
            }).then(done, reject);
        });

    }

    add() {
        return new Promise((resolve, reject)=> {
            var postData = {
                title: this.title,
                url: this.url,
                memo: this.memo,
                timeLimit: this.getTimeLimitLocalWithTimeZone()
            };
            $.ajax({
                type: 'POST',
                url: '/create',
                data: postData
            }).done((data)=> {
                resolve(JSON.parse(data).todo);
            }).fail((jqXHR, textStatus, errorThrown)=> {
                reject(JSON.parse(jqXHR.responseText).error);
            });
        });
    }

    update() {
        return new Promise((resolve, reject)=> {
            var postData = {
                id: this.id,
                title: this.title,
                url: this.url,
                memo: this.memo,
                timeLimit: this.getTimeLimitLocalWithTimeZone()
            };
            $.ajax({
                type: 'POST',
                url: '/update',
                data: postData
            }).done((data)=> {
                resolve(JSON.parse(data).todo);
            }).fail((jqXHR, textStatus, errorThrown) => {
                reject(JSON.parse(jqXHR.responseText).error);
            });
        });
    }

    changeState() {
        return new Promise((resolve, reject)=> {
            var postData = {
                id: this.id,
                state: this.state
            };
            $.ajax({
                type: 'POST',
                url: '/update',
                data: postData
            }).done((data)=> {
                resolve(JSON.parse(data).todo);
            }).fail((data)=> {
                reject(JSON.parse(data).error);
            });
        });
    }

    remove() {
        this.state = TodoState.DELETED;
        this.previousState = TodoState.AVAILABLE;
        return this.changeState();
    }

    archive() {
        this.state = TodoState.ARCHIVED;
        this.previousState = TodoState.AVAILABLE;
        return this.changeState();
    }

    restore() {
        this.state = TodoState.AVAILABLE;
        this.previousState = TodoState.DELETED;
        return this.changeState();
    }

    unarchive() {
        this.state = TodoState.AVAILABLE;
        this.previousState = TodoState.ARCHIVED;
        return this.changeState();
    }

    undo() {
        var previousState = this.state;
        this.state = this.previousState;
        this.previousState = previousState;
        return this.changeState();
    }
}
class TodoView {

    private source:string;
    private template:HandlebarsTemplateDelegate;

    model:Todo;
    $el:JQuery;

    constructor(model:Todo) {
        this.model = model;
        this.source = $('.js-todo-template').html();
        this.template = Handlebars.compile(this.source);
        this.$el = $(this.template(this.model));

        this.$el.find('i.icon').popup();
        this.$el.find('.js-todo-url')
            .attr('href', this.model.url)
            .click((evt) => {
                evt.stopPropagation();
            });
        this.$el.mouseover(()=> {
            this.$el.find('.js-todo-buttons').addClass('active');
        }).mouseout(() => {
            this.$el.find('.js-todo-buttons').removeClass('active');
        });
        if (this.$el.is('.editable')) {
            this.$el.click((evt)=> {
                evt.stopPropagation();
                this.openUpdateForm();
            });
        }

        this.$el.find('.js-todo-buttons').click((evt)=> {
            evt.stopPropagation();
        });

        this.$el.find('.js-delete-todo-button').click(()=> {
            this.deleteTodo();
        });
        this.$el.find('.js-archive-todo-button').click(()=> {
            this.archiveTodo();
        });
        this.$el.find('.js-restore-todo-button').click(()=> {
            this.restoreTodo();
        });
        this.$el.find('.js-unarchive-todo-button').click(()=> {
            this.unarchiveTodo();
        });
    }

    private openUpdateForm() {
        new TodoUpdateForm(this.model.id).open();
    }

    private deleteTodo() {
        this.model.remove().then(()=> {
            Page.todoViewList.remove(this.model.id);
            new TodoMessage().show({
                message: 'Todo moved to Trash', undoCallback: ()=> {
                    this.model.undo();
                    Page.todoViewList.redisplay(this);
                }
            });
        }).catch((data)=> {
            new TodoMessage().show({message: 'Failed!'});
        });
    }

    private archiveTodo() {
        this.model.archive().then(()=> {
            Page.todoViewList.remove(this.model.id);
            new TodoMessage().show({
                message: 'Todo archived', undoCallback: ()=> {
                    this.model.undo();
                    Page.todoViewList.redisplay(this);
                }
            });
        }).catch(()=> {
            new TodoMessage().show({message: 'Failed!'});
        });
    }

    private restoreTodo() {
        this.model.restore().then(()=> {
            Page.todoViewList.remove(this.model.id);
            new TodoMessage().show({
                message: 'Todo restored', undoCallback: ()=> {
                    this.model.undo();
                    Page.todoViewList.redisplay(this);
                }
            });
        }).catch(() => {
            new TodoMessage().show({message: 'Failed!'});
        });
    }

    private unarchiveTodo() {
        this.model.unarchive().then(()=> {
            Page.todoViewList.remove(this.model.id);
            new TodoMessage().show({
                message: 'Todo unarchived', undoCallback: ()=> {
                    this.model.undo();
                    Page.todoViewList.redisplay(this);
                }
            });
        }).catch(() => {
            new TodoMessage().show({message: 'Failed!'});
        });
    }

}
class TodoViewList {
    constructor() {
        this.fetch().then((data:string)=> {
            var todoList = this.parse(data);
            for (var i = 0; i < todoList.length; i++) {
                var todoView = new TodoView(new Todo(todoList[i]));
                this.list[todoList[i].id] = todoView;
                this.$el.append(todoView.$el);
            }

            Loading.close();
            this.masonry = new Masonry(this.$el.get(0), {
                columnWidth: 300,
                itemSelector: '.js-todo',
                "isFitWidth": true
            });
            this.masonry.layout();
            this.onChangeLayout();

        }).catch((data)=> {
            console.error(data);
            alert('Error! Please Reload...');
        });

    }

    private list:{[id :number]: TodoView} = {};
    private $el = $('.js-todo-grid-container');
    private masonry:Masonry;

    private fetch() {
        return new Promise((done, reject)=> {
            $.ajax({
                type: 'GET',
                url: '/api' + location.pathname
            }).then(done, reject);
        });
    }

    private parse(data:string) {
        return JSON.parse(data).todoList;
    }

    private onChangeLayout() {
        var todoCount = $('.js-todo:visible').length;
        if (todoCount == 0) {
            EmptyTodoMessage.open();
        } else {
            EmptyTodoMessage.close();
        }
        if (todoCount <= 3) {
            this.$el.addClass('few-todo');
        } else {
            this.$el.removeClass('few-todo');
        }
    }

    get(id:number) {
        return this.list[id];
    }

    set(todoView:TodoView) {
        this.list[todoView.model.id] = todoView;
    }

    add(todo:Todo) {
        var todoView = new TodoView(todo);
        this.set(todoView);
        this.$el.prepend(todoView.$el);
        this.masonry.prepended(todoView.$el);
        this.onChangeLayout();
    }

    update(todo:Todo) {
        var todoView = new TodoView(todo);
        this.get(todo.id).$el.html(todoView.$el.html());
        todoView.$el = this.get(todo.id).$el;
        this.masonry.layout();
        this.set(todoView);
        this.onChangeLayout();
    }

    remove(id:number) {
        this.get(id).$el.hide();
        this.masonry.layout();
        delete this.list[id];
        this.onChangeLayout();
    }

    redisplay(todoView:TodoView) {
        this.set(todoView);
        todoView.$el.show();
        this.masonry.layout();
        this.onChangeLayout();
    }
}
class TodoForm {
    $el:JQuery;

    private changeTimeLimitFields() {
        var datepickerField = this.$el.find('.datepicker-field');
        var timepickerField = this.$el.find('.timepicker-field');
        if (this.$el.find('input[name="timeLimitToggle"]').is(':checked')) {
            datepickerField.css('visibility', 'visible');
            timepickerField.css('visibility', 'visible');
        } else {
            datepickerField.css('visibility', 'hidden');
            timepickerField.css('visibility', 'hidden');
        }
    }

    constructor(options:{todo?:Todo; formClassName:string; buttonName:string}) {
        // Initialize
        var source = $('.js-todo-form-template').html();
        var template = Handlebars.compile(source);
        var todo = options.todo;
        this.$el = $(template(todo))
            .removeClass('js-todo-form-template')
            .addClass(options.formClassName);
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
        this.$el.find('.js-timepicker').timepicker({'timeFormat': 'H:i'});

        // Initialize toggle checkbox
        this.$el.find('.ui.checkbox').checkbox();

        this.$el.find('input[name="timeLimitToggle"]').change(()=> {
            this.changeTimeLimitFields();
        });

        this.$el.click((evt)=> {
            evt.stopPropagation();
        });
        this.$el.find('.pika-single').click((evt)=> {
            evt.stopPropagation();
        });

        this.$el.submit(() => {
            return false;
        });

    }

    formConvertToTodo() {
        var attributes:{id:number; title:string; url:string; memo:string; timeLimit: string} = <any>{};
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
    }

    getTitle() {
        return this.$el.find('input.js-todo-title').val();
    }

    setTitle(title:string) {
        this.$el.find('input.js-todo-title').val(title);
    }

    displayErrorMessage(errors:[{Field:string;Message:string}]) {
        if (!errors) {
            return;
        }
        var validateMessage = new ValidateMessage();
        errors.forEach((error:{Field:string;Message:string})=> {
            validateMessage.addMessage(error);
        });
        validateMessage.show();
    }
}

class TodoCreateForm extends TodoForm {
    constructor() {
        super({formClassName: 'js-todo-create-form', buttonName: 'Add'});

        this.$el.find('.js-todo-button').click(()=> {
            this.addTodo();
        })
    }

    closeHandler:(evt:JQueryEventObject)=>void;

    open() {
        this.closeHandler = (evt:JQueryEventObject)=> {
            if ($(evt.target).closest('.pika-single').length > 0
                || $(evt.target).closest('.ui-timepicker-wrapper').length > 0
            ) {
                return;
            }
            this.close();
        };
        $(document).click(this.closeHandler);

        $('.js-todo-form-fake').after(this.$el);
        this.$el.find('input.js-todo-title').focus();
    }

    close() {
        $('.js-todo-form-fake').show();
        this.$el.remove();
        $(document).unbind('click', this.closeHandler);
    }

    addTodo() {
        new ValidateMessage().close();
        var todo = this.formConvertToTodo();
        todo.add().then((todo:Todo)=> {
            this.close();
            Page.todoViewList.add(todo);
        }).catch((error)=> {
            this.displayErrorMessage(error);
        });
    }
}
class TodoUpdateForm extends TodoForm {
    constructor(todoId:number) {
        super({
            todo: Page.todoViewList.get(todoId).model,
            formClassName: 'js-todo-update-form',
            buttonName: 'Update'
        });
        this.todoView = Page.todoViewList.get(todoId);
        this.$el.find('.js-todo-button').click(()=> {
            this.updateTodo();
        });
    }

    private todoView:TodoView;
    private wrapper = new Wrapper();

    private closeHandler(evt:JQueryEventObject, this_:TodoUpdateForm) {
        if ($(evt.target).closest('.pika-single').length > 0
            || $(evt.target).closest('.ui-timepicker-wrapper').length > 0
        ) {
            return;
        }
        this_.close();
    }

    private updateTodo() {
        new ValidateMessage().close();
        var todo = this.formConvertToTodo();
        todo.update().then((todo:Todo)=> {
            Page.todoViewList.update(new Todo(todo));
            this.close();
        }).catch((error)=> {
            this.displayErrorMessage(error);
        });
    }

    open() {
        $('body').append(this.$el);

        this.wrapper.open({
            'clickHandler': (evt:JQueryEventObject)=> {
                this.closeHandler(evt, this)
            }
        });

        this.$el
            .css('opacity', '0')
            .addClass('todo-update-form')
            .css({
                'top': (($(window).height() / 2 - this.$el.height() / 2) + $(window).scrollTop()),
                'left': ($(window).width() / 2) - (this.$el.width() / 2)
            })
            .find('input.js-todo-title').focus();
        this.todoView.$el.effect("transfer", {to: this.$el}, 200, () => {
            this.$el.css('opacity', '')
        });
    }

    close() {
        this.wrapper.close();
        this.$el.effect("transfer", {to: this.todoView.$el}, 200);
        this.$el.remove();
    }

}
class ValidateMessage {
    private $el = $('form:visible .js-validate-error');

    addMessage(error:{Field:string; Message: string}) {
        var $message = $('<li>').text(error.Message);
        this.$el.find('ul').append($message);
    }

    show() {
        this.$el.show();
    }

    close() {
        this.$el.find('li').remove();
        this.$el.hide();
    }
}


class EmptyTodoMessage {
    static open() {
        $('.js-todo-grid').append($('.js-empty-todo').show());
    }

    static close() {
        $('.js-empty-todo').hide();
    }
}
class Loading {
    static close() {
        $('.js-loading').remove();
    }
}

class Page {
    constructor() {
        $('.js-menu').click(()=> {
            $('.left.sidebar').sidebar('toggle');
        });

        $('.js-todo-form-fake input[name="title-fake"]').focus(()=> {
            $('.js-todo-form-fake').hide();
            new TodoCreateForm().open();
        });

        $('.js-empty-trash').click(()=> {
            $('.js-empty-trash-modal')
                .modal({
                    onApprove: ()=> {
                        location.href = "/emptyTrash";
                    }
                })
                .modal('show');
        });

        // Todo: change to trigger pattern
        Page.todoViewList = new TodoViewList();
    }

    static todoViewList:TodoViewList;
}

(() => {
    "use strict";
    $(()=> {
        Handlebars.registerHelper('breaklines', (text:string)=> {
            text = Handlebars.Utils.escapeExpression(text);
            text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
            return new Handlebars.SafeString(text);
        });

        new Page();

    });
})();
