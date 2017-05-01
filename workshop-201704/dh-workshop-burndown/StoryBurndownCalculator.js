Ext.define('StoryBurndownCalculator',{
    extend: 'Rally.data.lookback.calculator.TimeSeriesCalculator',
   // extend: 'Rally.data.lookback.Lumenize.TimeSeriesCalculator',
    getMetrics: function(){

        return [
            {
                "field": "ObjectID",
                "as": "storyCount",
                "display": "column",
                "f": "count"
            }
        ];
    },
    //getDerivedFieldsOnInput: function(){
    //    return [
    //        {
    //            "field": "ObjectID",
    //            "as": "storyCount",
    //            "display": "column",
    //            "f": "count"
    //        }
    //    ];
    //},
    getDerivedFieldsAfterSummary: function(){

        var startDate = this.startDate;  //Rally.util.DateTime.add(new Date(), 'day', -90);
        console.log('startDate', this.startDate);
        var velocity = this.velocity;
        var currentIndex = Rally.util.DateTime.getDifference(new Date(), startDate,'week');

        return [{
                as: 'Past non-accepted Story Count',
                f: function (row, index, summaryMetrics, seriesData) {
                    console.log('row', row, index, summaryMetrics, seriesData);
                    var date = Rally.util.DateTime.fromIsoString(row.tick);
                    if (date > new Date()){
                        return 0
                    }
                    return row.storyCount;
                }
            },{
            as: 'Projected',
            f: function (row, index, summaryMetrics, seriesData) {
                if (index < currentIndex){
                    return null;
                }

                //CurrentCount - ((Date week - current week) * velocity)
                var currentCount = seriesData[currentIndex].storyCount;
                var weekDelta = index - currentIndex;

                return Math.max(currentCount - (weekDelta * velocity),0) || null;
            },
            display: 'line'
        }];
    },
    prepareCalculator: function (calculatorConfig) {
        var config = Ext.Object.merge(calculatorConfig, {
            granularity: this.lumenize.Time.WEEK,
            tz: this.config.timeZone,
            holidays: this.config.holidays,
            workDays: this._getWorkdays()
        });

        return new this.lumenize.TimeSeriesCalculator(config);
    }

});