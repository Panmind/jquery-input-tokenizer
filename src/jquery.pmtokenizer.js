/**
 * jquery.pmtokenizer.js
 *
 * User input tokenizer for jquery/underscore.
 *
 * Fabrizio Regini - Panmind Inc (c) 2012
 *
 */
(function($) {
   $.fn.pmTokenizer = function (options) {
     var defaults = {
       minInputLenght : 1 ,
       source         : '',
       filterHander   : function(query, data) {
         var reg = new RegExp(query, 'gi');
         return reg.test(data.label) ;
       },
       tokenHandler   : function(data) { return data.label },
       labelHandler   : function(data) { return data.label },
       handleInvalid  : function() {},
       handleValid    : function() {},
       validator      : function(input) {
         var re = new RegExp(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
         return re.test(input);
       }
     };

     settings = _.defaults(options, defaults);
     var source = settings.source; 
     var input = $(this);
     input.hide(); 

     var wrapper  = $('<div/>').addClass('pmTokenizer'); 
     var acInput = $('<input/>')
     .attr('type', 'text')
     .addClass('acInput')
     .attr('autocomplete', 'off');

     var choices = $('<ul />')
     .addClass('choices');

     var current = function () {
       var selected = choiceSelected(); 
       if (selected.length) {
         return selected.text();
       }
       else {
         return $.trim (acInput.val ());
       }
     };

     var reset = function () {
       acInput.width('3em');
       acInput.val('').focus(); 
       refreshChoices();
     };

     var init = function () {
       wrapper.append (acInput);
       input.after (wrapper);
       wrapper.append(choices);
       wrapper.find('.choices').hide();
       acInput.focus(); 
     }

     var deselectAllTokens = function() {
       wrapper.find('.token').removeClass('selected');
     }

     var registerEvents = function () {
       $(wrapper).on('click', '.choices li', function() {
         lastKey = '';
         $(this).addClass('selected'); 
         addTokenFromSelection($(this).data()); 
         reset (); 
       });
       $(wrapper).on('click', function() {
         lastKey = ''; 
         acInput.show().focus(); 
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
         e.stopPropagation();
       });
     }

     init(); 
     registerEvents(); 

     var addTokenFromSelection = function(data) {
       addToken(settings.labelHandler(data));
       settings.handleValid(data);
     }

     var addToken = function(token, escape) {
       if (escape) {
         var span = $('<span />').text (token); 
       } else {
         var span = $('<span />').html (token); 
       }
       span.addClass('token');
      
       var removerHandle = $('<a/>')
        .attr('href', 'javascript:')
        .addClass('removeToken').text('x'); 

       removerHandle.appendTo(span);
       acInput.before(span);
       reset(); 
       return span;
     }

     /**
      * Add token from value in input field
      */
     var addTokenFromInput = function (token) {
       var span = addToken(token, true);

       if (!settings.validator(token)) {
        span.addClass('invalid');
        settings.handleInvalid(token);
       }
       else {
         settings.handleValid(token);
       }

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
       wrapper.find('.choices').html('');
       if (acInputVal().length > 0) {
         if (_.isArray(source)) {
           // find values
           var filtered = _.filter(source, filterSource);
           if (filtered.length > 0 ) {
             wrapper.find('.choices').show();
             populateChoices(filtered);
           } else {
             wrapper.find('.choices').hide();
           }
         } 
         else if (_.isString(source)) {
           // TODO: load results from ajax
         }
       }
     };

     var populateChoices = function(list) {
       _.each(list, function(i) {
         $('<li />').html( settings.labelHandler(i) )
         .data(i)
         .appendTo(wrapper.find('ul.choices'));
       });
     }

     var currentToken = function() {
       return wrapper.find('.token.selected');
     }

     var lastToken = function() {
       return wrapper.find('.token:last');
     }

     var moveLeft = function() {
       acInput.hide();
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
           acInput.show().focus();
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

     $(wrapper).on('keydown', function(e) {
       lastKey = e.keyCode; 
       switch (e.keyCode) { 
         case 9: 
         case 13: 
         case 188:  // tab, enter, or comma
           if (!inputEmpty())  {
             if (choiceSelected().length > 0) {
               addTokenFromSelection(choiceSelected().data());
             } else {
               addTokenFromInput(current()); 
             }
            reset ();
          }
           e.preventDefault();
           break;

         case 8: // back
           if (tokenSelected().length > 0) {
             tokenSelected().remove();
           } else {
             if (acInput.val().length == 0) {
               moveLeft();
             }; 
             refreshChoices();
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

         default: 
            acInput.show(); 
            setInputSize();
            refreshChoices(); 
            deselectAllTokens();
            break;
       }
     }); 

     var setInputSize = function() {
       acInput.width((acInput.width() + 20) + 'px');
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
