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

     // console.log( options );

     var defaults = {
       minInputLenght : 3 ,
       source : ''
     };

     settings = _.defaults(options, defaults);

     var source = settings.source; 

     // var label    = $('<label/>').attr('for', $(this).attr('id')); 
     var input    = $(this);
     input.hide(); 

     var tagList  = $('<ul/>');
     var wrapper  = $('<div/>').addClass('pmTokenizer'); 

     var acInput = $('<input/>')
     .attr('type', 'text')
     .addClass('acInput')
     .attr('autocomplete', 'off');

     var choices = $('<ul />')
     .addClass('tokenizer-choices');

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
       acInput.val('').focus(); 
     };

     var init = function () {
       wrapper.append (tagList);
       wrapper.append (acInput);
       input.after (wrapper);
       wrapper.append(choices);
       acInput.focus(); 
     }

     var registerEvents = function () {
       $(document).on('click', wrapper, function() {
         acInput.focus(); 
       }); 

       $(document).on('click', '.removeToken', function(e) {
         $(this).closest('span').remove();
       }); 
     }

     init(); 
     registerEvents(); 

     /**
      * Add token from value in input field
      */
     var addTokenFromInput = function (tag) {
       var span = $('<span />').text (tag); 
       span.addClass('token');
      
       var removerHandle = $('<a/>')
        .attr('href', 'javascript:')
        .addClass('removeToken').text('x'); 

       removerHandle.appendTo(span);
       acInput.before(span);
     }; 

     var highlightLastToken = function() {
       wrapper.find('.token:last').addClass('selected');
     };

     var removeLastToken = function () {
       wrapper.find('.token:last').remove();
     };

     var filterSource = function(listItem) {
       var val = acInput.val(); 
       var reg = new RegExp(val, 'gi'); 
       var r = listItem['value'];
       // console.log(r);
       return reg.test(listItem['value']) ; 
     }

     /**
      * read value in input field and scan given array 
      * for options
      */
     var refreshChoices = function () {
       wrapper.find('.tokenizer-choices li').remove();
       if (acInput.val().length >= settings.minInputLenght) {
         if (_.isArray(source)) {
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
        wrapper.find('ul.tokenizer-choices').append($(html));
       }
     }

     $(acInput).on('keyup', function(e) {
       switch(e.keyCode) {
         case 9: 
         case 13: 
         case 188:  
         case 38: 
         case 40:
         break; 
         default:
         refreshChoices(); 
       }
     });

     $(wrapper).on('mouseover', '.tokenizer-choices li', function() {
       wrapper.find('.tokenizer-choices li.selected').removeClass('selected'); 
       $(this).closest('li').addClass('selected');
     });

     /**
      * keydown event on input field
      */
     $(acInput).on('keydown', function(e) {
       console.log(e.keyCode); 
       switch (e.keyCode) { 
         case 9: 
         case 13: 
         case 188:  // tab, enter, or comma
           addTokenFromInput(current()); 
           reset ();
           e.preventDefault();
           break;

         case 8: // back
           if (acInput.val().length == 0) {
             highlightLastToken();
           }; 
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
            refreshChoices(); 
            break;

       }

     }); 

     var choicesPresent = function() {
      return wrapper.find('.tokenizer-choices li').length > 0;
     };
     var findSelected = function() {
       return wrapper.find('.tokenizer-choices li.selected');
     };

     var moveSelectionUp = function() {
       if (choicesPresent()) {
         var selected = findSelected(); 
         if (selected.length) {
           if (selected.prev().length > 0) { 
             selected.removeClass('selected').prev().addClass('selected');
           }
           else {
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
           //   wrapper.find('.tokenizer-choices li:first').addClass('selected');
           // }
         }
         else {
           wrapper.find('.tokenizer-choices li:first').addClass('selected');
         }
       }
     };

     var aa = function() {
       // var acInput = $('<input/>').attr('type', 'text');
       // var label    = $('<label/>').attr('for', $(this).attr('id')); 
       // var project_ids = new Array();

       // label.click (function () { acInput.focus () });
       //input.hide ().removeClass ('tagsAutoComplete');


       var autocomplete = acInput.autocomplete ({
         source: function( request, response ) {
           $("#actions_add_tag_box .file_ids input[type=hidden]").each(function(i, e){
             project_ids[i] = $(e).attr("data-project-id");
           });
           $.getJSON( input.attr ('rel'), {
             term: request.term,
             project_ids: project_ids
           }, response )},

           focus: function (event, ui) {
             return false; // Don't update the input when focusing
           },

           select: function (event, ui) {
             reset ();
             add (ui.item.label);
             return false; // Don't update the input when selecting
           }
         });

         autocomplete.bind ('keydown.autocomplete', function (event) {
           var keyCode = $.ui.keyCode;
           var tag     = current ();

           switch (event.keyCode) {
             case keyCode.ENTER:
             case keyCode.TAB:
             case keyCode.COMMA:
             add (tag);
             reset ();

             if (tag || event.keyCode != keyCode.TAB)
             event.preventDefault ();

             break;

             case keyCode.ESCAPE:
             // Clear the input on ESC
             reset ();
             break;

             case keyCode.BACKSPACE:
             if (!tag)
             remove (tagList.find ('> :last'));
             break;
           }
         });

         autocomplete.bind ('blur.autocomplete', function () {
           add (current ());
         }); 

         autocomplete.data('autocomplete')._renderItem = function (ul, item) {
           var li = $('<li/>')
           .data ('item.autocomplete', item)
           .append ($('<a/>').text(item.label)); 

           if (item.count)
           li.find ('a').append ($('<strong/>').style({'float' : 'right'}).text(item.count));

           return li.appendTo (ul);
         };

         var tags = {}; // mirrors the input value

         var add = function (tag) {
           tag = $.trim (tag).toLowerCase ();

           if (!tag)
           return false;

           if (tags[tag]) {
             tags[tag].stop (true, true).pmHighlight (500);
             return false;
           }

           var item = $('<li/>').append($('<span />')); 
           var link = $('<a />').attr('href', '#').text('x'); 
           item.find ('span').text (tag); // To avoid XSS

           link.click (function () {
             remove (tag);
             return false;
           });

           item.append (link).appendTo (tagList);
           item.data ('tag', tag);

           tags[tag] = item;

           sync ();
           reset ();

           return true;
         };

         var remove = function (tag) {
           var item;

           if (!tag.jquery)
           item = tags[tag];
           else {
             item = tag;
             tag = item.data ('tag');
           }

           item.fadeOut ('fast', function () { $(this).remove () });
           delete tags[tag];

           sync ();
         };

         var sync = function () {
           input.val ($.keys (tags).join (','));
         };

         var reset = function () {
           acInput
           .val ('')
           .autocomplete ('close')
           .removeClass ('ui-autocomplete-loading');
         };

         var current = function () {
           return $.trim (acInput.val ());
         };

         // Pre-populate from existing tags
         //
         $.each (input.val ().split (','), function (_, tag) {
           add (tag);
         });
       };
   }

})(jQuery); 

