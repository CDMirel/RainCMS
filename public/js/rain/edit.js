var RainEdit = {
    
    /* init all the tools to edit page */
    init: function(){
        this._init_aloha();
        this._init_block_sortable();
        this._init_toolbox();
        this._init_buttons();
        
        
    /* Upload image directly in content */
    /* Rain.add_script( javascript_url + "rain/edit.dragdropupload.js" ); */
    },

    /* init aloha editor */
    _init_aloha: function(){
        var $ = Aloha.jQuery;
        $('.content>.text, .content>.summary, .content>.title').aloha();
        $('.content>.text, .content>.summary, .content>.title').keyup(function(e){
            switch( e.keyCode ){
                case 27: /* Esc */
                case 37: /* Left */
                case 38: /* Up */
                case 39: /* Right */
                case 40: /* Down */
                case 9:  /* Tab */
                case 16:  /* Shift */
                case 17:  /* Control */
                case 18:  /* Alt */
                case 20:  /* Caps lock*/
                case 35:  /* End */
                case 36:  /* Home */
                case 45:  /* Insert */
                case 19:  /* Pause Break */
                case 91:  /* Command */
                case 93:  /* Right Command */
                    break;
                default:
                    RainEdit.enable_save_changes_button();
            }
        });

        setTimeout( function(){
            $('.aloha-sidebar-bar').fadeOut();
        }, 600 );

    },
    
    /* Enable order content list */
    _init_block_sortable: function ( content_id ){
        $(".rain_load_area_edit_content").each(function(){
            $(this).sortable({
                opacity: 0.5,
                handle: '.rain_block_edit_title',
                connectWith: '.rain_load_area_edit_content',
                disableSelection: true,
                scroll: true,
                cancel: "#rain_block_main",
                update: function( i ){
                    RainEdit.enable_save_changes_button();
                    init_aloha();
                }
            });
        });

    },
    
    /*
    // Fix the block setting functionality
    */
    _init_buttons: function(){
        
        $('.rain_load_area_add_block').live("click", function(){
            var load_area_name_class = $(this).attr('class').split(' ')[1];
            var load_area = load_area_name_class.match(/rain_load_area_(.*)/)[1];
            RainEdit.block_new( load_area );
        });
        $('.rain_block_setting').live("click", function(){
            var block_class_id = $(this).attr('class').split(' ')[1];
            var block_id = (block_class_id.match(/rain_block_(\d*)/))[1];
            var title_div = $(this).parent().parent().find(".rain_block_title")[0];
            var title = $(title_div).html();
            
            RainEdit.block_setting( block_id, title );
        });

    },
    
    block_delete: function ( block_id ){

        if( confirm( "Are you sure you want to delete this block?" ) ){
            RainEdit.block_setting_close();
            $.post( ajax_file + "rain_edit/block_delete/" + block_id, function( result ){
                $('#rain_block_' + block_id).slideUp(function(){
                    $(this).remove();
                });
            });

        }
    },

    block_setting: function ( block_id, title ){

        Rain.add_script( javascript_url + "jquery/jquery.form.min.js" );

        $('#rain_block_'+block_id).addClass("selected");
        if( !title )
            title = "Loading";
        
        RainPopup.init( title );

        $.getJSON(ajax_file+"rain_edit/block_settings_get/"+block_id, function(json){
            
            var title = json["block"]["name"];
            var html = "";
            if( json["options"].length ){
                html += '<form id="block_settings" name="block_settings" action="' + ajax_file + 'rain_edit/block_settings_save/'+block_id+'" method="POST">'
                for( var i in json["options"] ){
                    var block_option = json["options"][i];
                    var option_name = block_option.name;
                    var option_title = block_option.title;
                    if( option_name ){
                        var option_value = block_option.value;
                        html += option_title + ': <input type="text" name="'+option_name+'" value="'+option_value+'"/><br>';
                    }
                }
                html += '<input type="submit" value="SAVE" class="btn btn-primary"/>';
                html += '</form>';
                
            }

            html += '<a class="rain_block_delete">Delete this block?</a>';
            $('.rain_block_delete').live("click",function(){
                RainEdit.block_delete( block_id );
            })

            RainPopup.html(html);
            RainPopup.title(title);

            $('#block_settings').ajaxForm( function(){
                RainEdit.block_refresh();
            })

        });

    },

    block_new: function ( load_area ){

        /* open a popup to create a new block */

        /* load scripts */
        Rain.add_script( javascript_url + "jquery/jquery.form.min.js" );
        Rain.add_script( javascript_url + "jquery/jquery.validate.min.js" );

        /* load the popup */
        RainPopup.init( load_area + " &gt; New Block" );

        /* get the type childs list */
        $.getJSON( ajax_file + "rain_edit/block_type_list/" + load_area, function( json ){

            var block_type_list = json.block_type_list;
            var html = "";

            html += '<div class="new_block_list"><ul>';
            if( block_type_list ){
                for( var i = 0, n=block_type_list.length; i<n; i++ ){
                    html += '<li onclick="RainEdit._block_new_setting('+block_type_list[i].block_type_id+', \''+load_area+'\' )">'+block_type_list[i].type+'</li>';
                }
            }
            html += '</ul></div>';
           
            RainPopup.html( html );
 
        })


    },
    
    block_new_list_select: function(){
        $('.new_content_list').show();
        $('.new_content_setting').hide();
    },
    
    _block_new_setting: function ( block_type_id, load_area ){
        if( !$('.new_content_setting').html() ){
            var html = '<div class="new_block_setting"><a href="javascript:RainEdit.block_new_list_select();">Back</a><div class="content_form"></div></div>';
            RainPopup.append( html );
        }
        $('.new_block_list').hide();
        $('.new_block_setting').show();

        html =  '<form id="rain_new_block_form" action="'+ajax_file+'rain_edit/block_new/'+load_area+'/" method="post">';
        html += '<input type="hidden" name="block_type_id" value="'+block_type_id+'">';
        html += 'Title <br><input type="text" name="title" value="" class="required"/><br>';
        html += 'Content <br><textarea name="content" class="required"></textarea>';
        html += '<input type="submit" value="SAVE" class="btn btn-primary"/>';
        html += '</form>';

        $('.content_form').html(html);

        $("#rain_new_block_form").validate({
            submitHandler: function(form){
                $('#rain_new_block_form').hide();
                $(form).ajaxSubmit({
                    dataType: "json",
                    success:function( json ){
                        if( json.success ){
                            RainEdit.block_refresh();
                        }
                        else{
                            RainWindow.html( json.message );
                        }
                    }

                });
            }
        });

    },

    /* close the block settings */
    block_setting_close: function ( block_id ){
        $('.rain_block_edit').removeClass("selected");
        $('.rain_popup').fadeOut("fast", function(){
            $("html,body").css("overflow","scroll");
            $(this).remove();
        })
    },
    
    /* reload one selected block */
    block_refresh: function (){
        window.location.reload();
    },
    
    enable_save_changes_button: function (){
        $('#save_changes_button').removeClass('disabled').addClass('on').unbind('click').click( function(){
            RainEdit.save_changes();
        })
    },

    disable_save_changes_button: function (){
        $('#save_changes_button').removeClass('on').addClass('disabled').unbind('click');
    },
    
    
    /* save the change of the page */
    save_changes: function (){
        RainEdit.disable_save_changes_button();

        /* save the position of the blocks */
        $(".rain_load_area_edit_content").each( function(i){
            var load_area = this.id.substr(15);
            var sortedList = $(this).sortable("serialize");
            $.post( ajax_file + "rain_edit/block_sort/", {
                load_area:load_area, 
                content_id:content_id, 
                sortable:sortedList
            }, function(){

                });
        })

        /* save the content of the blocks */
        var block_to_edit = [];
        $('.rain_block_editable').each(function(){
            var class_list = $(this).attr('class');
            if( m = class_list.match( /.*rain_content_(\d*).*/ ) ){
                var content_id = m[1];

                /* get title and text of the content */
                var content_text = $('.rain_content_' + content_id + ' .content>.text' ).html();
                var content_title = $('.rain_content_' + content_id + ' .content>.title' ).html();
                var content_summary = $('.rain_content_' + content_id + ' .content>.summary' ).html();
                $.post( ajax_file + "rain_edit/content_wysiwyg_update/"+content_id, {
                    title:content_title, 
                    content:content_text,
                    summary:content_summary
                }, function(){
                    /* edit_mode_off(); */
                    });
            }
            else{
            /* edit_mode_off(); */
            }

        })

    },
    
    _init_toolbox: function (){
        $("body").append( '<div id="toolbox"></div>' );
        $('#toolbox').append( '<a href="'+admin_file+'" class="tooltip_popup logo"></a>' );
        $('#toolbox').append( '<a id="save_changes_button" class="tooltip_popup disabled" title="Enable/disable edit mode">Save Changes</a>' );
    }

};