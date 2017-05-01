Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    config: {
        defaultSettings: {
            model: 'HierarchicalRequirement',
            startDaysAgo: 90,
            query: '',
            defaultVelocity: 10
        }
    },

    launch: function() {
        //Write app code here

        //API Docs: https://help.rallydev.com/apps/2.1/doc/
        this.fetchThroughput().then({
            success: this.addChart,
            scope: this
        });

       // this.addChart();
    },
    getVelocity: function(){
        return this.getSetting('defaultVelocity');
    },
    getNumberOfThroughputWeeks: function(){
        return 3;
    },
    getThroughputFilters: function(){

        var weeks = this.getNumberOfThroughputWeeks(),
            weeksAgo = Rally.util.DateTime.add(new Date(), 'week', -weeks);

        var filter = Ext.create('Rally.data.wsapi.Filter',{
            property: "AcceptedDate",
            operator: ">=",
            value: Rally.util.DateTime.toIsoString(weeksAgo)
        });

        if (!this.getFilters() || (Ext.isArray(this.getFilters()) && this.getFilters().length === 0)){
            return filter;
        }

        return filter.and(this.getFilters());

    },
    getFilters: function(){
        //todo, get filter form query stirng and adapt for a lookback store
        return [];
    },
    fetchThroughput: function(){
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.wsapi.Store',{
            model: this.getModel(),
            fetch: ['ObjectID'],
            filters: this.getThroughputFilters(),
            limit: 1,
            pageSize: 1
        }).load({
            callback: function(records, operation){
                console.log('fetchThroughput', operation, records);
                if (operation.wasSuccessful() && operation.resultSet && operation.resultSet.totalRecords){
                    console.log('operation', operation.resultSet.totalRecords);
                    deferred.resolve(operation.resultSet.totalRecords/this.getNumberOfThroughputWeeks());
                } else {
                    deferred.resolve(0);
                }
            },
            scope: this
        });


        return deferred.promise;
    },
    addChart: function(throughputPerWeek){


        this.add({
            xtype: 'rallychart',
            storeType: 'Rally.data.lookback.SnapshotStore',
            storeConfig: {
                findConfig: {
                    _TypeHierarchy: this.getModel(),
                    _ProjectHierarchy: this.getContext().getProject().ObjectID,
                    ScheduleState: {$lt: "Accepted"},
                    _ValidTo: {$gt: Rally.util.DateTime.toIsoString(this.getStartDate())}
                }
            },
            calculatorType: 'StoryBurndownCalculator',
            calculatorConfig: {
                startDate: this.getStartDate(),
                endDate: Rally.util.DateTime.add(new Date(), 'day', 90),
                granularity: "week",
                timeZone: "America/Chicago",
                velocity: throughputPerWeek
            },
            chartConfig: {
                chart:{
                    type: 'column'
                },
                title: {
                    text: 'Story Burndown'
                },
                xAxis: {
                    title: 'Date',
                    tickInterval: 1,
                    labels: {
                        rotation: 45
                    }
                },
                yAxis: {
                    title: 'Story Count'
                }
            }
        });
    },
    getModel: function(){
        return this.getSetting('model');
    },
    getStartDate: function(){
        var daysAgo = this.getSetting('startDaysAgo');
        return Rally.util.DateTime.add(new Date(), 'day', -daysAgo);
    }
});
