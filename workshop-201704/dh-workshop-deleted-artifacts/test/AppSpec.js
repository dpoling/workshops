describe('CustomApp', function() {

    var useObjectID = function(value,record) {
        if ( record.get('ObjectID') ) {
            return record.get('ObjectID');
        }
        return 0;
    };

    Ext.define('mockDefect',{
        extend: 'Ext.data.Model',
        fields: [
            {name:'ObjectID', type: 'int'},
            {name:'Name',type:'string'},
            {name:'FormattedID',type:'int'},
            {name:'id',type:'int',convert:useObjectID},
        ]
    });

    Ext.define('mockSnapshot',{
        extend: 'Ext.data.Model',
        fields: [
            {name:'ObjectID', type: 'int'},
            {name:'Name',type:'string'},
            {name:'FormattedID',type:'int'},
            {name:'id',type:'int',convert:useObjectID},
            {name:'_ValidTo',type:'string'}
        ]
    });

    var createModel = function(fields){
        return Ext.create('mockDefect',fields);
    };

    it ('should find deleted items', function(){
        var currentDefects = [
            createModel({ObjectID: 1, FormattedID: "DE1"}),
            createModel({ObjectID: 2, FormattedID: "DE2"}),
            createModel({ObjectID: 3, FormattedID: "DE3"})
        ];

        var snapshots = [
            createModel({ObjectID: 1, FormattedID: "DE1"}),
            createModel({ObjectID: 2, FormattedID: "DE2"}),
            createModel({ObjectID: 4, FormattedID: "DE4"}),
            createModel({ObjectID: 4, FormattedID: "DE4"})
        ];

        var deletedItems = LookbackCalculator.findDeletedItems(snapshots, currentDefects);

        expect(deletedItems.length).toEqual(1);
        expect(deletedItems[0].ObjectID).toEqual(4);

    });


    // Write app tests here!
    // Useful resources:
    // =================
    // Testing Apps Guide: https://help.rallydev.com/apps/2.1/doc/#!/guide/testing_apps
    // SDK2 Test Utilities: https://github.com/RallyApps/sdk2-test-utils
    
});
