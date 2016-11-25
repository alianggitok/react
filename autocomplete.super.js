/**
 * @module
 * @author Warren
 * @version 1.00
 */

'use strict';

var Autocomplete=React.createClass({
	getDefaultProps:function(){
		return {
			data:[],//原始选项源（未过滤的）
			layoutData:{},//布局
			maxItemLength:null,//最大匹配选项dom渲染数量
			listDown:false,//默认匹配选项列表收起
			beMatchValue:true,//是否匹配data中的value
			downForever:true,//是否始终在操作时打开，否则只在有值且有匹配数据才打开
			currentItemClassName:'current',//表示当前值所选项
			selectItemClassName:'select',//表示鼠标定位到的项
			onChange:function(){},
			value:'',
			'data-value':{
				label:'',
				value:''
			}
		};
	},
	getInitialState:function(){
		return {
			origData:this.props.data,
			filteredData:[],
			listDown:this.props.listDown,
			listStyle:{
				width:'auto',
				height:'auto',
				top:'55px',
				left:'0'
			},
			inputValue:this.props.value,
			completeValue:{
				label:'',
				value:''
			},
			ariaInfo:'',
			listMouseEnter:false
		};
	},
	componentDidMount:function(){
		var _class=this,
			input=_class.refs.input,
			listClassName='.'+_class.refs.list.className;
		_class.setListStyle();//初次装载设置样式
		$(window).on('mousedown.autocomplete',function(e){//点击的对象不在list上时收起
			if($(e.target).closest(listClassName).length<1&&!$(e.target).is($(input))){
				_class.setState({
					listDown:false
				});
				_class.setListStyle();
			}
		});
	},
	componentWillReceiveProps:function(props){
		this.setState({
			origData:props.data
		});
	},
	componentDidUpdate:function(){
	},
	setListStyle:function(){
		var box=$(this.refs.box);
		this.setState({
			listStyle:{
				width:box.outerWidth()+'px',
				height:'auto',
				top:box.outerHeight()-parseFloat(box.css('border-bottom-width'))-parseFloat(box.css('border-top-width'))+'px',
				left:'-2px'
			}
		});
	},
	filterData:function(inputValue){
		var _class=this,
			origData=_class.state.origData,
			data=JSON.parse(JSON.stringify(origData)),
			newData=[],
			regExpEx='.,\'\"[]()+-*?~!@#$%^&={}|\\\/<>:;`',
			regExp=(function(){
				var temp='';
				inputValue.split('').map(function(word,i){
					// console.log(word)
					if(regExpEx.indexOf(word)>=0){
						temp+=('\\'+word);
					}else{
						temp+=word;
					}
				});
				return eval('/(?:'+ temp +')+/i');
			}()),
			inputValueLowerCase=inputValue.toLowerCase();
		// console.log(regExp)

		if(inputValue){

			// console.time('filterData');
			(function(){
				var i,item;
				for(i=0;i<origData.length;i+=1){
					item=origData[i];
					if(inputValueLowerCase===item.value.toLowerCase()){
						newData.push(item);
						data.splice(i,1);
					}
				}

				for(i=0;i<data.length;i+=1){
					item=data[i];
					if(regExp.test(item.label)){
						newData.push(item);
					}
				}
			}());
			// console.timeEnd('filterData');

		}else{
			newData=data;
		}

		return newData;
	},
	change:function(event,inputValue,callback){
		var _class=this,
			inputValue=(function(){
				var temp;
				if(event){
					temp=inputValue?inputValue:event.target.value;
				}else{
					temp=inputValue;
				}
				return temp;
			}()),
			filteredData=_class.filterData(inputValue),
			nativeEvent=event?event.nativeEvent:null;

		_class.setState({
			filteredData:filteredData,
			listDown:(function(){
				var is=false;
				// console.log(_class.state.focus)
				if(_class.props.downForever){//是否始终在操作时打开
					is= (filteredData.length&&filteredData[0].label!==inputValue)?true:false;
				}else{//如果不是，则只在有值且有匹配数据才打开
					is= inputValue&&(filteredData.length&&filteredData[0].label!==inputValue)?true:false;
				}

				return is;
			}())
		});

		_class.setValue(inputValue,filteredData,function(){
			callback?callback():(function(){}());
			if(nativeEvent){
				_class.props.onChange(nativeEvent);
			}
		});

		// console.log(event)
		
	},
	setValue:function(inputValue,filteredData,callback){
		var _class=this;
		// console.log(inputValue,filteredData.length);
		_class.setState({
			inputValue:inputValue,
			completeValue:(function(){
				//如果没有匹配项，则value为当前输入的内容
				var temp={
					label:'',
					value:inputValue
				},
				condition={
					label:filteredData[0]?filteredData[0].label.toLowerCase()===inputValue.toLowerCase():false,
					value:filteredData[0]?(_class.props.beMatchValue?filteredData[0].value.toLowerCase()===inputValue.toLowerCase():false):false
				};
				
				//如果当前有输入值，且匹配至少一项，同时该匹配项中label或value全等于当前输入项，则设置label及value
				if(inputValue&&(condition.label||condition.value)){
					temp.label=filteredData[0].label;
					temp.value=filteredData[0].value;
				}
				return temp;
			}()),
			ariaInfo:inputValue
		},function(){
			callback?callback():(function(){}());
		});

	},
	select:function(inputValue){
		var _class=this;
		_class.change(null,inputValue,function(){
			_class.setState({
				listDown:false
			});
		});
	},
	inputEvents:function(){
		var _class=this,
			selectItemClassName=_class.props.selectItemClassName,
			currentItemClassName=_class.props.currentItemClassName;
		return{
			keyDown:function(event){
				// _class.change(event,event.target.value)
				if(_class.state.listDown){
					event.stopPropagation();//如果下拉展开，则停止该事件向上冒泡
				}
				var keyCode=event.keyCode||event.which,
					list=$(_class.refs.list),
					items=list.find('.item'),
					currentItem=items.filter('.'+currentItemClassName),
					selectItem=items.filter('.'+selectItemClassName),
					getValue=function(){
						return _class.state.listDown?(selectItem.text()||currentItem.text()):event.target.value;
					},
					letListDown=function(){
						if(!_class.state.listDown&&items.length){
							_class.setState({
								listDown:true
							});
						}
					},
					letListUp=function(){
						if(_class.state.listDown){
							_class.setState({
								listDown:false
							});
						}
					},
					scroll=function(actionIndex){
						var currentDom=items.eq(actionIndex),
							top=currentDom.position().top;

						list.scrollTop(top+list.scrollTop()-list.height()+currentDom.outerHeight());
					},
					setSelect=function(index,actionIndex){
						// console.log('setSelect:',index,actionIndex)
						letListDown();
						if(items.length){
							items.removeClass(selectItemClassName);
							items.eq(actionIndex).addClass(selectItemClassName);

							scroll(actionIndex);
						}
					};

				(function(){
					var index=items.index(selectItem),
						actionIndex=null,
						minIndex=0,
						maxIndex=items.length-1;

					switch(keyCode){
						case 36://home
							index=null;
							actionIndex=0;
							setSelect(index,actionIndex);
							break;
						case 35://end
							index=null;
							actionIndex=items.length-1;
							setSelect(index,actionIndex);
							break;
						case 38://up
							actionIndex=(index-1)<=minIndex?minIndex:(index-1);
							setSelect(index,actionIndex);
							break;
						case 40://down
							actionIndex=(index+1)>maxIndex?maxIndex:(index+1);
							setSelect(index,actionIndex);
							break;
						case 27://esc
							letListUp();
							break;
						case 9://tab
							letListUp();
							break;
						case 13://enter
							_class.change(event,getValue(),function(){
									letListUp();
							});
							if(_class.state.listDown){
								event.preventDefault();
							}
							break;
						default:
							_class.change(event,event.target.value,function(){
								items.removeClass(selectItemClassName);
								$(_class.refs.list).scrollTop(0);
							});
					}
				}());
				
			},
			keyPress:function(event){
				var keyCode=event.keyCode;
				
				if(_class.state.listDown){
					event.stopPropagation();//如果下拉展开，则停止该事件向上冒泡
					// event.preventDefault();
				}
			},
			keyUp:function(event){
				if(_class.state.listDown){
					event.stopPropagation();//如果下拉展开，则停止该事件向上冒泡
				}
				var keyCode=event.keyCode||event.which;

				if(keyCode===13){
					_class.setState({
						listDown:false
					});
					if(_class.state.listDown){
						event.preventDefault();
					}
				}
				
			},
			blur:function(event){
				_class.change(event,event.target.value,function(){
					if(!_class.state.listMouseEnter){
						_class.setState({
							listDown:false,
							listMouseEnter:false
						});
					}
				});
			},
			focus:function(event){
				_class.change(event,event.target.value);
			},
			click:function(event){
				_class.setListStyle();
			},
			doubleClick:function(){
				
			}
		};
	},
	listEvents:function(){
		var _class=this,
			selectItemClassName=_class.props.selectItemClassName;
		return {
			itemMouseOver:function(event){
				var itemDom=event.target,
					listClassName='.'+_class.refs.list.className;
				$(itemDom).closest(listClassName).find('.item').removeClass(selectItemClassName);
				$(itemDom).addClass(selectItemClassName);
				_class.setState({
					listMouseEnter:true
				});
			},
			itemMouseOut:function(event){
				var itemDom=event.target;
				// $(itemDom).removeClass(selectItemClassName);
				_class.setState({
					listMouseEnter:false
				});
			},
			itemClick:function(event){
				var list=$(_class.refs.list),
					selectItem=list.find('.'+selectItemClassName);
				_class.select(selectItem.text());
				_class.setState({
					listMouseEnter:true
				});
			}
		}
	},
	makeList:function(data){
		var _class=this,
			doms=[],
			groups=(function(){
				var i,x,group,
					has=0,temp=[],
					length=data.length;

				// console.time('groups');
				for(i=0;i<length;i+=1){
					has=0;
					group=data[i].group;
					for(x=0;x<temp.length;x+=1){
						if(temp[x]===group){
							has+=1;
							break;
						}
					}
					if(!has){
						temp.push(group);
					}
				}
				// console.timeEnd('groups');

				return temp;
			}()),
			events=_class.listEvents(),
			maxItemLength=_class.props.maxItemLength?_class.props.maxItemLength:data.length,
			pushedLength=0,
			itemClassName=_class.props.currentItemClassName+' '+_class.props.selectItemClassName;

		// console.time('make');
		(function(){
			var i,group,
				pushedLength=0;
			for(i=0;i<groups.length;i+=1){
				group=groups[i];
				if(pushedLength<maxItemLength){
					doms.push(
						<dl>
							{group?<dt className={'group'}>{group}</dt>:''}
							{
								(function(){
									var x,item,
										itemClassName=_class.props.currentItemClassName+' '+_class.props.selectItemClassName,
										temp=[];
									for(x=0;x<data.length;x+=1){
										item=data[x],
										itemClassName=(x===0&&_class.state.inputValue)?itemClassName:'';
										if(item.group===group&&pushedLength<maxItemLength){
											pushedLength+=1;
											temp.push(
												<dd className={'item '+itemClassName} value={item.value} itemID={x}
													onMouseEnter={(event)=>events.itemMouseOver(event)}
													onMouseLeave={(event)=>events.itemMouseOut(event)}
													onClick={(event)=>events.itemClick(event)}>
													{item.label}
												</dd>
											)
										}
									}
									return temp;
								}())
							}
						</dl>
					)
				}
			}
		}());
		// console.timeEnd('make');

		return doms;
	},

	render:function(){
		
		var _class=this,
			layoutData=_class.props.layoutData,
			labelName=layoutData.label?layoutData.label:'',
			labelClassName=layoutData.labelClassName ? layoutData.labelClassName : '',
			ariaInfo=_class.state.ariaInfo,
			index=_class.props.index?_class.props.index:'',
			name=layoutData.name+index,
			id=name,
			listDown=_class.state.listDown,
			listStyle=$.extend(_class.state.listStyle,{display:listDown?'block':'none'}),
			inputEvents=_class.inputEvents();

		return (
			<label className="ui-autocomplete" htmlFor={name} ref="wrapper">
				<span className={'display-label ' + labelClassName} >
					{labelName}
					{layoutData.required?<span className="star">*</span>:''}
				</span>
				<div className={'ui-autocomplete-box inline-block '+(listDown?'select-open':'')} ref="box">
					<span role="status" aria-live="assertive" className="sr-only">
						{ariaInfo}
					</span>
					<input name={name} id={id} ref="input" 
						placeholder={layoutData.placeholder?layoutData.placeholder:labelName} 
						autocomplete="off" role="combobox" aria-hidden="true" aria-autocomplete="both" 
						value={_class.state.inputValue} 
						data-value={JSON.stringify(_class.state.completeValue)} 
						onChange={(event)=>_class.change(event,null)} 
						onKeyDown={(event)=>inputEvents.keyDown(event)} 
						onKeyUp={(event)=>inputEvents.keyUp(event)} 
						onKeyPress={(event)=>inputEvents.keyPress(event)} 
						onBlur={(event)=>inputEvents.blur(event)} 
						onFocus={(event)=>inputEvents.focus(event)} 
						onClick={(event)=>inputEvents.click(event)} 
						onDoubleClick={(event)=>inputEvents.doubleClick(event)}
					/>
					<div className="autocomplete-list" style={listStyle} ref="list">
						{listDown?_class.makeList(_class.state.filteredData):''}
					</div>
				</div>
			</label>
		)
		
	}
});






/*

var layoutData={
	label:"to",
	name:"to",
	options:data,
	required:true,
	space:6,
	type:"autocomplete",
	value:""
}

ReactDOM.render(
	<Autocomplete layoutData={layoutData} data={layoutData.options} maxItemLength={20}/>,
	$('#autocomplete').get(0)
);
*/

module.exports=Autocomplete;