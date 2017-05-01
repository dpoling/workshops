Ext.define('LookbackCalculator',{
    singleton: true,

    findDeletedItems: function(historicalSnapshots, currentRecords){

        //current objctIDs are current wsapi objects that have been updatd since the selected date
        var currentObjectIDs = Ext.Array.map(currentRecords, function(r){
            return r.get('ObjectID');
        });

        //historical object ids are artifacts that have been modified (or possibly deleted) since
        //the selected date
        var historicalObjectIDs = Ext.Array.map(historicalSnapshots, function(h){
            return h.get('ObjectID');
        });

        var suspectItems = Ext.Array.difference(historicalObjectIDs,currentObjectIDs);

        console.log('suspect Items', historicalObjectIDs,currentObjectIDs,suspectItems);

        //we know the historical snapshots are sorted descending ("sort": { "_ValidFrom": -1 }

        var relevantHistoricalObjects = Ext.Array.filter(historicalSnapshots, function(h){
            return Ext.Array.contains(suspectItems, h.get('ObjectID'));
        });

        var hash = {};
        Ext.Array.each(relevantHistoricalObjects, function(i){
            if (!hash[i.get('ObjectID')]){
                hash[i.get('ObjectID')] = i.getData();
            } else {
                //If the items are not in descending order, we'll have to
                //test some additional logic here to make sure we are getting hte latest snapshot
                //if (hash[i.get('ObjectID')]._ValidTo < i.get('_ValidTo')){
                //
                //}
            }
        });
        return Ext.Object.getValues(hash);
    }


});