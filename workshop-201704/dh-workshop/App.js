Ext.define('CustomApp', {

    extend: 'Rally.app.App',

    componentCls: 'app',

    cls: 'my-app-class',

    launch: function() {
        //Write app code here
        var thisApp = this;



        //API Docs: https://help.rallydev.com/apps/2.1/doc/
        var label = Ext.create('Ext.container.Container',{
            tpl: '<b>Button {buttonId} clicked</b>',
            itemId: 'lbl1',
            margin: 50,
            padding: 1
        });
        this.add(label);
        label.update({buttonId: ""});


        var ct = this.add({
            xtype: 'container',
            itemId: 'buttonContainer',
            border: 5,
            style: {
                borderColor: 'red',
                borderStyle: 'solid'
            },
            layout: {
                type: 'vbox'
            },
            items: [{
                xtype: 'rallybutton',
                text: 'click 1',
                cls: 'red-btn',
                itemId: 'btn1',
                disabled: true,
                margin: 50,
                handler: thisApp.showButtonClick,
                scope: thisApp
            },{
                xtype: 'rallybutton',
                text: 'click 2',
                cls: 'blue-btn',
                itemId: 'btn2',
                margin: 50,
                handler: thisApp.showButtonClick,
                scope: thisApp
            },{
                xtype: 'rallybutton',
                text: 'click 3',
                cls: 'blue-btn',
                itemId: 'btn3',
                margin: 50,
                handler: thisApp.showButtonClick,
                scope: thisApp
            }]
        });

    },
    showButtonClick: function(bt){

       var buttons = this.query('rallybutton');
       Ext.Array.each(buttons, function(b){
           if (b.itemId === bt.itemId){
               b.setDisabled(true);
           } else {
               b.setDisabled(false);
           }
       });

      this.down('#lbl1').update({buttonId: bt.text});

    }
});
