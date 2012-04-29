/**
 * jquery.pmtokenizer.js
 *
 * User input tokenizer for jquery/underscore.
 *
 * Fabrizio Regini - Panmind Inc (c) 2012
 *
 */

(function($) {

  $.pmTokenizer = function(input, options) {

     var root = this;

     var defaults = {
       escapeInput : true,
       escapeSelection : true,
       minInputLenght : 1 ,
       source         : '',
       filterHander   : function(query, data) {
         var reg = new RegExp(query, 'gi');
         return reg.test(data.label) ;
       },
       promptMessage  : 'Input name or email addresses',
       tokenHandler   : function(data) { return data.label },
       labelHandler   : function(data) { return data.label },
       onAddition     : function() {},
       onDeletion     : function() {},
       onValid        : function() {},
       onInvalid      : function() {},
       validator      : function(input) {
         var re = new RegExp(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
         return re.test(input);
       }
     };

     this.tokenizeInput = function() {
       addTokenFromInput(current());
     }

     var settings = _.defaults(options, defaults);
     var source = settings.source;
     var wrapper  = $('<div/>').addClass('pmTokenizer'); 
     var acInput = $('<input/>')
        .attr("id", "autocomplete-input")
        .addClass('acInput')
        .attr('type', 'text')
        .attr('autocomplete', 'off');

     var choices = $('<ul/>').addClass('choices');

     var current = function () {
       var selected = choiceSelected(); 
       if (selected.length) {
         return selected.text();
       }
       else {
         return $.trim (acInput.val());
       }
     };

     this.setPrompt = function() {
       acInput.hide();
       var template = _.template('<div class="prompt"><%= message %></div>');
       acInput.after($(template({ message : settings.promptMessage })));
     };

    this.reset = function () {
       wrapper.find('.prompt').remove();
       acInput.show();
       acInput.removeAttr('readonly');
       acInput.width('20px');
       refreshChoices();
       acInput.val('').focus();
     };

     this.init = function () {
       // hide original input

       wrapper.append (acInput);
       wrapper.append(choices);

       wrapper.find('.choices').hide();
       input.hide();

       input.after (wrapper);
       this.setPrompt();
     }

     var deselectAllTokens = function() {
       wrapper.find('.token').removeClass('selected');
     }

     var registerEvents = function () {
       $(wrapper).on('click', '.choices li', function() {
         lastKey = '';
         $(this).addClass('selected'); 
         addTokenFromSelection($(this).data('store'));
         root.reset ();
       });
       $(wrapper).on('click', function(e) {
         lastKey = ''; 
         root.reset();
       });
       $(wrapper).on('click', '.removeToken', function(e) {
         lastKey = '';
         $(this).closest('span').remove();
         e.stopPropagation();
       }); 
       $(wrapper).on('click', '.token', function(e) {
         lastKey = '';
         deselectAllTokens(); 
         $(this).closest('.token').addClass('selected');
         acInput.focus();
       });
     };

     this.clear = function() {
       wrapper.find('.token').remove();
       this.reset();
       this.setPrompt();
     }

     this.init();
     registerEvents(); 

     var removeToken = function(token) {
       var data = token.data('store');
       token.remove();
       settings.onDeletion(data);
     };

     var addTokenFromSelection = function(data) {
       var ele = addToken(settings.tokenHandler(data), settings.escapeSelection);
       $(ele).data('store', data);
       settings.onValid(data);
       settings.onAddition(data);
     };

     /**
      * Add token from value in input field
      */
     var addTokenFromInput = function (token) {
       if (token == '') return;
       var span = addToken(settings.tokenHandler(token), settings.escapeInput);
       var data = { token : token };

       if (!settings.validator(token)) {
         span.addClass('invalid');
         data.valid = false;
         settings.onInvalid(token);
       }
       else {
         settings.onValid(token);
         data.valid = true;
       }
       $(span).data('store', data);
       settings.onAddition(data);
     };

     var addToken = function(token, escape) {
       var span;
       if (escape) {
         span = $('<span />').text (token);
       } else {
         span = $('<span />').html ($(token));
       }
       $(span).addClass('token');
      
       var removerHandle = $('<a/>')
        .attr('href', 'javascript:')
        .addClass('removeToken').html('&#215;');

       removerHandle.appendTo(span);

       acInput.before(span);
       root.reset();
       return span;
     };

     var highlightLastToken = function() {
       wrapper.find('.token:last').addClass('selected');
     };

     var removeLastToken = function () {
       wrapper.find('.token:last').remove();
     };

     var filterSource = function(listItem) {
       var val = acInputVal();
       return settings.filterHander(val, listItem);
     }

     var acInputVal = function() {
       var val =  acInput.val() + String.fromCharCode(lastKey); 
       return val;
     }

     /**
      * read value in input field and scan given array 
      * for options
      */
     var refreshChoices = function () {
       wrapper.find('ul.choices li').remove();
       if (acInputVal().length > 0) {
         if (_.isArray(source)) {
           // find values
           var filtered = _.filter(source, filterSource);
           if (filtered.length > 0 ) {
             wrapper.find('ul.choices').show();
             populateChoices(filtered);

           } else {
             wrapper.find('ul.choices').hide();
           }
         } 
         else if (_.isString(source)) {
           // TODO: load results from ajax
         }
       }
     };

     var populateChoices = function(list) {
       var item ;
       _.each(list, function(i) {
         item = $('<li />').html( settings.labelHandler(i) )
         item.data('store', i);
         wrapper.find('ul.choices').append($(item));
         // $(item).appendTo(wrapper.find('ul.choices'));
       });
     }

     var currentToken = function() {
       return wrapper.find('.token.selected');
     }

     var lastToken = function() {
       return wrapper.find('.token:last');
     }

     var moveLeft = function() {
       acInput.attr('readonly', 'readonly');
       if (currentToken().length > 0) {
         currentToken().removeClass('selected').prev('.token').addClass('selected');
       } else {
         lastToken().addClass('selected');
       }
     }; 

     var moveRight = function() {
       if (currentToken().length > 0) {
         var next = currentToken().next('.token');
         if (next.length > 0) {
           currentToken().removeClass('selected').next().addClass('selected');
         } else {
           currentToken().removeClass('selected');
           root.reset();
         }
       } else {
         lastToken().addClass('selected');
       }
     };

     var inputEmpty = function() {
       return acInput.val() == '';
     }

     $(wrapper).on('mouseover', '.choices li', function() {
       wrapper.find('.choices li.selected').removeClass('selected'); 
       $(this).closest('li').addClass('selected');
     });

     /**
      * keydown event on input field
      */
     var lastKey; 

     wrapper.find('.token').on('keydown', function(e) {
       e.preventDefault();
     });

     $(wrapper).on('keydown', function(e) {
       lastKey = e.keyCode; 
       switch (e.keyCode) { 
         case 9: 
         case 13: 
         case 188:  // tab, enter, or comma
           if (inputEmpty())  {

           } else {
             if (choiceSelected().length > 0) {
               addTokenFromSelection(choiceSelected().data('store'));
             } else {
               addTokenFromInput(current()); 
             }
           }
           root.reset();
           e.preventDefault();
           break;

         case 8: // back
           e.stopImmediatePropagation();
           if (tokenSelected().length > 0) {
             // If a token is selected, remove it
             // and move to the next token or reset
             e.preventDefault();
             removeToken(tokenSelected());
             if (lastToken().length == 0) root.reset ();
             else moveLeft();
           }
           else if (acInput.val().length == 0 && lastToken().length > 0) {
             moveLeft();
           }
           break;

         case 37: // left 
           if (inputEmpty()) moveLeft();
           break;

         case 39: // right
           if (inputEmpty()) moveRight();
           break;

         case 40: // down
            moveSelectionDown();
            e.preventDefault();
            break;

         case 38: // up 
            moveSelectionUp(); 
            e.preventDefault();
            break;

         // TODO: find a better way to handle strange keys like Apples'CMD
         case 91:
           e.preventDefault();
           break;

         default: 
            acInput.show(); 
            setInputSize();
            refreshChoices(); 
            deselectAllTokens();
            break;
       }
     }); 

     var setInputSize = function() {
       acInput.width((acInput.width() + 10) + 'px');
     }
     var choicesPresent = function() {
      return wrapper.find('.choices li').length > 0;
     };
     var choiceSelected = function() {
       return wrapper.find('.choices li.selected');
     };
     var tokenSelected = function() {
       return wrapper.find('.token.selected');
     }

     var moveSelectionUp = function() {
       if (choicesPresent()) {
         var selected = choiceSelected(); 
         if (selected.length) {
           if (selected.prev().length > 0) { 
             selected.removeClass('selected').prev().addClass('selected');
           }
         }
       }
     };

     var moveSelectionDown = function() {
       if (choicesPresent()) {
         var selected = choiceSelected(); 
         if (selected.length) {
           if (selected.next().length > 0) {
             selected.removeClass('selected').next().addClass('selected');
           }
         }
         else {
           wrapper.find('.choices li:first').addClass('selected');
         }
       }
     };
   }
})(jQuery); 
