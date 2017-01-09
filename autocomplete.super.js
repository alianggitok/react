/**
 * @module depend by jQuery & react
 * @author Warren
 * @version 1.00
 */

'use strict';

var ariaTimer=null;
var Autocomplete=React.createClass({
	getDefaultProps:function(){
		return {
			i18n:uiComponentI18n.AUTOCOMPLETE,//国际化数据
			id:'',
			index:'',
			data:[],//原始选项源（未过滤的）
			layoutData:{},//布局
			maxItemLength:null,//最大匹配选项dom渲染数量
			listDown:false,//默认匹配选项列表收起
			beMatchValue:true,//是否匹配data中的value
			downForever:true,//是否始终在操作时打开，否则只在有值且有匹配数据才打开
			currentItemClassName:'current',//表示当前值所选项
			selectItemClassName:'select',//表示鼠标定位到的项
			onChange:function(){},//默认的onChange事件
			value:'',//赋值
			'data-value':{//完整的 label & value
				label:'',
				value:''
			}
		};
	},
	getInitialState:function(){
		return {
			id:this.props.id?this.props.id:(this.props.layoutData.name+this.props.index),
			origData:this.props.data,//源数据
			filteredData:[],//过滤后数据
			listDown:this.props.listDown,//匹配列表收展
			listStyle:{
				width:'auto',
				height:'auto',
				top:$(this.refs.box).outerHeight()+'px',
				left:'0'
			},
			listMouseEntered:false,//鼠标坐标是否在list上
			inputValue:this.props.value,
			completeValue:{
				label:'',
				value:''
			},
			ariaSelectedOptionLabel:'',
			ariaSelectedOptionID:'',
			ariaTxt:''
		};
	},
	componentDidMount:function(){
		var _class=this,
			input=_class.refs.input,
			listClassName='.'+_class.refs.list.className,
			eventMouseDownName='mousedown.autocomplete'+_class.state.id,
			eventResizeName='resize.autocomplete'+_class.state.id;
		_class.setListStyle();//初次装载设置样式
		$(document).off(eventMouseDownName).on(eventMouseDownName,function(e){//点击的对象不在list上时收起
			if($(e.target).closest(listClassName).length<1&&!_class.state.listMouseEntered&&!$(e.target).is($(input))){
				_class.setState({
					listDown:false
				});
			}
		});
		$(window).off(eventResizeName).on(eventResizeName,function(e){//窗体大小调整时关闭匹配列表
			if(_class.state.listDown){
				_class.setState({
					listDown:false
				});
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
			list=$(_class.refs.list),
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
					is= (filteredData.length>0&&filteredData[0].label!==inputValue)?true:false;
				}else{//如果不是，则只在有值且有匹配数据才打开
					is= inputValue&&(filteredData.length>0&&filteredData[0].label!==inputValue)?true:false;
				}
				return is;
			}())
		});
		_class.setValue(inputValue,filteredData,function(){//与listdown的state同步（至少提前）设置，避免失焦而影响中文输入法
			callback?callback():(function(){}());
			if(nativeEvent){
				if(nativeEvent.target){
					_class.props.onChange(nativeEvent);
				}
			}
		});
		if(!_class.state.listMouseEntered){
			list.scrollTop(0);
		}
		

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
			}())
		},function(){
			callback?callback():(function(){}());
			// console.log('inputValue:','"'+inputValue+'"');
			_class.setAria(0);
		});
	},
	setAria:function(itemIndex){
		var _class=this,
			i18n=_class.props.i18n,
			selectedItem=$(_class.refs.list).find('.item.'+_class.props.selectItemClassName),
			inputValue=_class.state.inputValue,
			filteredData=_class.state.filteredData,
			itemLabel=filteredData.length>0?selectedItem.text():'',
			itemID=_class.state.id+'_autocomplete_option_'+itemIndex;
		_class.setState({
			ariaSelectedOptionLabel:'',
			ariaSelectedOptionID:'',
			ariaTxt:''
		},function(){
			clearTimeout(ariaTimer);
			ariaTimer=null;
			ariaTimer=setTimeout(function(){
				_class.setState({
					ariaSelectedOptionLabel:itemLabel,
					ariaSelectedOptionID:filteredData.length>0?itemID:'',
					ariaTxt:(function(){
						var txt='',
							typingTxt=inputValue?i18n.ARIA.TYPE.replace('{words}',inputValue):'',
							selectedTxt=(filteredData.length>0&&selectedItem.length>0)?
								i18n.ARIA.SELECTED.replace('{label}',itemLabel).replace('{length}',filteredData.length):
								i18n.ARIA.NOMATCHED;
						txt=selectedItem.length>0?typingTxt+selectedTxt:'';
						// console.log('aria:',txt);
						return txt;
					}())
				});
			},600);
		});
	},
	inputEvents:function(){
		var _class=this,
			selectItemClassName=_class.props.selectItemClassName,
			currentItemClassName=_class.props.currentItemClassName;
		return{
			keyDown:function(event){
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
						if(!_class.state.listDown&&items.length>0){
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
					setSelect=function(actionIndex,beScroll){
						// console.log('setSelect:',actionIndex)
						if(typeof(beScroll)==='undefined'){
							beScroll=true;
						}
						letListDown();
						if(items.length>0){
							items.removeClass(selectItemClassName).attr('aria-selected','false');
							items.eq(actionIndex).addClass(selectItemClassName).attr('aria-selected','true');
							_class.setAria(actionIndex);
							if(beScroll){
							scroll(actionIndex);
							}
						}
					};

				(function(){
					var index=items.index(selectItem),
						actionIndex=null,
						minIndex=0,
						maxIndex=items.length-1;

					switch(keyCode){
						case 36://home
							// event.preventDefault();
							actionIndex=0;
							setSelect(actionIndex);
							break;
						case 35://end
							// event.preventDefault();
							actionIndex=items.length-1;
							setSelect(actionIndex);
							break;
						case 38://up
							event.preventDefault();
							actionIndex=(index-1)<=minIndex?minIndex:(index-1);
							setSelect(actionIndex);
							break;
						case 40://down
							event.preventDefault();
							actionIndex=(index+1)>maxIndex?maxIndex:(index+1);
							setSelect(actionIndex);
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
								setSelect(0,false);
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
					// event.preventDefault();
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
				// console.log(event.type)
				_class.change(event,event.target.value,function(){
					if(!_class.state.listMouseEntered){
						_class.setState({
							listDown:false,
							listMouseEntered:false
						});
					}
				});
			},
			focus:function(event){
				_class.setListStyle();
				_class.change(event,event.target.value,function(){
					_class.setState({
						listMouseEntered:false
					});
				});
			},
			click:function(event){
			},
			doubleClick:function(event){
				
			}
		};
	},
	listEvents:function(){
		var _class=this,
			selectItemClassName=_class.props.selectItemClassName;
		return {
			listMouseOver:function(event){
				_class.setState({
					listMouseEntered:true
				});
			},
			listMouseOut:function(event){
				_class.setState({
					listMouseEntered:false
				});
			},
			itemMouseOver:function(event){
				var items=$(_class.refs.list).find('.item'),
					itemDom=event.target,
					listClassName='.'+_class.refs.list.className,
					index=items.index($(itemDom));
				$(itemDom).closest(listClassName).find('.item').removeClass(selectItemClassName).attr('aria-selected','false');
				$(itemDom).addClass(selectItemClassName).attr('aria-selected','true');
				// console.log(index)
				_class.setState({
					listMouseEntered:true
				},function(){
					_class.setAria(index);
				});
			},
			itemMouseOut:function(event){
				var itemDom=event.target;
				// $(itemDom).removeClass(selectItemClassName);
				_class.setState({
					listMouseEntered:false
				});
			},
			itemClick:function(event){
				var list=$(_class.refs.list),
					selectItem=list.find('.'+selectItemClassName);
				// console.log(_class.refs.input)
				_class.refs.input.focus();
				_class.change(null,selectItem.text(),function(){
					_class.setState({
						listDown:false,
						listMouseEntered:true
					});
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
			itemClassName='';

		// console.time('make');
		(function(){
			var i,group,
				pushedLength=0;
			for(i=0;i<groups.length;i+=1){
				group=groups[i];
				if(pushedLength<maxItemLength){
					doms.push(
						<dl>
							{group?<dt aria-hidden="true" className={'group'}>{group}</dt>:''}
							{
								(function(){
									var x,item,
										temp=[];
									for(x=0;x<data.length;x+=1){
										item=data[x];
										if(item.group===group&&pushedLength<maxItemLength){
											pushedLength+=1;
											itemClassName=(x===0&&_class.state.inputValue)?(_class.props.currentItemClassName+' '+_class.props.selectItemClassName):'';
											temp.push(
												<dd role="option" id={_class.state.id+'_autocomplete_option_'+x} className={'item '+itemClassName} value={item.value} itemID={x} 
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
	clear:function(event){
		event.preventDefault();
		var _class=this;
		_class.change(null,'',function(){
			_class.refs.input.focus();
		});
	},
	clearBtn:function(){
		var _class=this,
			clearBtn=_class.refs.clear;
		return {
			style:{
				'position':'absolute',
				'top':$(_class.refs.box).height()/2-8+'px',
				'right':'25px',
				'height':'16px',
				'font-size':'16px',
				'line-height':'16px',
				'text-decoration':'none',
				'border':'none',
				'overflow':'hidden',
				'display':'none'
			},
			show:function(){
				$(clearBtn).show();
			},
			hide:function(){
				$(clearBtn).hide();
			}
		};
	},
	render:function(){
		
		var _class=this,
			i18n=_class.props.i18n,
			layoutData=_class.props.layoutData,
			labelName=layoutData.label?layoutData.label:'',
			labelClassName=layoutData.labelClassName ? layoutData.labelClassName : '',
			ariaTxt=_class.state.ariaTxt,
			// ariaSelectedOptionLabel=_class.state.ariaSelectedOptionLabel,
			// ariaSelectedOptionID=_class.state.ariaSelectedOptionID,
			id=_class.state.id,
			listDown=_class.state.listDown,
			listStyle=$.extend(_class.state.listStyle,{display:listDown?'block':'none'}),
			listEvents=_class.listEvents(),
			inputEvents=_class.inputEvents(),
			clearBtn=_class.clearBtn();

		return (
			<label className="ui-autocomplete" htmlFor={id} ref="wrapper">
				<span id={id+'_autocomplete_label'} className={'display-label ' + labelClassName} >
					{labelName}
					{layoutData.required?<span className="star">*</span>:''}
				</span>
				<div ref="box" className={'ui-autocomplete-box inline-block '+(listDown?'select-open':'')} 
					onMouseEnter={clearBtn.show} onMouseLeave={clearBtn.hide}>
					<input ref="input" name={id} id={id} type="text" role="combobox" 
						aria-autocomplete="both" 
						aria-expanded={listDown} 
						// aria-haspopup={listDown} 
						aria-required={layoutData.required?'true':'false'} 
						// aria-owns={id+'_autocomplete_list '+id+'_autocomplete_aria'} 
						// aria-label={ariaSelectedOptionLabel||ariaTxt} 
						// aria-valuetext={ariaSelectedOptionLabel||ariaTxt} 
						// aria-activedescendant={ariaSelectedOptionID} 
						// aria-controls={id+'_autocomplete_list'} 
						aria-flowto={id+'_autocomplete_aria'} 
						autoComplete="off" 
						placeholder={layoutData.placeholder?layoutData.placeholder:labelName} 
						value={_class.state.inputValue} 
						data-value={JSON.stringify(_class.state.completeValue)} 
						onChange={event=>_class.change(event)} 
						onInput={event=>_class.change(event)} 
						onKeyDown={event=>inputEvents.keyDown(event)} 
						onKeyUp={event=>inputEvents.keyUp(event)} 
						onKeyPress={event=>inputEvents.keyPress(event)} 
						onBlur={event=>inputEvents.blur(event)} 
						onFocus={event=>inputEvents.focus(event)} 
						onClick={event=>inputEvents.click(event)} 
						onDoubleClick={event=>inputEvents.doubleClick(event)} 
					/>
					<div role="listbox" id={id+'_autocomplete_list'} ref="list" className="autocomplete-list" style={listStyle} 
						onMouseEnter={event=>listEvents.listMouseOver(event)} 
						onMouseLeave={event=>listEvents.listMouseOut(event)} 
						aria-hidden="true">
						{listDown?_class.makeList(_class.state.filteredData):''}
					</div>
					<span role="status" id={id+'_autocomplete_aria'} ref="aria" className="sr-only" aria-live="assertive">
						{ariaTxt}
					</span>
					<a role="button" className="clearBtn" ref="clear" aria-hidden="true" style={clearBtn.style} onClick={event=>_class.clear(event)}>
						&times;<span className="sr-only">{i18n.CLEAR}</span>
					</a>
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