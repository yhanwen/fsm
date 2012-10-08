var FSMWidgets, SlideMenuGlobal;
(function(){
    var S = KISSY, D = S.DOM, E = S.Event;
    
    function FSM(config){
        this.config = config;
        this.currentState = this.config.initState;
        this.nextState = null;
        this.states = this.config.states;
        this.events = this.config.events;
        
        this.defineEvents();
    }


    var proto = {
        //事件驱动状态转换(表现层)
        handleEvents:function(event){
            if(!this.currentState)return;
            
            var actionTransitionFunction = this.states[this.currentState][event.type];
            if(!actionTransitionFunction)return;
            var nextState = actionTransitionFunction.call(this,event);
            this.currentState = nextState;
        },
        //直接触发一个状态转换
        doTransition:function(state,type,event){
            var actionTransitionFunction = this.states[state][type];
            if(!actionTransitionFunction)return;
            var nextState = actionTransitionFunction.call(this,event);
            this.currentState = nextState;
        },
        //定义事件 (行为层)
        defineEvents:function(){
            var _this = this,
            events = this.events;
            S.each(events,function(fn,k){
                fn.call(_this,function(event){
                    _this.fire(k,event);
                });
                _this.on(k,_this.handleEvents);
            });
        }
    }
    S.augment(FSM, S.EventTarget, proto);
    /**
     * 
     * @param {Object} config
     * config = {
     *     selectCls:"",
     *     boxCls:"",
     *     optionCls:""
     * }
     */
    function SlideMenu(container,config){
        var _this = this;
        _this.config = S.mix({
            selectCls:"k-select",
            boxCls:"k-box",
            optionCls:"k-option"
        },config);
        
        //获取组件DOM节点
        _this.container = D.get(container);
        
        //组件当前值的文字容器
        var select = _this.select = D.get("."+_this.config.selectCls,_this.container);
        var options = _this.options = D.query("."+_this.config.optionCls,_this.container);
        var slideBox = _this.slideBox = D.get("."+_this.config.boxCls);
        
        //记录当前值，值写在option的data-value属性上
        _this.value = D.attr(select,"data-value")||D.attr(options[0],"data-value");
        _this.text = D.attr(select,"data-text")||D.attr(options[0],"data-text");;
        _this.setText();
        
        //标志位
        _this.isFold = true;
        
        
        //FSM配置参数
        var stateConfig = {
            initState:"fold",
            states:{
                //收起（初始状态）
                "fold":{
                    unfoldmenu:function(event){
                        _this.unfold();
                        return "unfold";
                    }
                },
                //展开状态
                "unfold":{
                    foldmenu:function(event){
                        _this.fold();
                        return "fold";
                    },
                    overitem:function(event){
                        _this.highlightItem(event.currentItem);
                        return "highlight";
                    }
                },
                //高亮状态
                "highlight":{
                    foldmenu:function(event){
                        _this.fold();
                        return "fold";
                    },
                    //选中条目
                    clickitem:function(event){
                        _this.selectItem(event.currentItem);
                        return "fold";
                    },
                    overitem:function(event){
                        _this.highlightItem(event.currentItem);
                        return "highlight";
                    }
                }   
            },
            //定义用户行为
            events:{
                "unfoldmenu":function(fn){
                    E.on(_this.container,"click",function(e){
                        if(_this.isFold==true)fn();
                    });
                },
                "foldmenu":function(fn){
                    var timeout;
                    E.on(_this.container,"mouseleave",function(e){
                        if(timeout)clearTimeout(timeout);
                        timeout = setTimeout(function(){
                            fn();
                        },1000);
                    });
                    E.on([_this.container,_this.slideBox],"mouseenter",function(e){
                        if(timeout)clearTimeout(timeout);
                    });
                    E.on("body","click",function(e){
                        var target = e.target;
                        if(!D.get(target,_this.container)){
                            if(timeout)clearTimeout(timeout);
                            fn();
                        } 
                    });
                    E.on(_this.select,"click",function(e){
                        if(_this.isFold==false)fn();
                    });
                },
                "overitem":function(fn){
                    S.each(options,function(op){
                        E.on(op,"mouseenter",function(e){
                            var curItem = e.currentTarget;
                            fn({
                                currentItem:curItem
                            });
                        });
                    });
                },
                "clickitem":function(fn){
                    E.on(options,"click",function(e){
                        e.halt();
                        var curItem = e.currentTarget;
                        fn({
                            currentItem:curItem
                        });
                    });
                }
            }
        }
        //启动有限状态机
        _this.FSM = new FSM(stateConfig);
    }
    S.augment(SlideMenu,S.EventTarget,{
        setText:function(){
            var _this = this,
            select = _this.select;
            
            D.html(select,_this.text);
        },
        unfold:function(){
            var _this = this,
            slideBox = _this.slideBox;
            if(!_this.isFold)return;
            
            S.one(slideBox).fadeIn(0.3,function(){
            	_this.isFold = false;
            });
        },
        fold:function(){
            var _this = this,
            options = _this.options,
            slideBox = _this.slideBox;
            if(_this.isFold)return;
            D.removeClass(options,"hover");
            
            S.one(slideBox).slideUp(0.2,function(){
            	_this.isFold = true;
            });
        },
        highlightItem:function(curItem){
            var _this = this,
            options = _this.options;
            D.removeClass(options,"hover");
            D.addClass(curItem,"hover");
        },
        selectItem:function(curItem){
            var _this = this,
            value = D.attr(curItem,"data-value"),
            text = D.attr(curItem,"data-text");
            _this.value = value;
            _this.text = text;
            _this.setText()
            _this.fold();
            _this.fire("select",{
                value:value,
                text:text
            });
        }
    });
    SlideMenuGlobal = SlideMenu;
})()
