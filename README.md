# 基于FSM的组件设计

有限状态机（FSM）（[维基百科](http://www.google.com.hk/url?sa=t&rct=j&q=有限状态机&source=web&cd=1&ved=0CCUQFjAA&url=http%3A%2F%2Fzh.wikipedia.org%2Fzh%2F%25E6%259C%2589%25E9%2599%2590%25E7%258A%25B6%25E6%2580%2581%25E6%259C%25BA&ei=5qFiUK_cF4STiAe53ID4Dg&usg=AFQjCNHgeiLvIwRpynGNcu3_L9ceXKrP_Q)）是设计和实现事件驱动程序内复杂行为组织原则的有力工具

早在2007年，IBM的工程师就提出在在JAVASCRIPT中使用有限状态机来实现组件的方法，原文地址如下：

《JavaScript 中的有限状态机》http://www.ibm.com/developerworks/cn/web/wa-finitemach/

现在结合KISSY等现代JS库和框架提供的强大的自定义事件的功能，我们可以利用有限状态机设计出代码层次清晰，结构优雅的前端交互组件。

今天，我们会通过设计并实现一个下拉选择（模拟select）组件来一步步说明如何利用FSM和KISSY来设计和实现一个有复杂行为的交互组件。

我们的工作会分成三个步骤来进行：
 * 第一步：设计组件状态，用户行为和组件行为
 * 第二步：通过代码来描述设计出来的内容
 * 第三步：实现一个有限状态机让组件工作起来

=====第一步：设计阶段=======

首先，我们需要确定组件的状态和状态间的转换关系

通过对组件可能会发生的行为进行研究，我们为组件设计了以下三个状态：

1.收起状态（fold）:
组件的初始状态，用户可能会进行以下操作：

    展开下拉框（unfoldmenu）转移到展开状态（unfold）


2.展开状态（unfold）:
用户展开下拉框的状态，用户可能会进行以下操作：

    收起下拉框（foldmenu）转移到收起状态（fold）
    鼠标经过选项（overitem）转移到高亮状态（highlight）


3.高亮状态（highlight）:
鼠标经过选项时，高亮经过的选项，用户可能会进行以下操作：

    收起下拉框（foldmenu）转移到收起状态（fold）
    点击选项（clickitem）转移到收起状态（fold）
    鼠标经过选项（overitem）转移到高亮状态（highlight）


以上就是这个小组件可能会有的三种状态，用一个状态转换图来表示如下：
在状态描述中包含了触发状态发生转移的动作（事件）
可以很明显的看出这些事件并不是浏览器中原生的事件。
这里，我们使用自定义事件来描述用户的行为，这样我们可以使得用户行为和组件行为的逻辑完全分离，代码将会更容易理解和维护。


定义用户行为：
在这个组件里，我们有以下四种用户行为：

    展开下拉框（unfoldmenu）：鼠标点击橙色区域时触发
    收起下拉框（foldmenu）：鼠标离开组件区域达到2秒，点击橙色区域，点击组件外部区域
    点击选项（clickitem）：点击下拉框中的某个选项
    鼠标经过选项（overitem）：鼠标经过下拉框中的某个选项

定义组件行为：
在状态转移的过程中，组件本身会有很多动作，如显示下拉框等，我们接下来在上面的状态图中加入转移过程中组件的动作

    fold():收起下拉框
    unfold():展开下拉框
    highlightItem():高亮某个选项
    selectItem():选中某个选项，并把值填充到橘黄色区域

=====第二步：实现阶段（基于KISSY实现）=======
全局变量：S=KISSY, D=S.DOM, E=S.Event

1.描述状态
跟设计过程一样，我们需要用一个结构来描述状态的转移以及转移过程中的动作
我们在这里使用对象来描述：

    "fold":{

        unfoldmenu:function(event){

            _this.unfold();

            return "unfold";

        }
    }

如上面这段代码就描述了在fold状态下，可以触发unfoldmenu这个用户行为来转移到unfold状态，
我们通过函数返回值的形式来通知FSM下一步的状态。
这样，我们就可以通过这种形式描述所有的状态，结构如下：
	
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
	}

在定义好状态后，我们还需要设定一个初始状态：

	initState:"fold"

2.描述用户行为
我们使用一个方法来描述用户行为，即驱动FSM发生状态转移的事件：

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
    }

如上面这个代码就定义了foldmenu这个用户行为，同时，FSM会自动将它定义为一个自定义事件，我们通过传入的回调函数fn来通知FSM触发这个事件的时机。
通过上边的例子可以看出，我们可以将一个很复杂的动作定义为一个用户行为，也可以将几个不同的动作定义为一个用户行为，将用户行为和组件的动作彻底分开。
与状态相同，我们也将所有的用户行为放在一个对象中。

	events:{
	
	    "unfoldmenu":function(fn){
	
	    },
	
	    "foldmenu":function(fn){
	
	    },
	
	    "overitem":function(fn){
	
	    },
	
	    "clickitem":function(fn){
	
	    }
	}

3.描述组件行为
由于组件行为一般都包含对组件本身的一些直接操作，可以作为API开放给用户使用，因此我们把描述组件行为的方法放在组件的prototype上，这部分代码如下：

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
	
	        _this.isFold = false;
	
	        D.show(slideBox);
	
	    },
	
	    fold:function(){
	
	        var _this = this,
	
	        options = _this.options,
	
	        slideBox = _this.slideBox;
	
	        if(_this.isFold)return;
	
	        D.removeClass(options,"hover");
	
	        _this.isFold = true;
	
	        D.hide(slideBox);
	
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

=====第三步：实现有限状态机（基于KISSY实现）=======

前面我们定义了组件的状态，用户行为，以及组件本身的动作，
接下来我们来实现一个有限状态机（FSM），让整个组件工作起来。

通过上面实现的代码，我们可以看出FSM的输入有以下三个：
1.初始状态
2.状态描述对象
3.用户行为描述对象

代码结构如下：

	initState:"fold",
	states:{	
	    //收起（初始状态）
	    "fold":{
	
	    },
	
	    //展开状态
	    "unfold":{
	
	    },
	
	    //高亮状态
	    "highlight":{
	
	    }   
	},
	
	events:{
	
	    "unfoldmenu":function(fn){
	
	    },
	
	    "foldmenu":function(fn){
	
	    },
	
	    "overitem":function(fn){
	
	    },
	
	    "clickitem":function(fn){
	
	    }
	}

FSM需要2个功能：
1.将用户行为与自定义事件相关联（defineEvents）
2.在用户行为发生时（即触发自定义事件时），根据状态描述对象来转移状态（handleEvents）

代码如下：

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
	
	    //定义事件 (行为层)
	
	    defineEvents:function(){
	
	        var _this = this,
	
	        events = this.events;
	
	        for(k in events){
	
	            (function(k){
	
	                var fn = events[k];
	
	                fn.call(_this,function(event){
	
	                    _this.fire(k,event);
	
	                });
	
	                _this.on(k,_this.handleEvents);
	
	            })(k)
	
	        }
	
	    }
	
	}
	S.augment(FSM, S.EventTarget, proto);

然后，只需要实例化一个FSM即可

	new FSM({
	     initState:"fold",
	     states:{...},
	     events:{...}
	});

最后，总结一下。
使用FSM模式设计和实现交互组件，可以获得以下特性：
1.交互逻辑清晰
2.用户行为和组件行为完全分离，代码具有良好的分层结构
3.对设计具有良好的纠错特性，当设计上对状态和状态的转移有遗漏时，在实现阶段很容易流程出现走不通的情况，可以促进交互设计对细节的补充。




