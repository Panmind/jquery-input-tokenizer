(function($) {

  /** 
   * This pluing applies to an input field and replaces it with a div
   * including a text field where to input new values. 
   *
   * TODO: 
   * # Tokens can be valid or invalid. 
   * # values should be fetched from an input array
   * # new values are accepted
   * # containing area must grow when new records are added
   * # tokens should have attributes id and value
   * # valid tokens are appended as hidden fields
   *
   *
   *
   */ 
   $.fn.pmTokenizer = function (options) {

     var defaults = {
       minInputLenght : 1 ,
       source : '', 
       validator: function(input) {
         var re = new RegExp(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
         return re.test(input);
       }
     };

     settings = _.defaults(options, defaults);

     var source = settings.source; 

     // var label    = $('<label/>').attr('for', $(this).attr('id')); 
     var input    = $(this);
     input.hide(); 

     var wrapper  = $('<div/>').addClass('pmTokenizer'); 

     var acInput = $('<input/>')
     .attr('type', 'text')
     .addClass('acInput')
     .attr('autocomplete', 'off');

     var choices = $('<ul />')
     .addClass('choices');

     var current = function () {
       var selected = findSelected(); 
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
       acInput.focus(); 
     }

     var deselectAllTokens = function() {
       wrapper.find('.token').removeClass('selected');
     }

     var registerEvents = function () {
       $(wrapper).on('click', '.choices li', function() {
         $(this).closest('li').addClass('selected'); 
         addTokenFromInput(current());
         reset (); 
       });
       $(wrapper).on('click', function() {
         acInput.focus(); 
       });
       $(wrapper).on('click', '.removeToken', function(e) {
         $(this).closest('span').remove();
         e.stopPropagation();
       }); 
       $(wrapper).on('click', '.token', function(e) {
         deselectAllTokens(); 
         $(this).closest('.token').addClass('selected');
         acInput.focus();
       });
     }

     init(); 
     registerEvents(); 

     /**
      * Add token from value in input field
      */
     var addTokenFromInput = function (token) {
       var span = $('<span />').text (token); 
       span.addClass('token');
      
       var removerHandle = $('<a/>')
        .attr('href', 'javascript:')
        .addClass('removeToken').text('x'); 

       removerHandle.appendTo(span);

       if (!settings.validator(token)) {
        span.addClass('invalid');
       }

       acInput.before(span);
     }; 

     var highlightLastToken = function() {
       wrapper.find('.token:last').addClass('selected');
     };

     var removeLastToken = function () {
       wrapper.find('.token:last').remove();
     };

     var filterSource = function(listItem) {
       console.log('filterSource');
       var val = acInputVal();
       var reg = new RegExp(val, 'gi'); 
       var item = listItem['value'];
       var result = reg.test(item) ; 
       if (result == true) {
         // console.log(reg, r, val);
       }
       else {
         console.log(reg, item);
       }
       return result;
     }

     /**
      * 
      */
     var acInputVal = function() {
       var val =  acInput.val() + String.fromCharCode(lastKey); 
       console.log(val);
       return val;
     }

     /**
      * read value in input field and scan given array 
      * for options
      */
     var refreshChoices = function () {
       wrapper.find('.choices li').remove();
       if (acInputVal().length > 0) {
         if (_.isArray(source)) {
         console.log('refreshChoices');
           // find values
           var filtered = _.filter(source, filterSource);
           populateChoices(filtered);
         } 
         else if (_.isString(source)) {
           // TODO: load results from ajax
         }
       } else {
       }
     };

     var populateChoices = function(list) {
       var template = "\
       <% _.each(list, function(item) { %> <li><%= item['value'] %></li> <% }); %>";
       var html = _.template(template, { list : list });
       if ((html).trim().length > 0) {
        wrapper.find('ul.choices').append($(html));
       }
     }

     var currentToken = function() {
       return wrapper.find('.token.selected');
     }

     var lastToken = function() {
       return wrapper.find('.token:last');
     }

     var moveLeft = function() {
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
           acInput.focus();
         }
       } else {
         lastToken().addClass('selected');
       }
     };

     var inputEmpty = function() {
       return acInput.val() == '';
     }

     // $(acInput).on('keyup', function(e) {
     //   switch(e.keyCode) {
     //     case 9: 
     //     case 13: 
     //     case 188:  
     //     case 38: 
     //     case 40:
     //     break; 

     //     case 37: // left 
     //     moveLeft();

     //     break;
     //     case 39: // right
     //     moveRight();

     //     break;
     //     default:
     //     refreshChoices(); 
     //   }
     // });

     $(wrapper).on('mouseover', '.choices li', function() {
       wrapper.find('.choices li.selected').removeClass('selected'); 
       $(this).closest('li').addClass('selected');
     });

     /**
      * keydown event on input field
      */
     var lastKey; 

     $(acInput).on('keydown', function(e) {
       lastKey = e.keyCode; 
       switch (e.keyCode) { 
         case 9: 
         case 13: 
         case 188:  // tab, enter, or comma
           if (!inputEmpty())  {
            addTokenFromInput(current()); 
            reset ();
          }
           e.preventDefault();
           break;

         case 8: // back
           if (acInput.val().length == 0) {
             moveLeft();
           }; 
           refreshChoices();
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
            console.log('default');
            setInputSize();
            refreshChoices(); 
            break;

       }

     }); 

     var setInputSize = function() {
       acInput.width((acInput.width() + 20) + 'px');
     }

     var choicesPresent = function() {
      return wrapper.find('.choices li').length > 0;
     };
     var findSelected = function() {
       return wrapper.find('.choices li.selected');
     };

     var moveSelectionUp = function() {
       if (choicesPresent()) {
         var selected = findSelected(); 
         if (selected.length) {
           if (selected.prev().length > 0) { 
             selected.removeClass('selected').prev().addClass('selected');
           }
         }
       }
     };

     var moveSelectionDown = function() {
       if (choicesPresent()) {
         var selected = findSelected(); 
         if (selected.length) {
           if (selected.next().length > 0) {
             selected.removeClass('selected').next().addClass('selected');
           }
           // else {
           //   wrapper.find('.choices li:first').addClass('selected');
           // }
         }
         else {
           wrapper.find('.choices li:first').addClass('selected');
         }
       }
     };
   }

})(jQuery); 

