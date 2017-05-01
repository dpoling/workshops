Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    config: {
        defaultSettings: {
            myQuery: '',
            notStartedStates: ["", "DiscoverFeature"],
            inProgressStates: ["DevelopFeature","MeasureFeature"],
            doneStates: ["DoneWithFeature"],
            model: 'PortfolioItem/Feature'
        }
    },

    items: [{
        xtype: 'container',
        itemId: 'chartBox'
    },{
        xtype:'container',
        itemId: 'gridBox'
    }],

    launch: function() {
        //Write app code here
        var model = this.getSetting('model');

        var store = this.createStore(model);

        this.buildGridboard(model);

    },
    buildGridboard: function(model, chartFilters){
        //This function is to build the initial gridboard

        var context = this.getContext();

        this.down('#gridBox').removeAll();

        var filters = this.getFilters(chartFilters);

        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: [model],
            enableHierarchy: true,
            filters: filters
        }).then({
            success: function(store){
                store.load();
                this.down('#gridBox').add({
                    xtype: 'rallygridboard',
                    context: context,
                    modelNames: [model],
                    toggleState: 'grid',
                    plugins: [{
                        ptype: 'rallygridboardfieldpicker',
                        headerPosition: 'left',
                        modelNames: [model],
                        stateful: true,
                        stateId: context.getScopedStateId('columns-example')
                    }],
                    gridConfig: {
                        store: store,
                        columnCfgs: ['FormattedID','Name','State'],
                      //  filters: filters
                    },
                    height: 400
                });
            },
            failure: function(){
                Rally.ui.notify.Notifier.showError({message: "Store load failed"});
            },
            scope: this
        });

    },
    updateFilters: function(filters){
        //We are going to use this function to update the gridboard filters
        var model = this.getSetting('model');
        this.buildGridboard(model, filters);
    },
    getNotStartedStates: function(){
        console.log('getNotStartedStates', this.getSetting('notStartedStates'));
        return this.getSetting('notStartedStates');
    },
    getInProgressStates: function(){
        return this.getSetting('inProgressStates');
    },
    getDoneStates: function(){
        return this.getSetting('doneStates');
    },
    addChart: function(records){

        console.log('--- addChart records', records);


        var stateHash = {},
            dataHash = {};

        dataHash["Not Started"] = 0;
        dataHash["In Progress"] = 0;
        dataHash["Done"] = 0;


        for (var i=0; i < records.length; i++){
            var state = records[i].get('State');

            var stateName = state && state.Name || "";

            if (Ext.Array.contains(this.getNotStartedStates(), stateName)){
                dataHash["Not Started"]++;
            }
            if (Ext.Array.contains(this.getInProgressStates(), stateName)){
                dataHash["In Progress"]++;
            }
            if (Ext.Array.contains(this.getDoneStates(), stateName)){
                dataHash["Done"]++;
            }

            if (!stateHash[stateName]){
                stateHash[stateName] = 0;
            }
            stateHash[stateName]++;
        }


        var data = [];
        Ext.Object.each(dataHash, function(key, val){

            data.push([key, val]);
        });

        var chartData = {
            series: [{
                type: 'pie',
                name: '# Features',
                innerSize: '50%',
                data: data
            }]
        };


        var thisApp = this;
        this.down('#chartBox').add({
            xtype: 'rallychart',
            chartConfig: {
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: 0,
                    plotShadow: false
                },
                title: {
                    text: this.getTitle(records),
                    align: 'center',
                    verticalAlign: 'middle',
                    useHTML: true,
                    y: 40
                },
                tooltip: {
                    pointFormat: '{series.name}: {point.y}<br/><b>{point.percentage:.1f}%</b>'
                },
                plotOptions: {
                    series: {
                        point: {
                            events: {
                                click: function (event) {
                                    var pointName = event && event.currentTarget && event.currentTarget.name || null;
                                    if (pointName){
                                        console.log('pointName', pointName);

                                        var getStates = Ext.bind(thisApp.getStatesForPointName, thisApp);
                                        var states = getStates(pointName);
                                        console.log('states', states);

                                        if (states && states.length > 0){
                                            var filters = Ext.Array.map(states, function(s){
                                                return {
                                                    property: 'State.Name',
                                                    value: s
                                                };
                                            });
                                            if (filters.length > 1){
                                                filters = Rally.data.wsapi.Filter.or(filters);
                                            } else {
                                                filters = Ext.create('Rally.data.wsapi.Filter',filters[0]);
                                            }
                                            var scopedUpdateFilter = Ext.bind(thisApp.updateFilters, thisApp);
                                            scopedUpdateFilter(filters);
                                           // this.buildGridboard(this.getSetting('model'), filters);
                                        }
                                    }
                                }
                            }
                        }
                    },
                    pie: {
                        dataLabels: {
                            enabled: true,
                            distance: -50,
                            style: {
                                fontWeight: 'bold',
                                color: 'white'
                            }
                        },
                        startAngle: -90,
                        endAngle: 90,
                        center: ['50%', '75%']
                    }
                }
            },
            chartData: chartData
        });

    },
    getStatesForPointName: function(pointName){
        if (pointName === "Not Started"){
            return this.getNotStartedStates();
        }

        if (pointName === "In Progress"){
            return this.getInProgressStates();
        }

        if (pointName === "Done"){
            return this.getDoneStates();
        }
        return [];
    },
    getTitle: function(records){
        return '<div class="big-text">' + records.length + '</div> Features';
    },
    addGrid: function(){


        var model = this.getSetting('model');

        this.add({
            xtype: 'rallygrid',
            storeConfig: {
                model: model,
                fetch: ['FormattedID', 'Name', 'Release', 'ReleaseDate', 'Owner', 'UserName','UserStories:summary[ScheduleState]'],
                filters: this.getFilters(),
                pageSize: 2000,
                listeners: {
                    load: function(thisStore){
                        //this.down('#totalRecords').update({totalRecords: thisStore.totalCount});
                    },
                    scope: this
                }
            },
            columnCfgs: [
                'FormattedID',
                'Name',
                {
                    dataIndex: 'Release',
                    text: 'Release Date',
                    renderer: function(value, m, record){

                        if (value && value.ReleaseDate){
                            var date = Rally.util.DateTime.fromIsoString(value.ReleaseDate);
                            return Ext.String.format("<b>{0}</b> ({1})", value.Name, Rally.util.DateTime.format(date, 'Y-m-d'));
                        }
                        return '-- No Release Date --';
                    }
                },{
                    dataIndex: 'Summary',
                    text: 'Schedule State Breakdown',
                    renderer: function(v,m,r){
                        var summary = r.get('Summary');
                        console.log('Summary', summary);
                        if (summary.UserStories && summary.UserStories.ScheduleState){
                            return Ext.String.format("Accepted: {0}<br/>Completed: {1}<br/>In-Progress: {2}<br/>Defined: {3}",
                                summary.UserStories.ScheduleState["Accepted"] || 0,
                                summary.UserStories.ScheduleState["Completed"] || 0,
                                summary.UserStories.ScheduleState["In-Progress"] || 0,
                                summary.UserStories.ScheduleState["Defined"] || 0
                            );
                        }
                        return v;
                    }
                },
                'PercentDoneByStoryCount'
            ],
            showPagingToolbar: false
        });
    },
    getFilters: function(chartFilters){

        if (chartFilters){
            console.log('getFilters', chartFilters.toString());
        }
        ////From a query string
        var myQueryString = this.getSetting('myQuery'),
            queryFilters = null;

        if (myQueryString && myQueryString.length > 0){
            queryFilters = Rally.data.wsapi.Filter.fromQueryString(myQueryString);
        }


        if (chartFilters && queryFilters){
            return chartFilters.and(queryFilters);
        } else {

            if (chartFilters){
                return chartFilters;
            } else if (queryFilters) {
                return queryFilters;
            }
        }
        return [];
    },
    createStore: function(model){
        var thisApp = this;

        var store = Ext.create('Rally.data.wsapi.Store',{
            model: model,
            fetch: ['State','Name','FormattedID','Release','ReleaseDate','UserStories:summary[ScheduleState]','PercentDoneByStoryCount'],
            filters: this.getFilters(),
            pageSize: 2000,
            limit: 'Infinity'
        });

        store.load({
            callback: function(records, operation, success){
                 this.addChart(records);
            },
            scope: thisApp
        });

        return store;
    },
    getSettingsFields: function() {
        return [{
            xtype: 'textareafield',
            name: 'myQuery',
            width: 500,
            fieldLabel: 'Query',
            labelAlign: 'right',
            validateOnChange: false,
            validateOnBlur: false,
            validator: function(value){
                try {
                    console.log('value', value);
                    if (value && value.length){
                        Rally.data.wsapi.Filter.fromQueryString(value);
                    }
                } catch (e){
                    Rally.ui.notify.Notifier.showError({message: e.message});
                    return e.message;
                }
                return true;
            }
        }];
    }

});
