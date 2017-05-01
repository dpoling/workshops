Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    config: {
        defaultSettings: {
            model: 'Defect',
            defaultDaysAgo: 7
        }
    },

    launch: function() {
        //Write app code here

        var datePicker = this.add({
            xtype: 'rallydatefield',
            fieldLabel: 'Deleted Since',
            labelAlign: 'right',
            value: this.getDefaultDate()
        });
        datePicker.on('select', this.updateWindow, this);

        this.updateWindow(datePicker, datePicker.getValue());
    },
    getDefaultDate: function(){
        var daysAgo = this.getSetting('defaultDaysAgo') || 7;
        return Rally.util.DateTime.add(new Date(), 'day', -daysAgo);
    },
    getModel: function(){
        return this.getSetting('model');
    },
    updateWindow: function(datePicker, dateValue){
        console.log('updateWindow',datePicker, dateValue);

        //todo: check that dateValue is valid date.

        //get historical oids from selected date
        //this.fetchHistoricalObjectIDs(dateValue).then({
        //    success: function(records){ ... },
        //    failure: function() { ... },
        //    scope: this
        //});

        //get current oids that have been updated since selected date

        var promises = [
            this.fetchHistoricalObjectIDs(dateValue),
            this.fetchCurrentObjectIDs(dateValue)
        ];

        this.setLoading("Loading historical and current data to compare...");
        Deft.Promise.all(promises).then({
            success: this.processData,     //compare current and historical to figure out deleted items
            failure: this.showErrorNotification,
            scope: this
        }).always(function(){
            this.setLoading(false);
        },this);


        //build deleted item custom store

        //create deleted item grid

    },
    processData: function(results){
        //compare current and historical to figure out deleted items
        var historicalSnapshots = results[0];
        var currentRecords = results[1];

        ////current objctIDs are current wsapi objects that have been updatd since the selected date
        //var currentObjectIDs = Ext.Array.map(currentRecords, function(r){
        //    return r.get('ObjectID');
        //});
        //
        ////historical object ids are artifacts that have been modified (or possibly deleted) since
        ////the selected date
        //var historicalObjectIDs = Ext.Array.map(historicalSnapshots, function(h){
        //    return h.get('ObjectID');
        //});
        //
        //var suspectItems = Ext.Array.difference(historicalObjectIDs,currentObjectIDs);
        //
        //console.log('suspect Items', historicalObjectIDs,currentObjectIDs,suspectItems);
        //
        ////we know the historical snapshots are sorted descending ("sort": { "_ValidFrom": -1 }
        //
        //var relevantHistoricalObjects = Ext.Array.filter(historicalSnapshots, function(h){
        //    return Ext.Array.contains(suspectItems, h.get('ObjectID'));
        //});
        //
        //var hash = {};
        //Ext.Array.each(relevantHistoricalObjects, function(i){
        //    if (!hash[i.get('ObjectID')]){
        //        hash[i.get('ObjectID')] = i.getData();
        //    } else {
        //        //If the items are not in descending order, we'll have to
        //        //test some additional logic here to make sure we are getting hte latest snapshot
        //        //if (hash[i.get('ObjectID')]._ValidTo < i.get('_ValidTo')){
        //        //
        //        //}
        //    }
        //});
        //
        //var deDupedRelevantObjects = Ext.Object.getValues(hash);
        //
        //
        var deDupedRelevantObjects = LookbackCalculator.findDeletedItems(historicalSnapshots, currentRecords);
        this.buildCustomGrid(deDupedRelevantObjects);
    },
    buildCustomGrid: function(suspectItems){

        var fields = ['ObjectID'];
        if (suspectItems.length > 0){
            fields = Ext.Object.getKeys(suspectItems[0]);
        }

        var store = Ext.create('Rally.data.custom.Store',{
            data: suspectItems,
            fields: fields,
            pageSize: suspectItems.length
        });

        if (this.down('rallygrid')){
            this.down('rallygrid').destroy();
        }

        console.log('fields', fields);
        this.add({
            xtype: 'rallygrid',
            store: store,
            showPagingToolbar: false,
            margin: 10,
            showRowActionsColumn: false,
            columnCfgs: [{
                dataIndex: 'FormattedID',
                text: 'ID'
            },{
                dataIndex: 'Name',
                text: 'Name',
                flex: 2
            },{
                dataIndex: 'Project',
                text: 'Project',
                flex: 1,
                renderer: function(v){
                    return v && v.Name;
                }
            },{
                dataIndex: "_ValidTo",
                text: 'Valid To',
                renderer: function(v){
                    var dt= Rally.util.DateTime.fromIsoString(v);
                    return Rally.util.DateTime.format(dt,'Y-m-d');
                }
            }],
            viewConfig: {
                emptyText: 'No suspected deleted items found'
            }
        });

    },
    showErrorNotification: function(msg){
        Rally.ui.notify.Notifier.showError({message: msg});
    },
    getCurrentProjectObjectID: function(){
        return this.getContext().getProject().ObjectID;
    },
    fetchHistoricalObjectIDs: function(dateInHistory){
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.lookback.SnapshotStore', {
            fetch: ['FormattedID', 'Name','_User','_ValidTo','Project'],
            findConfig: {
                "_TypeHierarchy": this.getModel(),  //another query:  _TypeHierarchy: {$in: ['Defect','HierarchicalRequirement']}
                //"__At": Rally.util.DateTime.toIsoString(dateInHistory),
                "_ValidTo": {
                    "$lt": Rally.util.DateTime.toIsoString(new Date()),
                    "$gte": Rally.util.DateTime.toIsoString(dateInHistory)
                },
                "_ProjectHierarchy": this.getCurrentProjectObjectID(),
            },
            "sort": { "_ValidTo": -1 },
            limit: 'Infinity',
            removeUnauthorizedSnapshots: true,
            hydrate: ['Project']
        }).load({
            callback: function(snapshots, operation, success){
                console.log('fetchHistoricalDataObjectIDs', snapshots, operation, success);
                if (operation.wasSuccessful()){
                    deferred.resolve(snapshots);
                } else {
                    var errorMsg = "Failed to load Lookback snapshots: " + operation.error && operation.error.errors.join('<br/>');
                    deferred.reject(errorMsg);
                }
            }
        });
        return deferred.promise;
    },
    fetchCurrentObjectIDs: function(dateInHistory){
        var deferred = Ext.create('Deft.Deferred');


        var filters = [{
            property: 'LastUpdateDate',
            operator: '>=',
            value: Rally.util.DateTime.toIsoString(dateInHistory)
        },{
            property: 'CreationDate',
            operator: '>=',
            value: Rally.util.DateTime.toIsoString(dateInHistory)
        }];
        filters = Rally.data.wsapi.Filter.or(filters);

        Ext.create('Rally.data.wsapi.Store',{
            fetch: ['ObjectID'],
            filters: filters,
            limit: 'Infinity',
            model: this.getModel()
        }).load({
            callback: function(records, operation, success){
                console.log('fetchCurrentData', records, operation, success);
                if (operation.wasSuccessful()){
                    deferred.resolve(records);
                } else {
                    var errorMsg = "Failed to load WSAPI records: " + operation.error && operation.error.errors.join('<br/>');
                    deferred.reject(errorMsg);
                }
            }
        });

        return deferred.promise;
    }
});
