Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',

    scopeType: 'iteration',
    //
    //launch: function() {
    //    //Write app code here
    //
    //    //API Docs: https://help.rallydev.com/apps/2.1/doc/
    //
    //},
    onScopeChange: function(timeboxScope){
        console.log('onScopeChange', timeboxScope);

        this.add({
            xtype: 'container',
            html: timeboxScope.getQueryFilter().toString()
        });

        var customCb = this.add({
            xtype: 'rallycombobox',
            fieldLabel: 'scopetype',
            store: Ext.create('Rally.data.custom.Store',{
                data: [{
                    name: 'Iteration',
                    value: 'iteration'
                },{
                    name: 'Release',
                    value: 'release'
                }],
                fields: ['name', 'value']
            }),
            displayField: 'name',
            valueField: 'value'
        });

        customCb.on('select', function(cb){
            alert('you picked a ' + cb.getValue());
        }, this);

    }
});
